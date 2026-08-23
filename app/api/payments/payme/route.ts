import { NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import {
  PaymeError,
  PaymeState,
  paymeCheckAuth,
  paymeStateOf,
  fromTiyin,
} from "@/lib/payments/core";
import { paymeConfig } from "@/lib/payments/config";
import { loadOpenBill } from "@/lib/payments/bill";
import { sendPaymentToTelegram } from "@/lib/telegram";
import { notifyWaiters } from "@/lib/realtime";

/**
 * Payme Merchant API (JSON-RPC поверх POST). Payme дёргает этот endpoint
 * сам: проверка счёта, создание/проведение/отмена транзакции, сверка.
 * Суммы протокола — в тийинах; в БД храним сумы.
 * Счёт (account.bill_id) = id открытой сессии стола.
 */

type RpcRequest = {
  id?: number;
  method?: string;
  params?: {
    id?: string;
    time?: number;
    amount?: number;
    account?: { bill_id?: string };
    reason?: number;
    from?: number;
    to?: number;
  };
};

const msg = (ru: string, en: string) => ({ ru, en, uz: ru });

function rpcError(id: number | undefined, code: number, text: string, data?: string) {
  return NextResponse.json({
    id: id ?? null,
    error: { code, message: msg(text, text), ...(data ? { data } : {}) },
  });
}

function rpcResult(id: number | undefined, result: unknown) {
  return NextResponse.json({ id: id ?? null, result });
}

const ms = (d: Date | null) => (d ? d.getTime() : 0);

function txnView(p: typeof payments.$inferSelect) {
  return {
    id: p.providerTxnId,
    time: ms(p.providerCreateTime),
    amount: p.amount * 100,
    account: { bill_id: p.sessionId },
    create_time: ms(p.providerCreateTime),
    perform_time: ms(p.performTime),
    cancel_time: ms(p.cancelTime),
    transaction: p.id,
    state: paymeStateOf(p),
    reason: p.cancelReason ?? null,
  };
}

export async function POST(request: Request) {
  const config = paymeConfig();
  // Провайдер не подключён — не раскрываем даже существование endpoint'а
  if (!config) return new NextResponse("Not found", { status: 404 });

  if (!paymeCheckAuth(request.headers.get("authorization"), config.key)) {
    return rpcError(undefined, PaymeError.InvalidAuth, "Unauthorized");
  }

  let body: RpcRequest;
  try {
    body = (await request.json()) as RpcRequest;
  } catch {
    return rpcError(undefined, PaymeError.ParseError, "Parse error");
  }
  const { id, method, params = {} } = body;

  try {
    switch (method) {
      // ── Можно ли выставить счёт на эту сумму? ──
      case "CheckPerformTransaction": {
        const bill = await loadOpenBill(params.account?.bill_id ?? "");
        if (!bill) {
          return rpcError(id, PaymeError.AccountNotFound, "Счёт не найден или закрыт", "bill_id");
        }
        if (bill.due <= 0) {
          return rpcError(id, PaymeError.AccountBusy, "Счёт уже оплачен", "bill_id");
        }
        // Сверяем с ОСТАТКОМ: после онлайн-оплаты и дозаказа платится разница
        if (fromTiyin(params.amount ?? 0) !== bill.due) {
          return rpcError(id, PaymeError.InvalidAmount, "Неверная сумма");
        }
        return rpcResult(id, { allow: true });
      }

      // ── Создать транзакцию (идемпотентно по id Payme) ──
      case "CreateTransaction": {
        const txnId = params.id ?? "";
        const [existing] = await db
          .select()
          .from(payments)
          .where(and(eq(payments.provider, "payme"), eq(payments.providerTxnId, txnId)));
        if (existing) {
          if (paymeStateOf(existing) !== PaymeState.Created) {
            return rpcError(id, PaymeError.CannotPerform, "Транзакция уже завершена");
          }
          return rpcResult(id, {
            create_time: ms(existing.providerCreateTime),
            transaction: existing.id,
            state: PaymeState.Created,
          });
        }

        const bill = await loadOpenBill(params.account?.bill_id ?? "");
        if (!bill) {
          return rpcError(id, PaymeError.AccountNotFound, "Счёт не найден или закрыт", "bill_id");
        }
        if (bill.due <= 0) {
          return rpcError(id, PaymeError.AccountBusy, "Счёт уже оплачен", "bill_id");
        }
        if (fromTiyin(params.amount ?? 0) !== bill.due) {
          return rpcError(id, PaymeError.InvalidAmount, "Неверная сумма");
        }
        // Одна активная транзакция на счёт: вторая параллельная — отказ
        const [busy] = await db
          .select({ id: payments.id })
          .from(payments)
          .where(and(eq(payments.sessionId, bill.sessionId), eq(payments.state, "created")));
        if (busy) {
          return rpcError(id, PaymeError.AccountBusy, "По счёту уже идёт оплата", "bill_id");
        }

        const createTime = new Date(params.time ?? Date.now());
        const [created] = await db
          .insert(payments)
          .values({
            sessionId: bill.sessionId,
            provider: "payme",
            providerTxnId: txnId,
            amount: bill.due,
            providerCreateTime: createTime,
          })
          .returning();
        return rpcResult(id, {
          create_time: ms(created.providerCreateTime),
          transaction: created.id,
          state: PaymeState.Created,
        });
      }

      // ── Провести платёж (деньги списаны) ──
      case "PerformTransaction": {
        const [p] = await db
          .select()
          .from(payments)
          .where(and(eq(payments.provider, "payme"), eq(payments.providerTxnId, params.id ?? "")));
        if (!p) return rpcError(id, PaymeError.TransactionNotFound, "Транзакция не найдена");
        if (p.state === "paid") {
          // идемпотентный повтор
          return rpcResult(id, {
            transaction: p.id,
            perform_time: ms(p.performTime),
            state: PaymeState.Performed,
          });
        }
        if (p.state === "cancelled") {
          return rpcError(id, PaymeError.CannotPerform, "Транзакция отменена");
        }

        const [paid] = await db
          .update(payments)
          .set({ state: "paid", performTime: new Date(), updatedAt: new Date() })
          .where(and(eq(payments.id, p.id), eq(payments.state, "created")))
          .returning();
        if (!paid) return rpcError(id, PaymeError.CannotPerform, "Не удалось провести");

        const bill = await loadOpenBill(p.sessionId);
        await sendPaymentToTelegram("payme", bill?.tableNumber ?? "?", p.amount).catch(() => {});
        await notifyWaiters();
        return rpcResult(id, {
          transaction: paid.id,
          perform_time: ms(paid.performTime),
          state: PaymeState.Performed,
        });
      }

      // ── Отменить транзакцию ──
      case "CancelTransaction": {
        const [p] = await db
          .select()
          .from(payments)
          .where(and(eq(payments.provider, "payme"), eq(payments.providerTxnId, params.id ?? "")));
        if (!p) return rpcError(id, PaymeError.TransactionNotFound, "Транзакция не найдена");
        if (p.state === "cancelled") {
          return rpcResult(id, {
            transaction: p.id,
            cancel_time: ms(p.cancelTime),
            state: paymeStateOf(p),
          });
        }

        const [cancelled] = await db
          .update(payments)
          .set({
            state: "cancelled",
            paidBeforeCancel: p.state === "paid",
            cancelTime: new Date(),
            cancelReason: params.reason ?? null,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, p.id))
          .returning();
        await notifyWaiters();
        return rpcResult(id, {
          transaction: cancelled.id,
          cancel_time: ms(cancelled.cancelTime),
          state: paymeStateOf(cancelled),
        });
      }

      // ── Статус транзакции ──
      case "CheckTransaction": {
        const [p] = await db
          .select()
          .from(payments)
          .where(and(eq(payments.provider, "payme"), eq(payments.providerTxnId, params.id ?? "")));
        if (!p) return rpcError(id, PaymeError.TransactionNotFound, "Транзакция не найдена");
        const v = txnView(p);
        return rpcResult(id, {
          create_time: v.create_time,
          perform_time: v.perform_time,
          cancel_time: v.cancel_time,
          transaction: v.transaction,
          state: v.state,
          reason: v.reason,
        });
      }

      // ── Сверка за период ──
      case "GetStatement": {
        const from = new Date(params.from ?? 0);
        const to = new Date(params.to ?? Date.now());
        const rows = await db
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.provider, "payme"),
              gte(payments.providerCreateTime, from),
              lte(payments.providerCreateTime, to)
            )
          );
        return rpcResult(id, { transactions: rows.map(txnView) });
      }

      default:
        return rpcError(id, PaymeError.MethodNotFound, "Метод не найден");
    }
  } catch (e) {
    console.error("Payme callback failed:", e);
    return rpcError(id, PaymeError.CannotPerform, "Внутренняя ошибка");
  }
}
