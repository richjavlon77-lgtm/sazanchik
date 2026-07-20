"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addExpense, deleteExpense } from "@/lib/finance-actions";
import type {
  FinanceData,
  PeriodStat,
  ExpenseRow,
} from "@/lib/finance-data";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("ru-RU") + " сум";

const CAT_LABEL: Record<string, string> = {
  purchase: "Закупка",
  rent: "Аренда",
  salary: "Зарплата",
  utilities: "Коммуналка",
  other: "Прочее",
};

const field =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60 focus:ring-3 focus:ring-gold/20";

function Trend({ now, prev }: { now: number; prev: number }) {
  if (prev <= 0) return null;
  const pct = Math.round(((now - prev) / prev) * 100);
  if (pct === 0) return null;
  const up = pct > 0;
  return (
    <span
      className={cn(
        "ml-2 text-[10px] tabular-nums",
        up ? "text-emerald-400" : "text-red-400"
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function PeriodCard({ title, sub, s }: { title: string; sub: string; s: PeriodStat }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-card/40 p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-heading text-lg">{title}</h3>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {sub}
        </span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm tabular-nums">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Выручка</span>
          <span className="text-emerald-400">
            {fmt(s.revenue)}
            <Trend now={s.revenue} prev={s.prevRevenue} />
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            − Себестоимость
            {s.revenue > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground/70">
                ({s.foodCostPct}%)
              </span>
            )}
          </span>
          <span className="text-orange-400">{fmt(s.cogs)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>= Валовая прибыль</span>
          <span className="text-foreground">{fmt(s.grossProfit)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">− Расходы</span>
          <span className="text-red-400">{fmt(s.expenses)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-1.5 font-medium">
          <span>📈 Чистая прибыль</span>
          <span className={s.profit >= 0 ? "text-gold" : "text-red-400"}>
            {fmt(s.profit)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{s.orders} заказ.</span>
        <span>ср. чек {fmt(s.avgCheck)}</span>
      </div>
    </div>
  );
}

export function FinanceManager({ data }: { data: FinanceData }) {
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("purchase");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.revenue));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      try {
        await addExpense({
          amount: Number(amount),
          category,
          note,
          spentAt: date || undefined,
        });
        toast.success("Расход добавлен");
        setAmount("");
        setNote("");
        setDate("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  };

  const remove = (row: ExpenseRow) => {
    if (!confirm(`Удалить расход ${fmt(row.amount)}?`)) return;
    start(async () => {
      try {
        await deleteExpense(row.id);
        toast.success("Удалён");
      } catch {
        toast.error("Ошибка");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Period cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <PeriodCard title="Сегодня" sub="за день" s={data.today} />
        <PeriodCard title="Неделя" sub="7 дней" s={data.week} />
        <PeriodCard title="Месяц" sub="30 дней" s={data.month} />
      </div>

      {/* Daily revenue chart */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg">Выручка по дням · 14 дней</h3>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            макс. {fmt(maxDaily)}
          </span>
        </div>
        <div className="relative rounded-2xl border border-border bg-card/40 p-4 pt-8">
          {/* Y-axis reference lines */}
          <div className="pointer-events-none absolute inset-0 px-4">
            {[0.25, 0.5, 0.75].map((pct) => (
              <div
                key={pct}
                className="absolute left-4 right-4 border-t border-border/30"
                style={{ bottom: `${pct * 100}%` }}
              />
            ))}
          </div>
          <div className="flex items-end gap-1.5">
            {data.daily.map((d, i) => {
              const pct = (d.revenue / maxDaily) * 100;
              return (
                <div
                  key={i}
                  className="group relative flex flex-1 flex-col items-center gap-1"
                >
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-7 z-10 scale-0 rounded-lg bg-foreground px-2 py-1 text-[10px] tabular-nums text-background opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
                    {fmt(d.revenue)}
                  </div>
                  <div className="flex h-36 w-full items-end">
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${Math.max(2, pct)}%`,
                        background:
                          `linear-gradient(to top, hsl(42, 40%, 55%), hsl(42, 50%, 70%))`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] tabular-nums text-muted-foreground">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Expense breakdown by category (30 days) */}
      {data.expenseByCategory.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-lg">Расходы по категориям · 30 дней</h3>
          {(() => {
            const total = data.expenseByCategory.reduce((s, x) => s + x.amount, 0);
            return (
              <div className="space-y-2 rounded-2xl border border-border bg-card/40 p-4">
                {data.expenseByCategory.map((x) => {
                  const pct = total > 0 ? Math.round((x.amount / total) * 100) : 0;
                  return (
                    <div key={x.category}>
                      <div className="flex items-center justify-between text-sm tabular-nums">
                        <span>{CAT_LABEL[x.category] ?? x.category}</span>
                        <span className="text-muted-foreground">
                          {fmt(x.amount)}{" "}
                          <span className="text-[11px] text-muted-foreground/70">
                            {pct}%
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-red-400/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between border-t border-border/60 pt-2 text-sm font-medium tabular-nums">
                  <span>Итого расходов</span>
                  <span className="text-red-400">{fmt(total)}</span>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top waiters */}
        <section>
          <h3 className="mb-3 font-heading text-lg">Доход по официантам · 30 дней</h3>
          {data.topWaiters.length === 0 ? (
            <p className="rounded-xl border border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
              Пока нет данных
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/40">
              {data.topWaiters.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 text-sm last:border-b-0"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground tabular-nums">
                      {i + 1}.
                    </span>
                    {w.name}
                  </span>
                  <span className="tabular-nums">
                    <span className="text-emerald-400">{fmt(w.revenue)}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      {w.orders} зак.
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expenses */}
        <section>
          <h3 className="mb-3 font-heading text-lg">Расходы</h3>
          <form
            onSubmit={add}
            className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-gold/20 bg-card/40 p-3"
          >
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Сумма
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="500000"
                required
                className={cn(field, "w-28 tabular-nums")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Категория
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={field}
              >
                {Object.entries(CAT_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Дата (необяз.)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={field}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Комментарий
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Мясо, овощи…"
                className={cn(field, "w-full")}
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              + Добавить
            </button>
          </form>

          {data.recentExpenses.length === 0 ? (
            <p className="rounded-xl border border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
              Расходов пока нет
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/40">
              {data.recentExpenses.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 text-sm last:border-b-0"
                >
                  <div className="min-w-0">
                    <span className="tabular-nums text-red-400">
                      {fmt(row.amount)}
                    </span>
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {CAT_LABEL[row.category] ?? row.category}
                    </span>
                    {row.note && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {row.note}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {row.spentAt}
                    </span>
                    <button
                      onClick={() => remove(row)}
                      disabled={pending}
                      className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-red-400 disabled:opacity-40"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
