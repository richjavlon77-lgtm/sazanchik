import { db } from "@/db";
import { orders, waiterCalls } from "@/db/schema";
import { and, gte, isNotNull, ne } from "drizzle-orm";

/** today / last-7-days / last-30-days rolling totals */
export type Bucket = { today: number; week: number; month: number };

export type StaffStat = {
  /** revenue served (waiters) — sum of non-cancelled order totals */
  revenue: Bucket;
  /** orders served (waiters) */
  orders: Bucket;
  /** waiter calls resolved (waiters) */
  calls: Bucket;
  /** dish positions handed off (prep stations: bar/hookah/cold/meat/kitchen) */
  positions: Bucket;
};

const TZ_OFFSET = 5 * 3600 * 1000; // Asia/Tashkent, fixed UTC+5 (no DST)
const DAY = 86400000;

const emptyBucket = (): Bucket => ({ today: 0, week: 0, month: 0 });
const emptyStat = (): StaffStat => ({
  revenue: emptyBucket(),
  orders: emptyBucket(),
  calls: emptyBucket(),
  positions: emptyBucket(),
});

/**
 * Per-staff analytics, keyed by staff name (matches `served_by` / `resolved_by`
 * / `ready_by` values). Aggregated in JS over the last 30 days — a single
 * restaurant's volume is small, and this keeps the bucketing logic readable.
 */
export async function loadStaffStats(): Promise<Record<string, StaffStat>> {
  const now = Date.now();
  const tashkentDayStart = (() => {
    const d = new Date(now + TZ_OFFSET);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime() - TZ_OFFSET;
  })();
  const weekStart = now - 7 * DAY;
  const monthStart = now - 30 * DAY;
  const since = new Date(monthStart);

  const out: Record<string, StaffStat> = {};
  const stat = (name: string) => (out[name] ??= emptyStat());
  const add = (b: Bucket, tMs: number, v: number) => {
    if (tMs >= monthStart) b.month += v;
    if (tMs >= weekStart) b.week += v;
    if (tMs >= tashkentDayStart) b.today += v;
  };

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
      .where(and(ne(orders.status, "cancelled"), gte(orders.updatedAt, since))),
    db
      .select({
        resolvedBy: waiterCalls.resolvedBy,
        resolvedAt: waiterCalls.resolvedAt,
      })
      .from(waiterCalls)
      .where(
        and(isNotNull(waiterCalls.resolvedBy), gte(waiterCalls.resolvedAt, since))
      ),
  ]);

  for (const o of ords) {
    const tMs = (o.updatedAt as Date).getTime();
    if (o.servedBy) {
      const s = stat(o.servedBy);
      add(s.revenue, tMs, o.total ?? 0);
      add(s.orders, tMs, 1);
    }
    const readyBy = o.readyBy ?? {};
    const snap = o.snap ?? [];
    for (const [station, name] of Object.entries(readyBy)) {
      if (!name) continue;
      const qty = snap
        .filter((it) => it.station === station)
        .reduce((acc, it) => acc + (it.quantity || 0), 0);
      if (qty) add(stat(name).positions, tMs, qty);
    }
  }

  for (const c of calls) {
    if (!c.resolvedBy || !c.resolvedAt) continue;
    add(stat(c.resolvedBy).calls, (c.resolvedAt as Date).getTime(), 1);
  }

  return out;
}
