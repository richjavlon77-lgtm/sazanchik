import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments, tableSessions } from "@/db/schema";

export type OpenBill = {
  sessionId: string;
  tableNumber: string;
  /** полная сумма счёта (неотменённые заказы сессии) */
  total: number;
  /** уже оплачено онлайн (успешные Payme/Click) */
  paidOnline: number;
  /** остаток к оплате — именно его сверяем и выставляем в ссылках.
   *  Счёт может дорасти дозаказом ПОСЛЕ онлайн-оплаты — платить надо
   *  разницу, а не полный total второй раз. */
  due: number;
};

/**
 * Открытый счёт стола по id сессии — якорь онлайн-платежа.
 * null — если счёт не найден или уже закрыт: платить нечего.
 */
export async function loadOpenBill(sessionId: string): Promise<OpenBill | null> {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;

  const [session] = await db
    .select({ id: tableSessions.id, tableNumber: tableSessions.tableNumber })
    .from(tableSessions)
    .where(
      and(eq(tableSessions.id, sessionId), eq(tableSessions.status, "open"))
    );
  if (!session) return null;

  const rows = await db
    .select({ total: orders.totalPrice })
    .from(orders)
    .where(
      and(eq(orders.sessionId, sessionId), ne(orders.status, "cancelled"))
    );
  const total = rows.reduce((sum, r) => sum + r.total, 0);

  const paidRows = await db
    .select({ amount: payments.amount })
    .from(payments)
    .where(and(eq(payments.sessionId, sessionId), eq(payments.state, "paid")));
  const paidOnline = paidRows.reduce((sum, r) => sum + r.amount, 0);

  return {
    sessionId: session.id,
    tableNumber: session.tableNumber,
    total,
    paidOnline,
    due: Math.max(0, total - paidOnline),
  };
}
