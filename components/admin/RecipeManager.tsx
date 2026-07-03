"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { setRecipeQty, removeRecipeItem } from "@/lib/recipe-actions";
import type { RecipeData, DishRecipe } from "@/lib/recipe-data";
import { cn } from "@/lib/utils";

const UNIT_LABEL: Record<string, string> = {
  g: "г",
  kg: "кг",
  ml: "мл",
  l: "л",
  pcs: "шт",
};
const money = (n: number) => n.toLocaleString("ru-RU") + " сум";
const num = (n: number) => Number(n.toFixed(2)).toLocaleString("ru-RU");

export function RecipeManager({ data }: { data: RecipeData }) {
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [pickQty, setPickQty] = useState<Record<string, string>>({});

  const hasIngredients = data.ingredients.length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.dishes;
    return data.dishes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    );
  }, [data.dishes, query]);

  const setQty = (dishId: string, ingredientId: string, qty: number) =>
    start(async () => {
      try {
        await setRecipeQty(dishId, ingredientId, qty);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Ошибка");
      }
    });

  const addLine = (dish: DishRecipe) => {
    const ingId = pick[dish.id];
    const qty = Number(pickQty[dish.id]);
    if (!ingId) {
      toast.error("Выберите ингредиент");
      return;
    }
    if (!qty || qty <= 0) {
      toast.error("Введите количество");
      return;
    }
    start(async () => {
      try {
        await setRecipeQty(dish.id, ingId, qty);
        toast.success("Добавлено в рецепт");
        setPick((p) => ({ ...p, [dish.id]: "" }));
        setPickQty((p) => ({ ...p, [dish.id]: "" }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Ошибка");
      }
    });
  };

  const remove = (dishId: string, ingredientId: string) =>
    start(async () => {
      try {
        await removeRecipeItem(dishId, ingredientId);
      } catch {
        toast.error("Ошибка");
      }
    });

  return (
    <div className="space-y-5">
      {!hasIngredients && (
        <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-muted-foreground">
          Сначала добавьте товары на{" "}
          <a href="/admin/inventory" className="text-gold underline">
            Складе
          </a>{" "}
          — потом их можно класть в рецепты блюд.
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск блюда…"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold/60 focus:ring-3 focus:ring-gold/20"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card/40">
        {filtered.map((d) => {
          const open = openId === d.id;
          const usedIds = new Set(d.recipe.map((r) => r.ingredientId));
          const available = data.ingredients.filter((i) => !usedIds.has(i.id));
          return (
            <div key={d.id} className="border-b border-border/50 last:border-b-0">
              {/* Summary row */}
              <button
                onClick={() => setOpenId(open ? null : d.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gold/[0.03]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {d.category}
                    </span>
                    {d.recipe.length === 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                        нет рецепта
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                    Цена: {d.price != null ? money(d.price) : "—"} · себестоим.:{" "}
                    <span className="text-foreground">{money(d.cost)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {d.margin != null ? (
                    <>
                      <div
                        className={cn(
                          "font-heading tabular-nums",
                          d.margin >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {money(d.margin)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        маржа {d.marginPct}%
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      цена не задана
                    </span>
                  )}
                </div>
              </button>

              {/* Recipe editor */}
              {open && (
                <div className="space-y-2 border-t border-border/50 bg-background/40 px-4 py-3">
                  {d.recipe.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Рецепт пуст. Добавьте ингредиенты ниже.
                    </p>
                  )}
                  {d.recipe.map((line) => (
                    <div key={line.ingredientId} className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{line.name}</span>
                      <input
                        defaultValue={num(line.qty)}
                        onBlur={(e) => {
                          const v = Number(e.target.value.replace(",", "."));
                          if (!Number.isFinite(v) || v <= 0) {
                            e.target.value = num(line.qty); // reject: revert, don't wipe the line
                            return;
                          }
                          if (v !== line.qty) setQty(d.id, line.ingredientId, v);
                        }}
                        inputMode="decimal"
                        className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-xs tabular-nums outline-none focus:border-gold/50"
                      />
                      <span className="w-8 text-xs text-muted-foreground">
                        {UNIT_LABEL[line.unit]}
                      </span>
                      <span className="w-28 text-right text-xs tabular-nums text-muted-foreground">
                        {money(line.lineCost)}
                      </span>
                      <button
                        onClick={() => remove(d.id, line.ingredientId)}
                        disabled={pending}
                        className="text-xs text-muted-foreground hover:text-red-400 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add line */}
                  {available.length > 0 && (
                    <div className="flex items-center gap-2 border-t border-border/50 pt-2">
                      <select
                        value={pick[d.id] ?? ""}
                        onChange={(e) =>
                          setPick((p) => ({ ...p, [d.id]: e.target.value }))
                        }
                        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-gold/50"
                      >
                        <option value="">+ ингредиент…</option>
                        {available.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({UNIT_LABEL[i.unit]}, {money(i.costPerUnit)})
                          </option>
                        ))}
                      </select>
                      <input
                        value={pickQty[d.id] ?? ""}
                        onChange={(e) =>
                          setPickQty((p) => ({
                            ...p,
                            [d.id]: e.target.value.replace(/[^\d.]/g, ""),
                          }))
                        }
                        inputMode="decimal"
                        placeholder="кол-во"
                        className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs tabular-nums outline-none focus:border-gold/50"
                      />
                      <button
                        onClick={() => addLine(d)}
                        disabled={pending}
                        className="rounded-full bg-gold px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
