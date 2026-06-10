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

export type StaffRow = {
  id: string;
  name: string;
  zone: string | null;
  tables: string[];
  isActive: boolean;
};

export type StaffStat = {
  ordersToday: number;
  ordersTotal: number;
  callsToday: number;
  callsTotal: number;
};

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
  const [zone, setZone] = useState("");
  const [tables, setTables] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      try {
        await createStaff({ name, pin, zone, tables });
        toast.success(`Официант «${name}» добавлен`);
        setName("");
        setPin("");
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
                  if (!st) return null;
                  return (
                    <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                      <span className="text-gold">Сегодня:</span> {st.ordersToday}{" "}
                      заказ. · {st.callsToday} вызов.{" "}
                      <span className="opacity-60">
                        (всего {st.ordersTotal} / {st.callsTotal})
                      </span>
                    </div>
                  );
                })()}
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
