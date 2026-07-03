"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeActive,
  paySalary,
} from "@/lib/payroll-actions";
import { POSITIONS, POSITION_LABEL } from "@/lib/positions";
import type { PayrollData, EmployeeRow } from "@/lib/payroll-data";
import { cn } from "@/lib/utils";

const money = (n: number) => n.toLocaleString("ru-RU") + " сум";
const field =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60 focus:ring-3 focus:ring-gold/20";

export function PayrollManager({ data }: { data: PayrollData }) {
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [position, setPosition] = useState("waiter");
  const [rate, setRate] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", position: "waiter", rate: "" });
  const [days, setDays] = useState<Record<string, string>>({});

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      try {
        await addEmployee({ name, position, dailyRate: Number(rate) || 0 });
        toast.success(`${name} добавлен`);
        setName("");
        setRate("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  };

  const startEdit = (emp: EmployeeRow) => {
    setEditId(emp.id);
    setEdit({ name: emp.name, position: emp.position, rate: String(emp.dailyRate) });
  };

  const saveEdit = (id: string) =>
    start(async () => {
      try {
        await updateEmployee(id, {
          name: edit.name,
          position: edit.position,
          dailyRate: Number(edit.rate) || 0,
        });
        toast.success("Сохранено");
        setEditId(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });

  const pay = (emp: EmployeeRow) => {
    const d = Number(days[emp.id] || "1");
    if (!d || d <= 0) {
      toast.error("Укажите дни");
      return;
    }
    if (!confirm(`Выплатить ${emp.name}: ${money(emp.dailyRate * d)} за ${d} дн?`))
      return;
    start(async () => {
      try {
        await paySalary({ employeeId: emp.id, days: d });
        toast.success(`Выплачено ${money(emp.dailyRate * d)}`);
        setDays((s) => ({ ...s, [emp.id]: "" }));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  };

  const toggle = (emp: EmployeeRow) =>
    start(async () => {
      try {
        await setEmployeeActive(emp.id, !emp.isActive);
      } catch {
        toast.error("Ошибка");
      }
    });

  const del = (emp: EmployeeRow) => {
    if (!confirm(`Удалить ${emp.name} из реестра?`)) return;
    start(async () => {
      try {
        await deleteEmployee(emp.id);
        toast.success("Удалён");
      } catch {
        toast.error("Ошибка");
      }
    });
  };

  return (
    <div className="space-y-7">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Дневной фонд" value={money(data.dailyFund)} accent />
        <Stat label="Оценка за месяц (×26)" value={money(data.monthlyEstimate)} />
        <Stat label="Выплачено за 30 дней" value={money(data.paidThisMonth)} red />
      </div>

      {/* Add employee */}
      <form
        onSubmit={add}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-gold/20 bg-card/40 p-4"
      >
        <Labeled label="Имя">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Иван"
            required
            className={field}
          />
        </Labeled>
        <Labeled label="Должность">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={field}
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Дневной гарант (сум)">
          <input
            value={rate}
            onChange={(e) => setRate(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="250000"
            className={cn(field, "w-36 tabular-nums")}
          />
        </Labeled>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          + Сотрудник
        </button>
      </form>

      {/* Roster */}
      {data.employees.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
          Реестр пуст. Добавьте сотрудников сверху.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card/40">
          {data.employees.map((emp) => (
            <div key={emp.id} className="border-b border-border/50 px-4 py-3 last:border-b-0">
              {editId === emp.id ? (
                <div className="flex flex-wrap items-end gap-2">
                  <input
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    className={field}
                  />
                  <select
                    value={edit.position}
                    onChange={(e) => setEdit({ ...edit, position: e.target.value })}
                    className={field}
                  >
                    {POSITIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={edit.rate}
                    onChange={(e) =>
                      setEdit({ ...edit, rate: e.target.value.replace(/\D/g, "") })
                    }
                    inputMode="numeric"
                    className={cn(field, "w-32 tabular-nums")}
                  />
                  <button
                    onClick={() => saveEdit(emp.id)}
                    disabled={pending}
                    className="rounded-full bg-gold px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{emp.name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {POSITION_LABEL[emp.position] ?? emp.position}
                      </span>
                      {!emp.isActive && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                          уволен
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {money(emp.dailyRate)} / день
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      value={days[emp.id] ?? ""}
                      onChange={(e) =>
                        setDays((s) => ({
                          ...s,
                          [emp.id]: e.target.value.replace(/[^\d.]/g, ""),
                        }))
                      }
                      inputMode="decimal"
                      placeholder="дн"
                      className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-xs tabular-nums outline-none focus:border-gold/50"
                    />
                    <button
                      onClick={() => pay(emp)}
                      disabled={pending}
                      className="rounded-full border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500 hover:text-white disabled:opacity-40"
                    >
                      Выплатить
                    </button>
                    <button
                      onClick={() => toggle(emp)}
                      disabled={pending}
                      className="rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-gold/40 hover:text-gold disabled:opacity-40"
                    >
                      {emp.isActive ? "Уволить" : "Вернуть"}
                    </button>
                    <button
                      onClick={() => startEdit(emp)}
                      className="rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-gold/40 hover:text-gold"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => del(emp)}
                      disabled={pending}
                      className="rounded-full border border-red-500/30 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent salary payments */}
      {data.payments.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-lg">Последние выплаты</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card/40">
            {data.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2 text-sm last:border-b-0"
              >
                <span className="min-w-0 truncate text-muted-foreground">
                  {p.note ?? "Зарплата"}
                </span>
                <span className="flex shrink-0 items-center gap-3 tabular-nums">
                  <span className="text-red-400">{money(p.amount)}</span>
                  <span className="text-[11px] text-muted-foreground">{p.at}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Выплаты попадают в раздел{" "}
            <a href="/admin/finance" className="text-gold underline">
              Финансы
            </a>{" "}
            как расход «Зарплата» и уменьшают прибыль.
          </p>
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

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
