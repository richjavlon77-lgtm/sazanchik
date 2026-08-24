import Link from "next/link";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  tableSessions,
  reservations,
  reviews,
  dishes,
  deliveryRequests,
  waiterCalls,
} from "@/db/schema";
import { tableLabel } from "@/lib/tables";

export const dynamic = "force-dynamic";

const TZ = "Asia/Tashkent";
const money = (n: number) => `${Math.round(n).toLocaleString("ru-RU")}`;

const fmtTime = (d: Date) =>
  new Date(d).toLocaleString("ru-RU", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });

/** Живой дашборд дня — всё важное одним экраном, каждая карточка кликабельна. */
export default async function AdminDashboard() {
  const [today] = (await db.execute(sql`
    select
      coalesce(sum(total_price),0)::bigint as revenue,
      count(*)::int as cnt,
      coalesce(sum(total_price) filter (where (created_at at time zone ${TZ}) >=
        date_trunc('day', now() at time zone ${TZ}) - interval '1 day'
        and (created_at at time zone ${TZ}) < date_trunc('day', now() at time zone ${TZ})),0)::bigint as _ignore
    from orders
    where status <> 'cancelled'
      and (created_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ})
  `)) as unknown as { revenue: string; cnt: number }[];

  const [yesterday] = (await db.execute(sql`
    select coalesce(sum(total_price),0)::bigint as revenue
    from orders
    where status <> 'cancelled'
      and (created_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ}) - interval '1 day'
      and (created_at at time zone ${TZ}) < date_trunc('day', now() at time zone ${TZ})
  `)) as unknown as { revenue: string }[];

  const openSessions = await db
    .select({ id: tableSessions.id, table: tableSessions.tableNumber })
    .from(tableSessions)
    .where(eq(tableSessions.status, "open"));
  let openTotal = 0;
  if (openSessions.length) {
    const [sum] = (await db.execute(sql`
      select coalesce(sum(total_price),0)::bigint as s
      from orders o join table_sessions ts on ts.id = o.session_id
      where ts.status = 'open' and o.status <> 'cancelled'
    `)) as unknown as { s: string }[];
    openTotal = Number(sum.s);
  }

  const upcoming = await db
    .select()
    .from(reservations)
    .where(and(gte(reservations.reservedAt, new Date()), ne(reservations.status, "cancelled")))
    .orderBy(reservations.reservedAt)
    .limit(4);

  const [pendingReviews] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reviews)
    .where(and(eq(reviews.isPublished, false), sql`${reviews.comment} <> ''`));

  const [stops] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(dishes)
    .where(and(eq(dishes.isPublished, true), eq(dishes.inStock, false)));

  const [newDeliveries] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(deliveryRequests)
    .where(eq(deliveryRequests.status, "new"));

  const [openCalls] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(waiterCalls)
    .where(eq(waiterCalls.status, "new"));

  const revenue = Number(today.revenue);
  const prevRevenue = Number(yesterday.revenue);
  const trend =
    prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

  const now = new Date().toLocaleString("ru-RU", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.35em] text-gold">
          — {now} —
        </div>
        <h1 className="mt-1 font-heading text-3xl md:text-4xl">
          Добрый день<span className="text-gold">.</span>
        </h1>
      </div>

      {/* Главная метрика */}
      <Link
        href="/admin/finance"
        className="block rounded-[28px] border border-gold/30 bg-gradient-to-br from-gold/[0.1] via-white/60 to-transparent p-6 shadow-[0_16px_40px_-24px_rgba(197,163,92,0.5)] transition-colors hover:border-gold/60 md:p-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Выручка сегодня
            </div>
            <div className="mt-1 font-heading text-4xl tabular-nums text-gold md:text-5xl">
              {money(revenue)} <span className="text-lg">сум</span>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>
              {today.cnt} заказ.
              {today.cnt > 0 && <> · средний чек {money(revenue / today.cnt)}</>}
            </div>
            {trend !== null && (
              <div className={trend >= 0 ? "text-emerald-600" : "text-red-500"}>
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% ко вчера
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Пульс зала */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Pulse
          href="/admin/cash"
          icon="🍽"
          label="Открытые столы"
          value={String(openSessions.length)}
          hint={openSessions.length ? `${money(openTotal)} сум на столах` : "зал свободен"}
          alert={false}
        />
        <Pulse
          href="/admin/reviews"
          icon="⭐"
          label="Отзывы ждут"
          value={String(pendingReviews.n)}
          hint={pendingReviews.n ? "на модерации" : "все разобраны"}
          alert={pendingReviews.n > 0}
        />
        <Pulse
          href="/admin/menu"
          icon="⛔"
          label="Стоп-лист"
          value={String(stops.n)}
          hint={stops.n ? "блюд недоступно" : "всё в наличии"}
          alert={stops.n > 0}
        />
        <Pulse
          href="/admin/delivery"
          icon="🚚"
          label="Доставка"
          value={String(newDeliveries.n)}
          hint={newDeliveries.n ? "новых заявок" : "заявок нет"}
          alert={newDeliveries.n > 0}
        />
      </div>

      {openCalls.n > 0 && (
        <div className="mt-3 rounded-2xl border border-red-300 bg-red-500/[0.06] px-4 py-3 text-sm text-red-600">
          🔔 {openCalls.n} неотвеченных вызова официанта — проверьте доску зала
        </div>
      )}

      {/* Брони + быстрые действия */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-border bg-white/70 p-6 shadow-[0_10px_30px_-20px_rgba(23,21,15,0.25)]">
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading text-xl">Ближайшие брони</h2>
            <Link href="/admin/reservations" className="text-xs uppercase tracking-wider text-gold">
              все →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Предстоящих броней нет.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {upcoming.map((r) => (
                <li key={r.id} className="flex items-baseline gap-3 text-sm">
                  <span className="font-heading tabular-nums text-gold">
                    {fmtTime(r.reservedAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {r.name} · {r.guests} гост.
                  </span>
                  {r.tableNumber && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {tableLabel(r.tableNumber)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-white/70 p-6 shadow-[0_10px_30px_-20px_rgba(23,21,15,0.25)]">
          <h2 className="font-heading text-xl">Быстрые действия</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Action href="/admin/dishes/new" icon="＋" label="Новое блюдо" />
            <Action href="/admin/menu" icon="🍽" label="Меню и стоп-лист" />
            <Action href="/admin/tables" icon="🔗" label="QR столов" />
            <Action href="/admin/audit" icon="🧾" label="Журнал действий" />
            <Action href="/admin/inventory" icon="📦" label="Склад" />
            <Action href="/admin/payroll" icon="💸" label="Зарплаты" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Pulse({
  href,
  icon,
  label,
  value,
  hint,
  alert,
}: {
  href: string;
  icon: string;
  label: string;
  value: string;
  hint: string;
  alert: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-3xl border p-5 shadow-[0_10px_30px_-18px_rgba(23,21,15,0.25)] transition-all hover:-translate-y-0.5 " +
        (alert
          ? "border-gold/60 bg-gradient-to-br from-gold/[0.12] to-transparent hover:border-gold"
          : "border-border bg-white/70 hover:border-gold/50")
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span aria-hidden>{icon}</span>
      </div>
      <div className="mt-2 font-heading text-4xl tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </Link>
  );
}

function Action({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3.5 text-[15px] shadow-[0_8px_24px_-18px_rgba(23,21,15,0.3)] transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
    >
      <span className="text-lg" aria-hidden>{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}
