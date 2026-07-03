import "server-only";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { tableSessions, orders } from "@/db/schema";

export type CheckLine = { name: string; qty: number };
export type ClosedCheck = {
  id: string;
  tableNumber: string;
  openedAt: string;
  closedAt: string;
  closedBy: string | null;
  durationMin: number;
  orderCount: number;
  total: number;
  lines: CheckLine[];
};

export type CashData = {
  todaySum: number;
  todayCount: number;
  weekSum: number;
  monthSum: number;
  monthCount: number;
  avgCheck: number;
  checks: ClosedCheck[];
};

const TZ = "Asia/Tashkent";

export async function loadCash(): Promise<CashData> {
  // period totals over each closed session's order sum
  const sum = (await db.execute(sql`
    with sess as (
      select s.id, s.closed_at,
        coalesce(sum(o.total_price) filter (where o.status <> 'cancelled'), 0) as total
      from ${tableSessions} s
      left join ${orders} o on o.session_id = s.id
      where s.status = 'closed'
      group by s.id, s.closed_at
    )
    select
      coalesce(sum(total) filter (where (closed_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ})), 0)::bigint as today_sum,
      count(*) filter (where (closed_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ}))::int as today_n,
      coalesce(sum(total) filter (where closed_at >= now() - interval '7 days'), 0)::bigint as week_sum,
      coalesce(sum(total) filter (where closed_at >= now() - interval '30 days'), 0)::bigint as month_sum,
      count(*) filter (where closed_at >= now() - interval '30 days')::int as month_n
    from sess
  `)) as unknown as Record<string, string | number>[];
  const s0 = sum[0] ?? {};
  const n = (v: string | number | undefined) => Number(v ?? 0);

  // last 50 closed checks with their items
  const sessions = await db
    .select()
    .from(tableSessions)
    .where(eq(tableSessions.status, "closed"))
    .orderBy(desc(tableSessions.closedAt))
    .limit(50);

  let checks: ClosedCheck[] = [];
  if (sessions.length) {
    const ordRows = await db
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
    const bySession = new Map<string, typeof ordRows>();
    for (const o of ordRows) {
      if (!o.sessionId) continue;
      if (!bySession.has(o.sessionId)) bySession.set(o.sessionId, []);
      bySession.get(o.sessionId)!.push(o);
    }

    checks = sessions.map((s) => {
      const ords = bySession.get(s.id) ?? [];
      const total = ords.reduce((acc, o) => acc + o.totalPrice, 0);
      const agg = new Map<string, number>();
      for (const o of ords)
        for (const it of o.itemsSnapshot ?? [])
          agg.set(it.nameRu, (agg.get(it.nameRu) ?? 0) + it.quantity);
      const closed = s.closedAt ?? s.openedAt;
      const durationMin = Math.max(
        0,
        Math.round((closed.getTime() - s.openedAt.getTime()) / 60000)
      );
      return {
        id: s.id,
        tableNumber: s.tableNumber,
        openedAt: s.openedAt.toISOString(),
        closedAt: closed.toISOString(),
        closedBy: s.closedBy,
        durationMin,
        orderCount: ords.length,
        total,
        lines: [...agg.entries()].map(([name, qty]) => ({ name, qty })),
      };
    });
  }

  const monthSum = n(s0.month_sum);
  const monthCount = n(s0.month_n);
  return {
    todaySum: n(s0.today_sum),
    todayCount: n(s0.today_n),
    weekSum: n(s0.week_sum),
    monthSum,
    monthCount,
    avgCheck: monthCount > 0 ? Math.round(monthSum / monthCount) : 0,
    checks,
  };
}
