"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addIngredient,
  updateIngredient,
  deleteIngredient,
  adjustStock,
} from "@/lib/inventory-actions";
import type { InventoryData, IngredientRow } from "@/lib/inventory-data";
import { cn } from "@/lib/utils";

const UNIT_LABEL: Record<string, string> = {
  g: "г",
  kg: "кг",
  ml: "мл",
  l: "л",
  pcs: "шт",
};
const REASON_LABEL: Record<string, string> = {
  receive: "приход",
  writeoff: "списание",
  order: "заказ",
  manual: "вручную",
  correction: "коррекция",
};

const money = (n: number) => n.toLocaleString("ru-RU") + " сум";
const num = (n: number) => Number(n.toFixed(2)).toLocaleString("ru-RU");

const field =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/60 focus:ring-3 focus:ring-gold/20";

export function InventoryManager({ data }: { data: InventoryData }) {
  const [pending, start] = useTransition();

  // add form
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [cost, setCost] = useState("");

  // per-row adjust amounts + edit state
  const [adj, setAdj] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", unit: "pcs", minStock: "", cost: "" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      try {
        await addIngredient({
          name,
          unit,
          stock: Number(stock) || 0,
          minStock: Number(minStock) || 0,
          costPerUnit: Number(cost) || 0,
        });
        toast.success(`«${name}» добавлен на склад`);
        setName("");
        setStock("");
        setMinStock("");
        setCost("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  };

  const doAdjust = (row: IngredientRow, direction: "receive" | "writeoff") => {
    const amount = Number(adj[row.id]);
    if (!amount || amount <= 0) {
      toast.error("Введите количество");
      return;
    }
    start(async () => {
      try {
        await adjustStock({ ingredientId: row.id, amount, direction });
        toast.success(
          `${direction === "receive" ? "Приход" : "Списание"}: ${num(amount)} ${UNIT_LABEL[row.unit]}`
        );
        setAdj((a) => ({ ...a, [row.id]: "" }));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  };

  const startEdit = (row: IngredientRow) => {
    setEditId(row.id);
    setEdit({
      name: row.name,
      unit: row.unit,
      minStock: String(row.minStock),
      cost: String(row.costPerUnit),
    });
  };

  const saveEdit = (id: string) =>
    start(async () => {
      try {
        await updateIngredient(id, {
          name: edit.name,
          unit: edit.unit,
          minStock: Number(edit.minStock) || 0,
          costPerUnit: Number(edit.cost) || 0,
        });
        toast.success("Сохранено");
        setEditId(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });

  const del = (row: IngredientRow) => {
    if (!confirm(`Удалить «${row.name}» со склада?`)) return;
    start(async () => {
      try {
        await deleteIngredient(row.id);
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
        <div className="rounded-2xl border border-gold/20 bg-card/40 p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Склад на сумму
          </div>
          <div className="mt-1 font-heading text-2xl tabular-nums text-gold">
            {money(data.totalValue)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Позиций
          </div>
          <div className="mt-1 font-heading text-2xl tabular-nums">
            {data.items.length}
          </div>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-5",
            data.lowCount > 0
              ? "border-red-500/40 bg-red-500/10"
              : "border-border bg-card/40"
          )}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Заканчивается
          </div>
          <div
            className={cn(
              "mt-1 font-heading text-2xl tabular-nums",
              data.lowCount > 0 && "text-red-400"
            )}
          >
            {data.lowCount}
          </div>
        </div>
      </div>

      {/* Add ingredient */}
      <form
        onSubmit={add}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-gold/20 bg-card/40 p-4"
      >
        <Labeled label="Название">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Говядина"
            required
            className={field}
          />
        </Labeled>
        <Labeled label="Ед.">
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className={field}>
            {Object.entries(UNIT_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Остаток">
          <input
            value={stock}
            onChange={(e) => setStock(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="0"
            className={cn(field, "w-24 tabular-nums")}
          />
        </Labeled>
        <Labeled label="Мин. остаток">
          <input
            value={minStock}
            onChange={(e) => setMinStock(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="0"
            className={cn(field, "w-24 tabular-nums")}
          />
        </Labeled>
        <Labeled label="Цена за ед. (сум)">
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="0"
            className={cn(field, "w-32 tabular-nums")}
          />
        </Labeled>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          + На склад
        </button>
      </form>

      {/* Ingredients list */}
      {data.items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 px-5 py-10 text-center text-sm text-muted-foreground">
          Склад пуст. Добавьте первый товар сверху.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card/40">
          {data.items.map((row) => (
            <div key={row.id} className="border-b border-border/50 px-4 py-3 last:border-b-0">
              {editId === row.id ? (
                /* edit mode */
                <div className="flex flex-wrap items-end gap-2">
                  <input
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    className={field}
                  />
                  <select
                    value={edit.unit}
                    onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                    className={field}
                  >
                    {Object.entries(UNIT_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <Labeled label="Мин.">
                    <input
                      value={edit.minStock}
                      onChange={(e) =>
                        setEdit({ ...edit, minStock: e.target.value.replace(/[^\d.]/g, "") })
                      }
                      className={cn(field, "w-20 tabular-nums")}
                    />
                  </Labeled>
                  <Labeled label="Цена">
                    <input
                      value={edit.cost}
                      onChange={(e) =>
                        setEdit({ ...edit, cost: e.target.value.replace(/\D/g, "") })
                      }
                      className={cn(field, "w-28 tabular-nums")}
                    />
                  </Labeled>
                  <button
                    onClick={() => saveEdit(row.id)}
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
                /* normal row */
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.name}</span>
                      {row.low && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-red-400">
                          заканчивается
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      Остаток:{" "}
                      <span className={cn("text-foreground", row.low && "text-red-400")}>
                        {num(row.stock)} {UNIT_LABEL[row.unit]}
                      </span>
                      {row.minStock > 0 && <> · мин {num(row.minStock)}</>}
                      {row.costPerUnit > 0 && (
                        <>
                          {" "}
                          · {money(row.costPerUnit)}/{UNIT_LABEL[row.unit]} · на{" "}
                          {money(row.value)}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      value={adj[row.id] ?? ""}
                      onChange={(e) =>
                        setAdj((a) => ({
                          ...a,
                          [row.id]: e.target.value.replace(/[^\d.]/g, ""),
                        }))
                      }
                      inputMode="decimal"
                      placeholder="кол-во"
                      className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs tabular-nums outline-none focus:border-gold/50"
                    />
                    <button
                      onClick={() => doAdjust(row, "receive")}
                      disabled={pending}
                      title="Приход"
                      className="rounded-full border border-emerald-500/40 px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500 hover:text-white disabled:opacity-40"
                    >
                      + Приход
                    </button>
                    <button
                      onClick={() => doAdjust(row, "writeoff")}
                      disabled={pending}
                      title="Списание"
                      className="rounded-full border border-red-500/40 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-40"
                    >
                      − Списать
                    </button>
                    <button
                      onClick={() => startEdit(row)}
                      className="rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-gold/40 hover:text-gold"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => del(row)}
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

      {/* Movement log */}
      {data.movements.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-lg">Движение склада</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card/40">
            {data.movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2 text-sm last:border-b-0"
              >
                <span className="min-w-0 truncate">
                  {m.name}
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {REASON_LABEL[m.reason] ?? m.reason}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3 tabular-nums">
                  <span className={m.delta >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {m.delta >= 0 ? "+" : ""}
                    {num(m.delta)} {UNIT_LABEL[m.unit]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{m.at}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
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
