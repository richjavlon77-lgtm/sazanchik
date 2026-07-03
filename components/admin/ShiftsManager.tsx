"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  clockIn,
  clockOut,
  deleteShift,
  setShiftStart,
} from "@/lib/shifts-actions";
import { POSITION_LABEL } from "@/lib/positions";
import type { ShiftsData, EmployeeShift } from "@/lib/shifts-data";
import { cn } from "@/lib/utils";

const money = (n: number) => n.toLocaleString("ru-RU") + " сум";

export function ShiftsManager({ data }: { data: ShiftsData }) {
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<void>, ok?: string) =>
    start(async () => {
      try {
        await fn();
        if (ok) toast.success(ok);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Ошибка");
      }
    });

  const inOut = (e: EmployeeShift) =>
    e.onShift
      ? run(() => clockOut(e.id), `${e.name}: ушёл`)
      : run(() => clockIn(e.id), `${e.name}: пришёл`);

  return (
    <div className="space-y-7">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="На смене сейчас" value={String(data.onShiftCount)} accent />
        <Stat label="Сотрудников" value={String(data.employees.length)} />
        <Stat
          label="Опозданий за 30 дней"
          value={String(data.employees.reduce((s, e) => s + e.lateCount, 0))}
          red
        />
      </div>

      {/* Roster with clock in/out */}
      {data.employees.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
          Нет активных сотрудников. Добавьте их в разделе{" "}
          <a href="/admin/payroll" className="text-gold underline">
            Зарплаты
          </a>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card/40">
          {data.employees.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{e.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {POSITION_LABEL[e.position] ?? e.position}
                  </span>
                  {e.onShift && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-400">
                      <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                      на смене · {e.todayHours} ч
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  За 30 дней: <span className="text-foreground">{e.shifts30} смен</span> ·{" "}
                  {e.hours30} ч
                  {e.lateCount > 0 && (
                    <span className="text-red-400"> · {e.lateCount} опозд.</span>
                  )}{" "}
                  · ≈ {money(e.expectedPay)}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Начало смены:
                  </span>
                  <input
                    defaultValue={e.shiftStart ?? ""}
                    onBlur={(ev) => {
                      if ((ev.target.value || "") !== (e.shiftStart ?? ""))
                        run(() => setShiftStart(e.id, ev.target.value));
                    }}
                    placeholder="10:00"
                    className="w-16 rounded border border-border bg-background px-2 py-0.5 text-[11px] tabular-nums outline-none focus:border-gold/50"
                  />
                </div>
              </div>
              <button
                onClick={() => inOut(e)}
                disabled={pending}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2 text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-40",
                  e.onShift
                    ? "border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white"
                    : "bg-gold text-primary-foreground hover:opacity-90"
                )}
              >
                {e.onShift ? "Уход" : "Приход"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Shift log */}
      {data.log.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-lg">Журнал смен · 30 дней</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card/40">
            {data.log.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2 text-sm last:border-b-0"
              >
                <span className="min-w-0 truncate">
                  {l.name}
                  {l.lateMin > 0 && (
                    <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400">
                      опоздал {l.lateMin} мин
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-3 tabular-nums text-muted-foreground">
                  <span>
                    {l.date} · {l.start}
                    {l.end ? `–${l.end}` : "–…"}
                  </span>
                  <span className="text-foreground">{l.hours} ч</span>
                  <button
                    onClick={() => run(() => deleteShift(l.id), "Удалено")}
                    disabled={pending}
                    className="text-[11px] uppercase tracking-wider hover:text-red-400 disabled:opacity-40"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  red,
}: {
  label: string;
  value: string;
  accent?: boolean;
  red?: boolean;
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
          accent && "text-gold",
          red && "text-red-400"
        )}
      >
        {value}
      </div>
    </div>
  );
}
