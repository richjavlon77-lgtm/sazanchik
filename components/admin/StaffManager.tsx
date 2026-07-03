"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createStaff,
  setStaffActive,
  deleteStaff,
  setStaffTables,
} from "@/lib/admin-actions";
import { cn } from "@/lib/utils";
import type { StaffStat, Bucket } from "@/lib/staff-stats";

export type StaffRoleKind =
  | "waiter"
  | "bartender"
  | "hookah"
  | "cook"
  | "cold"
  | "meat";

export type StaffRow = {
  id: string;
  name: string;
  role: StaffRoleKind;
  zone: string | null;
  tables: string[];
  isActive: boolean;
};

const ROLE_LABEL: Record<StaffRoleKind, string> = {
  waiter: "Официант",
  bartender: "Бармен",
  hookah: "Кальянщик",
  cook: "Повар",
  cold: "Холодный цех",
  meat: "Мясной цех",
};

const ROLE_BADGE: Record<StaffRoleKind, { text: string; cls: string }> = {
  waiter: { text: "официант", cls: "bg-gold/15 text-gold" },
  bartender: { text: "🍹 бармен", cls: "bg-sky-500/15 text-sky-400" },
  hookah: { text: "💨 кальянщик", cls: "bg-violet-500/15 text-violet-400" },
  cook: { text: "🍳 повар", cls: "bg-orange-500/15 text-orange-400" },
  cold: { text: "🥗 холодный цех", cls: "bg-emerald-500/15 text-emerald-400" },
  meat: { text: "🥩 мясной цех", cls: "bg-rose-500/15 text-rose-400" },
};

export type { StaffStat } from "@/lib/staff-stats";

const moneyFmt = new Intl.NumberFormat("ru-RU");
const money = (n: number) => `${moneyFmt.format(n)} сум`;
const count = (n: number) => String(n);

/** One metric with today / 7-day / 30-day columns. */
function Metric({
  label,
  b,
  fmt = count,
}: {
  label: string;
  b: Bucket;
  fmt?: (n: number) => string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-[11px] tabular-nums text-muted-foreground">
      <span className="text-gold">{label}:</span>
      <span className="text-foreground">
        сегодня <span className="font-semibold">{fmt(b.today)}</span>
      </span>
      <span className="opacity-70">· неделя {fmt(b.week)}</span>
      <span className="opacity-70">· месяц {fmt(b.month)}</span>
    </div>
  );
}

const field =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60 focus:ring-3 focus:ring-gold/20";

export function StaffManager({
  initial,
  stats = {},
}: {
  initial: StaffRow[];
  stats?: Record<string, StaffStat>;
}) {
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<StaffRoleKind>("waiter");
  const [zone, setZone] = useState("");
  const [tables, setTables] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      try {
        await createStaff({ name, pin, role, zone, tables });
        toast.success(`${ROLE_LABEL[role]} «${name}» добавлен`);
        setName("");
        setPin("");
        setRole("waiter");
        setZone("");
        setTables("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  };

  const saveTables = (id: string, value: string) =>
    start(async () => {
      try {
        await setStaffTables(id, value);
        toast.success("Столы обновлены");
      } catch {
        toast.error("Ошибка");
      }
    });

  const toggle = (id: string, active: boolean) =>
    start(async () => {
      try {
        await setStaffActive(id, active);
        toast.success(active ? "Активирован" : "Отключён");
      } catch {
        toast.error("Ошибка");
      }
    });

  const remove = (id: string, n: string) => {
    if (!confirm(`Удалить официанта «${n}»?`)) return;
    start(async () => {
      try {
        await deleteStaff(id);
        toast.success("Удалён");
      } catch {
        toast.error("Ошибка");
      }
    });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-gold/20 bg-card/40 p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Имя
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            placeholder="Азиз"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            PIN (4 цифры)
          </label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            className={cn(field, "w-28 tabular-nums tracking-[0.4em]")}
            placeholder="1234"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Роль
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRoleKind)}
            className={field}
          >
            <option value="waiter">Официант</option>
            <option value="bartender">Бармен 🍹</option>
            <option value="hookah">Кальянщик 💨</option>
            <option value="cook">Повар 🍳</option>
            <option value="cold">Холодный цех 🥗</option>
            <option value="meat">Мясной цех 🥩</option>
          </select>
        </div>
        {role === "waiter" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Зона (необязательно)
              </label>
              <input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className={field}
                placeholder="Зал 1 / Терраса"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Столы (через запятую)
              </label>
              <input
                value={tables}
                onChange={(e) => setTables(e.target.value)}
                className={cn(field, "tabular-nums")}
                placeholder="1, 2, 3, 4"
              />
            </div>
          </>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          + Добавить
        </button>
      </form>

      {initial.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
          Пока нет официантов. Добавьте первого — он войдёт в{" "}
          <span className="text-gold">/waiter</span> по PIN.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card/40">
          {initial.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-base">{s.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider",
                      ROLE_BADGE[s.role].cls
                    )}
                  >
                    {ROLE_BADGE[s.role].text}
                  </span>
                  {!s.isActive && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                      отключён
                    </span>
                  )}
                </div>
                {s.zone && (
                  <div className="text-xs text-muted-foreground">{s.zone}</div>
                )}
                {(() => {
                  const st = stats[s.name];
                  if (s.role === "waiter") {
                    if (!st) return null;
                    const avg = st.orders.month
                      ? Math.round(st.revenue.month / st.orders.month)
                      : 0;
                    return (
                      <div className="mt-1 space-y-0.5">
                        <Metric label="Выручка" b={st.revenue} fmt={money} />
                        <Metric label="Заказы" b={st.orders} />
                        <Metric label="Вызовы" b={st.calls} />
                        <div className="text-[11px] tabular-nums text-muted-foreground">
                          <span className="text-gold">Средний чек</span> (30 дн):{" "}
                          <span className="text-foreground">
                            {avg ? money(avg) : "—"}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  // prep-station roles (bar / hookah / cold / meat / kitchen)
                  const positions = st?.positions ?? {
                    today: 0,
                    week: 0,
                    month: 0,
                  };
                  return (
                    <div className="mt-1">
                      <Metric label="Позиций отдано" b={positions} />
                    </div>
                  );
                })()}
                {s.role === "waiter" && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Столы:
                    </span>
                    <input
                      defaultValue={s.tables.join(", ")}
                      onBlur={(e) => {
                        if (e.target.value.trim() !== s.tables.join(", "))
                          saveTables(s.id, e.target.value);
                      }}
                      placeholder="все"
                      className="w-36 rounded border border-border bg-background px-2 py-0.5 text-[11px] tabular-nums outline-none focus:border-gold/50"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggle(s.id, !s.isActive)}
                  disabled={pending}
                  className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-40"
                >
                  {s.isActive ? "Отключить" : "Включить"}
                </button>
                <button
                  onClick={() => remove(s.id, s.name)}
                  disabled={pending}
                  className="rounded-full border border-red-500/30 px-3 py-1 text-[11px] uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
