import { db } from "@/db";
import { staff } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { StaffManager, type StaffRow, type StaffStat } from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const rows = await db.select().from(staff).orderBy(asc(staff.name));

  const orderStats = (await db.execute(sql`
    select served_by as name, count(*)::int as total,
      count(*) filter (
        where updated_at at time zone 'Asia/Tashkent'
          >= date_trunc('day', now() at time zone 'Asia/Tashkent')
      )::int as today
    from orders where served_by is not null group by served_by
  `)) as unknown as { name: string; total: number; today: number }[];

  const callStats = (await db.execute(sql`
    select resolved_by as name, count(*)::int as total,
      count(*) filter (
        where resolved_at at time zone 'Asia/Tashkent'
          >= date_trunc('day', now() at time zone 'Asia/Tashkent')
      )::int as today
    from waiter_calls where resolved_by is not null group by resolved_by
  `)) as unknown as { name: string; total: number; today: number }[];

  const stats: Record<string, StaffStat> = {};
  const ensure = (n: string) =>
    (stats[n] ??= { ordersToday: 0, ordersTotal: 0, callsToday: 0, callsTotal: 0 });
  for (const r of orderStats) {
    const s = ensure(r.name);
    s.ordersTotal = r.total;
    s.ordersToday = r.today;
  }
  for (const r of callStats) {
    const s = ensure(r.name);
    s.callsTotal = r.total;
    s.callsToday = r.today;
  }

  const list: StaffRow[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    zone: s.zone,
    tables: (s.tables as string[]) ?? [],
    isActive: s.isActive,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Персонал</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Официанты входят на <span className="text-gold">/waiter</span> по
          личному PIN. {rows.length} в команде.
        </p>
      </div>
      <StaffManager initial={list} stats={stats} />
    </div>
  );
}
