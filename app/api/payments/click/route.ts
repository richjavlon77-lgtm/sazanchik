import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import {
  ClickError,
  clickCheckSign,
  type ClickRequest,
} from "@/lib/payments/core";
import { clickConfig } from "@/lib/payments/config";
import { loadOpenBill } from "@/lib/payments/bill";
import { sendPaymentToTelegram } from "@/lib/telegram";
import { notifyWaiters } from "@/lib/realtime";

/**
 * Click SHOP-API: один endpoint на оба колбэка (action=0 prepare,
 * action=1 complete), form-encoded POST, подпись md5.
 * merchant_trans_id (наш transaction_param) = id открытой сессии стола.
 */

function reply(req: Partial<ClickRequest>, extra: Record<string, unknown>) {
  return NextResponse.json({
    click_trans_id: req.click_trans_id,
    merchant_trans_id: req.merchant_trans_id,
    ...extra,
  });
}

const fail = (req: Partial<ClickRequest>, error: number, note: string) =>
  reply(req, { error, error_note: note });

export async function POST(request: Request) {
  const config = clickConfig();
  if (!config) return new NextResponse("Not found", { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: ClickError.BadRequest, error_note: "Bad request" });
  }
  const f = (k: string) => String(form.get(k) ?? "");
  const req: ClickRequest = {
    click_trans_id: f("click_trans_id"),
    service_id: f("service_id"),
    merchant_trans_id: f("merchant_trans_id"),
    merchant_prepare_id: f("merchant_prepare_id") || undefined,
    amount: f("amount"),
    action: f("action"),
    sign_time: f("sign_time"),
    sign_string: f("sign_string"),
  };

  if (!clickCheckSign(req, config.secretKey)) {
    return fail(req, ClickError.SignFailed, "SIGN CHECK FAILED");
  }

  try {
    const bill = await loadOpenBill(req.merchant_trans_id);

    // ── prepare: счёт существует и сумма верна ──
    if (req.action === "0") {
      if (!bill) return fail(req, ClickError.OrderNotFound, "Order not found");
      if (Math.round(Number(req.amount)) !== bill.total || bill.total <= 0) {
        return fail(req, ClickError.InvalidAmount, "Incorrect amount");
      }

      // Идемпотентность: повторный prepare той же click-транзакции
      const [existing] = await db
        .select()
        .from(payments)
        .where(
          and(eq(payments.provider, "click"), eq(payments.providerTxnId, req.click_trans_id))
        );
      if (existing) {
        if (existing.state === "paid") return fail(req, ClickError.AlreadyPaid, "Already paid");
        if (existing.state === "cancelled")
          return fail(req, ClickError.TransactionCancelled, "Cancelled");
        return reply(req, { merchant_prepare_id: existing.id, error: 0, error_note: "Success" });
      }

      const [created] = await db
        .insert(payments)
        .values({
          sessionId: bill.sessionId,
          provider: "click",
          providerTxnId: req.click_trans_id,
          amount: bill.total,
          providerCreateTime: new Date(),
        })
        .returning();
      return reply(req, { merchant_prepare_id: created.id, error: 0, error_note: "Success" });
    }

    // ── complete: деньги списаны (или отменено — error<0 от Click) ──
    if (req.action === "1") {
      const [p] = await db
        .select()
        .from(payments)
        .where(
          and(eq(payments.provider, "click"), eq(payments.providerTxnId, req.click_trans_id))
        );
      if (!p || p.id !== req.merchant_prepare_id) {
        return fail(req, ClickError.TransactionNotFound, "Transaction not found");
      }
      // Click присылает error<0 в complete при отмене на своей стороне
      const clickError = Math.round(Number(f("error") || "0"));
      if (clickError < 0) {
        await db
          .update(payments)
          .set({
            state: "cancelled",
            paidBeforeCancel: p.state === "paid",
            cancelTime: new Date(),
            cancelReason: clickError,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, p.id));
        return fail(req, ClickError.TransactionCancelled, "Cancelled");
      }
      if (p.state === "paid") {
        return reply(req, { merchant_confirm_id: p.id, error: 0, error_note: "Already paid" });
      }
      if (p.state === "cancelled") {
        return fail(req, ClickError.TransactionCancelled, "Cancelled");
      }

      const [paid] = await db
        .update(payments)
        .set({ state: "paid", performTime: new Date(), updatedAt: new Date() })
        .where(and(eq(payments.id, p.id), eq(payments.state, "created")))
        .returning();
      if (!paid) return fail(req, ClickError.TransactionCancelled, "Cancelled");

      await sendPaymentToTelegram("click", bill?.tableNumber ?? "?", p.amount).catch(() => {});
      await notifyWaiters();
      return reply(req, { merchant_confirm_id: paid.id, error: 0, error_note: "Success" });
    }

    return fail(req, ClickError.ActionNotFound, "Action not found");
  } catch (e) {
    console.error("Click callback failed:", e);
    return fail(req, ClickError.BadRequest, "Internal error");
  }
}
