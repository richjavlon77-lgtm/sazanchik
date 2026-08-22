/**
 * Чистое ядро онлайн-платежей (Payme / Click) — без БД и I/O, полностью
 * покрывается юнитами. Адаптеры с БД живут в app/api/payments/*.
 *
 * Payme Merchant API: JSON-RPC, суммы в ТИЙИНАХ (×100), Basic-авторизация
 * "Paycom:<key>". Click SHOP-API: form-POST prepare/complete, подпись md5.
 */
import { createHash, timingSafeEqual } from "crypto";

// ── Суммы ───────────────────────────────────────────────────────

/** Сумы → тийины (Payme оперирует тийинами) */
export const toTiyin = (sum: number): number => Math.round(sum * 100);
/** Тийины → сумы */
export const fromTiyin = (tiyin: number): number => Math.round(tiyin) / 100;

// ── Payme ───────────────────────────────────────────────────────

/** Коды ошибок Payme Merchant API */
export const PaymeError = {
  InvalidAmount: -31001,
  TransactionNotFound: -31003,
  CannotPerform: -31008,
  AccountNotFound: -31050, // диапазон -31050..-31099 — «проблема с account»
  AccountBusy: -31051,
  InvalidAuth: -32504,
  ParseError: -32700,
  MethodNotFound: -32601,
} as const;

/** Состояния транзакции по протоколу Payme */
export const PaymeState = {
  Created: 1,
  Performed: 2,
  CancelledFromCreated: -1,
  CancelledAfterPerform: -2,
} as const;

/**
 * Проверка Basic-заголовка Payme: "Basic base64(Paycom:<merchant key>)".
 * Сравнение постоянного времени — ключ не должен утекать по таймингу.
 */
export function paymeCheckAuth(
  authorization: string | null,
  merchantKey: string
): boolean {
  if (!authorization?.startsWith("Basic ") || !merchantKey) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const expected = Buffer.from(`Paycom:${merchantKey}`);
  const provided = Buffer.from(decoded);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

/** Числовое состояние Payme из нашей строки состояния платежа */
export function paymeStateOf(p: {
  state: "created" | "paid" | "cancelled";
  paidBeforeCancel: boolean;
}): number {
  if (p.state === "created") return PaymeState.Created;
  if (p.state === "paid") return PaymeState.Performed;
  return p.paidBeforeCancel
    ? PaymeState.CancelledAfterPerform
    : PaymeState.CancelledFromCreated;
}

/** Ссылка на чекаут Payme: base64(m=<id>;ac.bill_id=<session>;a=<тийины>) */
export function buildPaymeCheckoutUrl(
  merchantId: string,
  sessionId: string,
  amountSum: number
): string {
  const payload = `m=${merchantId};ac.bill_id=${sessionId};a=${toTiyin(amountSum)}`;
  return `https://checkout.paycom.uz/${Buffer.from(payload).toString("base64")}`;
}

// ── Click ───────────────────────────────────────────────────────

/** Коды ошибок Click SHOP-API */
export const ClickError = {
  Success: 0,
  SignFailed: -1,
  InvalidAmount: -2,
  ActionNotFound: -3,
  AlreadyPaid: -4,
  OrderNotFound: -5,
  TransactionNotFound: -6,
  BadRequest: -8,
  TransactionCancelled: -9,
} as const;

export type ClickRequest = {
  click_trans_id: string;
  service_id: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string; // "0" prepare | "1" complete
  sign_time: string;
  sign_string: string;
};

/**
 * Подпись Click: md5 конкатенации полей + секретного ключа.
 * prepare:  click_trans_id + service_id + KEY + merchant_trans_id + amount + action + sign_time
 * complete: … + merchant_prepare_id перед amount.
 */
export function clickSignature(req: Omit<ClickRequest, "sign_string">, secretKey: string): string {
  const mid = req.action === "1" ? (req.merchant_prepare_id ?? "") : "";
  const raw =
    req.click_trans_id +
    req.service_id +
    secretKey +
    req.merchant_trans_id +
    mid +
    req.amount +
    req.action +
    req.sign_time;
  return createHash("md5").update(raw).digest("hex");
}

export function clickCheckSign(req: ClickRequest, secretKey: string): boolean {
  const expected = clickSignature(req, secretKey);
  const provided = (req.sign_string ?? "").toLowerCase();
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/** Ссылка на оплату Click */
export function buildClickPayUrl(
  serviceId: string,
  merchantId: string,
  sessionId: string,
  amountSum: number
): string {
  const q = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: String(amountSum),
    transaction_param: sessionId,
  });
  return `https://my.click.uz/services/pay?${q.toString()}`;
}
