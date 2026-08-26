import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * ABC-анализ блюд за 30 дней: A — блюда, делающие 80% выручки (герои),
 * B — следующие 15%, C — последние 5% (кандидаты на вылет или продвижение).
 * Классика ресторанного менеджмента, считается по снапшотам заказов.
 */
export async function AbcAnalysis() {
  const rows = (await db.execute(sql`
    select
      elem->>'nameRu' as name,
      sum((elem->>'quantity')::int)::int as qty,
      sum((elem->>'quantity')::int * (elem->>'price')::int)::bigint as revenue
    from orders o
    cross join lateral jsonb_array_elements(coalesce(o.items_snapshot,'[]'::jsonb)) elem
    where o.status <> 'cancelled' and o.created_at >= now() - interval '30 days'
    group by 1
    order by 3 desc
  `)) as unknown as { name: string; qty: number; revenue: string }[];

  if (!rows.length) return null;

  const total = rows.reduce((s, r) => s + Number(r.revenue), 0);
  // накопительная доля — без мутаций (линтер серверных компонентов строг)
  const cumsum = rows.reduce<number[]>(
    (arr, r) => [...arr, (arr[arr.length - 1] ?? 0) + Number(r.revenue)],
    []
  );
  const classed = rows.map((r, i) => {
    const cum = cumsum[i] / total;
    const cls = cum <= 0.8 ? "A" : cum <= 0.95 ? "B" : "C";
    return { ...r, revenue: Number(r.revenue), share: Number(r.revenue) / total, cls };
  });

  const CLS_STYLE: Record<string, string> = {
    A: "bg-emerald-500/15 text-emerald-600",
    B: "bg-gold/15 text-gold",
    C: "bg-red-500/10 text-red-500",
  };
  const money = (n: number) => n.toLocaleString("ru-RU");
  const counts = {
    A: classed.filter((r) => r.cls === "A").length,
    B: classed.filter((r) => r.cls === "B").length,
    C: classed.filter((r) => r.cls === "C").length,
  } as Record<string, number>;

  return (
    <section className="mt-8 rounded-3xl border border-border bg-white/70 p-5 shadow-[0_10px_30px_-20px_rgba(23,21,15,0.25)] md:p-6">
      <h2 className="font-heading text-2xl">ABC-анализ блюд · 30 дней</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-medium text-emerald-600">A ({counts.A})</span> —
        герои, делают 80% выручки: берегите и держите в наличии ·{" "}
        <span className="font-medium text-gold">B ({counts.B})</span> — середина ·{" "}
        <span className="font-medium text-red-500">C ({counts.C})</span> — балласт:
        продвигать, переделать или убрать из меню.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Блюдо</th>
              <th className="py-2 pr-3 text-right">Продано</th>
              <th className="py-2 pr-3 text-right">Выручка</th>
              <th className="py-2 pr-3 text-right">Доля</th>
              <th className="py-2">Класс</th>
            </tr>
          </thead>
          <tbody>
            {classed.map((r, i) => (
              <tr key={r.name} className="border-b border-border/40 last:border-0">
                <td className="py-2 pr-3 tabular-nums text-muted-foreground">{i + 1}</td>
                <td className="py-2 pr-3">{r.name}</td>
                <td className="py-2 pr-3 text-right tabular-nums">×{r.qty}</td>
                <td className="py-2 pr-3 text-right font-heading tabular-nums text-gold">
                  {money(r.revenue)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                  {(r.share * 100).toFixed(1)}%
                </td>
                <td className="py-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLS_STYLE[r.cls]}`}>
                    {r.cls}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
