import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { tableSessions, orders } from "@/db/schema";

export type BillLine = { name: string; qty: number };
export type Bill = {
  id: string;
  tableNumber: string;
  openedAt: string;
  orderCount: number;
  total: number;
  lines: BillLine[];
};

/** All open table bills with their aggregated items and total. */
export async function loadOpenBills(): Promise<Bill[]> {
  const sessions = await db
    .select()
    .from(tableSessions)
    .where(eq(tableSessions.status, "open"))
    .orderBy(asc(tableSessions.openedAt));
  if (!sessions.length) return [];

  const orderRows = await db
    .select()
    .from(orders)
    .where(
      and(
        inArray(
          orders.sessionId,
          sessions.map((s) => s.id)
        ),
        ne(orders.status, "cancelled")
      )
    );

  const bySession = new Map<string, typeof orderRows>();
  for (const o of orderRows) {
    if (!o.sessionId) continue;
    if (!bySession.has(o.sessionId)) bySession.set(o.sessionId, []);
    bySession.get(o.sessionId)!.push(o);
  }

  return sessions.map((s) => {
    const ords = bySession.get(s.id) ?? [];
    const total = ords.reduce((sum, o) => sum + o.totalPrice, 0);
    const agg = new Map<string, number>();
    for (const o of ords) {
      for (const it of o.itemsSnapshot ?? []) {
        agg.set(it.nameRu, (agg.get(it.nameRu) ?? 0) + it.quantity);
      }
    }
    return {
      id: s.id,
      tableNumber: s.tableNumber,
      openedAt: s.openedAt.toISOString(),
      orderCount: ords.length,
      total,
      lines: [...agg.entries()].map(([name, qty]) => ({ name, qty })),
    };
  });
}
