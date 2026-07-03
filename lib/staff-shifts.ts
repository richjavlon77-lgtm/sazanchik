import { db } from "@/db";
import { staffShifts, orders, waiterCalls } from "@/db/schema";
import { and, desc, eq, gte, isNull } from "drizzle-orm";

/**
 * Opens a shift for a staff member on PIN login. If they already have an open
 * shift (logged in again without logging out), we reuse it — no duplicates.
 * Best-effort: never throws into the login flow.
 */
export async function openShift(staffId: string, name: string, role: string) {
  try {
    const [open] = await db
      .select({ id: staffShifts.id })
      .from(staffShifts)
      .where(and(eq(staffShifts.staffId, staffId), isNull(staffShifts.closedAt)))
      .limit(1);
    if (open) return;
    await db.insert(staffShifts).values({ staffId, name, role });
  } catch (e) {
    console.error("openShift failed", e);
  }
}

/** Closes the staff member's open shift on logout. Best-effort. */
export async function closeShift(staffId: string) {
  try {
    await db
      .update(staffShifts)
      .set({ closedAt: new Date() })
      .where(and(eq(staffShifts.staffId, staffId), isNull(staffShifts.closedAt)));
  } catch (e) {
    console.error("closeShift failed", e);
  }
}

export type ShiftRow = {
  id: string;
  name: string;
  role: string;
  openedAt: Date;
  closedAt: Date | null;
  durationMin: number;
  orders: number;
  revenue: number;
  positions: number;
  calls: number;
};

/**
 * Recent staff shifts (last 30 days) with what each person did during the
 * shift window: orders served + revenue (waiters), positions handed off
 * (prep stations), and calls resolved. Aggregated in JS over one order/call
 * pull — small per-venue volume keeps this simple and correct.
 */
export async function loadStaffShifts(): Promise<ShiftRow[]> {
  const monthStart = new Date(Date.now() - 30 * 86400000);

  const shifts = await db
    .select()
    .from(staffShifts)
    .where(gte(staffShifts.openedAt, monthStart))
    .orderBy(desc(staffShifts.openedAt))
    .limit(80);

  if (shifts.length === 0) return [];

  const earliest = shifts.reduce(
    (min, s) => (s.openedAt < min ? s.openedAt : min),
    shifts[0].openedAt
  );

  const [ords, calls] = await Promise.all([
    db
      .select({
        servedBy: orders.servedBy,
        total: orders.totalPrice,
        updatedAt: orders.updatedAt,
        snap: orders.itemsSnapshot,
        readyBy: orders.readyBy,
      })
      .from(orders)
      .where(gte(orders.updatedAt, earliest)),
    db
      .select({
        resolvedBy: waiterCalls.resolvedBy,
        resolvedAt: waiterCalls.resolvedAt,
      })
      .from(waiterCalls)
      .where(gte(waiterCalls.resolvedAt, earliest)),
  ]);

  const now = Date.now();
  return shifts.map((s) => {
    const from = s.openedAt.getTime();
    const to = (s.closedAt ?? new Date(now)).getTime();
    const inWindow = (t: Date | null) => {
      if (!t) return false;
      const ms = t.getTime();
      return ms >= from && ms <= to;
    };

    let ordersN = 0;
    let revenue = 0;
    let positions = 0;
    for (const o of ords) {
      if (!inWindow(o.updatedAt as Date)) continue;
      if (o.servedBy === s.name) {
        ordersN += 1;
        revenue += o.total ?? 0;
      }
      const rb = o.readyBy ?? {};
      for (const [station, who] of Object.entries(rb)) {
        if (who !== s.name) continue;
        positions += (o.snap ?? [])
          .filter((it) => it.station === station)
          .reduce((a, it) => a + (it.quantity || 0), 0);
      }
    }
    let callsN = 0;
    for (const c of calls) {
      if (c.resolvedBy === s.name && inWindow(c.resolvedAt as Date)) callsN += 1;
    }

    return {
      id: s.id,
      name: s.name,
      role: s.role,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      durationMin: Math.max(0, Math.round((to - from) / 60000)),
      orders: ordersN,
      revenue,
      positions,
      calls: callsN,
    };
  });
}
