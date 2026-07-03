/**
 * Pure pricing core — no DB, no I/O, no `server-only`. This is the
 * money-critical math, isolated so it can be unit-tested in full. The DB-backed
 * wrapper lives in `lib/order-pricing.ts` and only feeds verified dish data in.
 */

export const SERVICE_RATE = 0.2;
export const BIRTHDAY_RATE = 0.1;

export type Line = { id: string; qty: number; price: number };

/** Everything the pricer needs to know about one dish, sourced from the DB. */
export type DishPricing = {
  isPublished: boolean;
  inStock: boolean;
  /** Acceptable prices: the base price and/or each portion-variant price. */
  validPrices: number[];
};

export type PricedOk = {
  ok: true;
  subtotal: number;
  discount: number;
  service: number;
  total: number;
};
export type PricedErr = { ok: false; error: string };

/**
 * Recompute an order's totals from scratch using server-side dish data. The
 * client-sent price of each line must exactly match a real, current price for
 * that dish — otherwise the order is rejected (no trusting the client wallet).
 * Rules: −10% birthday discount, then +20% service on the discounted subtotal.
 */
export function priceLines(
  lines: Line[],
  lookup: Map<string, DishPricing>,
  isBirthday: boolean
): PricedOk | PricedErr {
  if (!lines.length) return { ok: false, error: "Корзина пуста" };

  let subtotal = 0;
  for (const l of lines) {
    if (!Number.isInteger(l.qty) || l.qty <= 0) {
      return { ok: false, error: "Некорректное количество" };
    }
    const d = lookup.get(l.id);
    if (!d || !d.isPublished) return { ok: false, error: "Позиция недоступна" };
    if (!d.inStock) return { ok: false, error: "Блюдо закончилось" };
    if (!d.validPrices.includes(l.price)) {
      return { ok: false, error: "Цена изменилась — обновите меню" };
    }
    subtotal += l.price * l.qty;
  }

  const discount = isBirthday ? Math.round(subtotal * BIRTHDAY_RATE) : 0;
  const service = Math.round((subtotal - discount) * SERVICE_RATE);
  const total = subtotal - discount + service;
  return { ok: true, subtotal, discount, service, total };
}
