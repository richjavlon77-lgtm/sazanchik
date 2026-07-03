import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type PeriodStat = {
  revenue: number;
  cogs: number; // себестоимость проданного (по рецептам)
  grossProfit: number; // revenue − cogs
  foodCostPct: number; // cogs / revenue, %
  expenses: number; // операционные расходы (закупки/аренда/ЗП…)
  profit: number; // чистая прибыль = revenue − cogs − expenses
  orders: number;
  avgCheck: number;
  prevRevenue: number; // выручка за прошлый аналогичный период (для тренда)
};

export type WaiterRevenue = { name: string; revenue: number; orders: number };
export type DailyRevenue = { label: string; revenue: number };
export type ExpenseCategory = { category: string; amount: number };
export type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  spentAt: string;
};

export type FinanceData = {
  today: PeriodStat;
  week: PeriodStat;
  month: PeriodStat;
  topWaiters: WaiterRevenue[];
  daily: DailyRevenue[];
  expenseByCategory: ExpenseCategory[];
  recentExpenses: ExpenseRow[];
};

const TZ = "Asia/Tashkent";
const n = (v: string | number | undefined) => Number(v ?? 0);

export async function loadFinance(): Promise<FinanceData> {
  // Revenue + counts per period + previous-period revenue (for trend arrows)
  const rev = (await db.execute(sql`
    select
      coalesce(sum(total_price) filter (where (created_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ})),0)::bigint as rev_today,
      count(*) filter (where (created_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ}))::int as cnt_today,
      coalesce(sum(total_price) filter (where created_at >= now() - interval '7 days'),0)::bigint as rev_week,
      count(*) filter (where created_at >= now() - interval '7 days')::int as cnt_week,
      coalesce(sum(total_price) filter (where created_at >= now() - interval '30 days'),0)::bigint as rev_month,
      count(*) filter (where created_at >= now() - interval '30 days')::int as cnt_month,
      coalesce(sum(total_price) filter (where (created_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ}) - interval '1 day' and (created_at at time zone ${TZ}) < date_trunc('day', now() at time zone ${TZ})),0)::bigint as rev_prev_today,
      coalesce(sum(total_price) filter (where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'),0)::bigint as rev_prev_week,
      coalesce(sum(total_price) filter (where created_at >= now() - interval '60 days' and created_at < now() - interval '30 days'),0)::bigint as rev_prev_month
    from orders where status <> 'cancelled'
  `)) as unknown as Record<string, string | number>[];

  // COGS = sum over sold order items of (dish recipe cost × qty), by period
  const cogs = (await db.execute(sql`
    with item_cost as (
      select d.slug, coalesce(sum(ri.qty * i.cost_per_unit),0) as cost
      from dishes d
      join recipe_items ri on ri.dish_id = d.id
      join ingredients i on ri.ingredient_id = i.id
      group by d.slug
    ),
    order_cogs as (
      select o.id, o.created_at,
        coalesce(sum(ic.cost * (elem->>'quantity')::numeric), 0) as cogs
      from orders o
      cross join lateral jsonb_array_elements(coalesce(o.items_snapshot, '[]'::jsonb)) elem
      left join item_cost ic on ic.slug = (elem->>'slug')
      where o.status <> 'cancelled' and o.created_at >= now() - interval '30 days'
      group by o.id, o.created_at
    )
    select
      coalesce(sum(cogs) filter (where (created_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ})),0)::bigint as cogs_today,
      coalesce(sum(cogs) filter (where created_at >= now() - interval '7 days'),0)::bigint as cogs_week,
      coalesce(sum(cogs) filter (where created_at >= now() - interval '30 days'),0)::bigint as cogs_month
    from order_cogs
  `)) as unknown as Record<string, string | number>[];

  const exp = (await db.execute(sql`
    select
      coalesce(sum(amount) filter (where (spent_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ})),0)::bigint as exp_today,
      coalesce(sum(amount) filter (where spent_at >= now() - interval '7 days'),0)::bigint as exp_week,
      coalesce(sum(amount) filter (where spent_at >= now() - interval '30 days'),0)::bigint as exp_month
    from expenses
  `)) as unknown as Record<string, string | number>[];

  const r = rev[0];
  const c = cogs[0];
  const e = exp[0];

  const mk = (
    revenue: number,
    cogsV: number,
    expenses: number,
    orders: number,
    prevRevenue: number
  ): PeriodStat => ({
    revenue,
    cogs: cogsV,
    grossProfit: revenue - cogsV,
    foodCostPct: revenue > 0 ? Math.round((cogsV / revenue) * 100) : 0,
    expenses,
    profit: revenue - cogsV - expenses,
    orders,
    avgCheck: orders > 0 ? Math.round(revenue / orders) : 0,
    prevRevenue,
  });

  const expByCat = (await db.execute(sql`
    select category, coalesce(sum(amount),0)::bigint as amount
    from expenses where spent_at >= now() - interval '30 days'
    group by category order by amount desc
  `)) as unknown as { category: string; amount: string | number }[];

  const topRows = (await db.execute(sql`
    select served_by as name, coalesce(sum(total_price),0)::bigint as revenue, count(*)::int as orders
    from orders
    where status <> 'cancelled' and served_by is not null
      and created_at >= now() - interval '30 days'
    group by served_by order by revenue desc limit 6
  `)) as unknown as { name: string; revenue: string | number; orders: number }[];

  const dailyRows = (await db.execute(sql`
    select to_char(d::date, 'DD.MM') as label,
      coalesce((
        select sum(total_price) from orders o
        where o.status <> 'cancelled'
          and (o.created_at at time zone ${TZ})::date = d::date
      ),0)::bigint as revenue
    from generate_series(
      (now() at time zone ${TZ})::date - interval '13 days',
      (now() at time zone ${TZ})::date,
      interval '1 day'
    ) d
    order by d
  `)) as unknown as { label: string; revenue: string | number }[];

  const expRows = (await db.execute(sql`
    select id, amount::int as amount, category, note,
      to_char(spent_at at time zone ${TZ}, 'DD.MM.YYYY') as spent_at
    from expenses order by spent_at desc limit 20
  `)) as unknown as ExpenseRow[];

  return {
    today: mk(n(r.rev_today), n(c.cogs_today), n(e.exp_today), n(r.cnt_today), n(r.rev_prev_today)),
    week: mk(n(r.rev_week), n(c.cogs_week), n(e.exp_week), n(r.cnt_week), n(r.rev_prev_week)),
    month: mk(n(r.rev_month), n(c.cogs_month), n(e.exp_month), n(r.cnt_month), n(r.rev_prev_month)),
    topWaiters: topRows.map((t) => ({ name: t.name, revenue: n(t.revenue), orders: t.orders })),
    daily: dailyRows.map((d) => ({ label: d.label, revenue: n(d.revenue) })),
    expenseByCategory: expByCat.map((x) => ({ category: x.category, amount: n(x.amount) })),
    recentExpenses: expRows,
  };
}
