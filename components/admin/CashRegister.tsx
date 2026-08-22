"use client";

import { useState } from "react";
import type { CashData, ClosedCheck } from "@/lib/cash-data";
import { tableLabel } from "@/lib/tables";
import { cn } from "@/lib/utils";

const money = (n: number) => n.toLocaleString("ru-RU") + " сум";

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(iso));

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/40 p-5",
        accent ? "border-gold/20" : "border-border"
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-heading text-2xl tabular-nums",
          accent && "text-gold"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function CashRegister({ data }: { data: CashData }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat
          label="Касса сегодня"
          value={money(data.todaySum)}
          sub={`${data.todayCount} чеков`}
          accent
        />
        <Stat label="Неделя" value={money(data.weekSum)} />
        <Stat label="Месяц" value={money(data.monthSum)} sub={`${data.monthCount} чеков`} />
        <Stat label="Средний чек" value={money(data.avgCheck)} />
      </div>

      <section>
        <h3 className="mb-3 font-heading text-lg">Закрытые счета</h3>
        {data.checks.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
            Пока нет закрытых счетов. Они появятся, когда официант закроет счёт
            стола в <span className="text-gold">/waiter/bills</span>.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card/40">
            {data.checks.map((c: ClosedCheck) => {
              const isOpen = open === c.id;
              return (
                <div key={c.id} className="border-b border-border/50 last:border-b-0">
                  <button
                    onClick={() => setOpen(isOpen ? null : c.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gold/[0.03]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tableLabel(c.tableNumber)}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {c.orderCount} заказ. · {c.durationMin} мин
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                        Закрыт {fmtTime(c.closedAt)}
                        {c.closedBy ? ` · ${c.closedBy}` : ""}
                      </div>
                    </div>
                    <span className="shrink-0 font-heading tabular-nums text-gold">
                      {money(c.total)}
                    </span>
                  </button>
                  {isOpen && c.lines.length > 0 && (
                    <div className="border-t border-border/50 bg-background/40 px-4 py-2">
                      <ul className="space-y-0.5 text-sm text-muted-foreground">
                        {c.lines.map((l, i) => (
                          <li key={i} className="flex justify-between">
                            <span>{l.name}</span>
                            <span className="text-gold">×{l.qty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
