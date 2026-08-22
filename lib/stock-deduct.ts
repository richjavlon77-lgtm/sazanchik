import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dishes,
  dishVariants,
  recipeItems,
  ingredients,
  stockMovements,
} from "@/db/schema";
import { sendLowStockToTelegram } from "@/lib/telegram";
import { pickStockFactor, type VariantFactor } from "@/lib/stock-factor";

export type StockLine = { id: string; qty: number; price?: number };

/**
 * Resolve recipe ingredient amounts for a set of order lines (slug + qty).
 * Вариант порции масштабирует рецепт через stock_factor — вариант линии
 * определяется по её цене (см. lib/stock-factor.ts).
 */
async function ingredientAmounts(
  lines: StockLine[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  // «Эффективное» количество по блюду: qty × фактор варианта, посчитанный
  // на каждую линию (у одного блюда в заказе могут быть разные порции).
  const valid = lines.filter((l) => l.id && l.qty > 0);
  const slugs = [...new Set(valid.map((l) => l.id))];
  if (!slugs.length) return result;

  const dishRows = await db
    .select({ id: dishes.id, slug: dishes.slug })
    .from(dishes)
    .where(inArray(dishes.slug, slugs));
  if (!dishRows.length) return result;

  const variantRows = await db
    .select({
      dishId: dishVariants.dishId,
      price: dishVariants.price,
      stockFactor: dishVariants.stockFactor,
      sortOrder: dishVariants.sortOrder,
    })
    .from(dishVariants)
    .where(inArray(dishVariants.dishId, dishRows.map((d) => d.id)));

  const dishIdBySlug = new Map(dishRows.map((d) => [d.slug, d.id]));
  const variantsByDish = new Map<string, VariantFactor[]>();
  for (const v of variantRows) {
    const list = variantsByDish.get(v.dishId) ?? [];
    list.push(v);
    variantsByDish.set(v.dishId, list);
  }

  const effectiveQtyByDishId = new Map<string, number>();
  for (const l of valid) {
    const dishId = dishIdBySlug.get(l.id);
    if (!dishId) continue;
    const factor = pickStockFactor(variantsByDish.get(dishId) ?? [], l.price);
    effectiveQtyByDishId.set(
      dishId,
      (effectiveQtyByDishId.get(dishId) ?? 0) + l.qty * factor
    );
  }

  const recipes = await db
    .select()
    .from(recipeItems)
    .where(inArray(recipeItems.dishId, dishRows.map((d) => d.id)));

  for (const r of recipes) {
    const lineQty = effectiveQtyByDishId.get(r.dishId) ?? 0;
    const amount = r.qty * lineQty;
    if (amount > 0) result.set(r.ingredientId, (result.get(r.ingredientId) ?? 0) + amount);
  }
  return result;
}

async function applyStock(
  lines: StockLine[],
  sign: 1 | -1,
  reason: "order" | "correction"
): Promise<void> {
  try {
    const amounts = await ingredientAmounts(lines);
    if (!amounts.size) return;

    // All movements + stock updates for this order commit together — a
    // failure partway through must not leave stock half-adjusted.
    const alerts: { name: string; after: number; unit: string; min: number }[] =
      [];

    await db.transaction(async (tx) => {
      // pre-read meta to detect crossing below the minimum (for the alert)
      const rows = await tx
        .select({
          id: ingredients.id,
          name: ingredients.name,
          unit: ingredients.unit,
          stock: ingredients.stock,
          minStock: ingredients.minStock,
        })
        .from(ingredients)
        .where(inArray(ingredients.id, [...amounts.keys()]));
      const meta = new Map(rows.map((r) => [r.id, r]));

      for (const [ingredientId, amount] of amounts) {
        const m = meta.get(ingredientId);
        const delta = sign * amount;
        await tx.insert(stockMovements).values({ ingredientId, delta, reason });
        await tx
          .update(ingredients)
          .set({
            // Never let stock drift below 0 from an order deduction.
            stock: sql`GREATEST(0, ${ingredients.stock} + ${delta})`,
            updatedAt: sql`now()`,
          })
          .where(eq(ingredients.id, ingredientId));

        // Alert once, only when this change crosses from above min to at/below.
        if (m && delta < 0 && m.minStock > 0) {
          const after = Math.max(0, m.stock + delta);
          if (m.stock > m.minStock && after <= m.minStock) {
            alerts.push({ name: m.name, after, unit: m.unit, min: m.minStock });
          }
        }
      }
    });

    for (const a of alerts) {
      await sendLowStockToTelegram(a.name, a.after, a.unit, a.min).catch(() => {});
    }
  } catch (err) {
    console.error("Stock adjust failed (non-fatal):", err);
  }
}

/** Deduct ingredients for a new order (best-effort, never throws). */
export function deductForOrder(lines: StockLine[]) {
  return applyStock(lines, -1, "order");
}

/** Return ingredients when an order is cancelled (reverses the deduction).
 *  Цены линий берутся из снапшота заказа — фактор варианта тот же, что при
 *  списании, возврат симметричен. */
export function restockForOrder(lines: StockLine[]) {
  return applyStock(lines, 1, "correction");
}
