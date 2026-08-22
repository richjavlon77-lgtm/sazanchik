import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { orders, tableSessions } from "@/db/schema";

export type OpenBill = { sessionId: string; tableNumber: string; total: number };

/**
 * Открытый счёт стола по id сессии — якорь онлайн-платежа.
 * Сумма = все неотменённые заказы сессии (та же логика, что в bills-data).
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
  return { sessionId: session.id, tableNumber: session.tableNumber, total };
}
