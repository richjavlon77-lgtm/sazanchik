import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { dishes, dishVariants } from "@/db/schema";
import {
  priceLines,
  type DishPricing,
  type Line,
  type PricedOk,
  type PricedErr,
} from "@/lib/pricing-core";

export type { Line, PricedOk, PricedErr } from "@/lib/pricing-core";

/**
 * Server-authoritative pricing. Client-sent prices are NEVER trusted: each
 * line price must match a real price for that dish in the DB (base price, or
 * one of its portion-variant prices). Totals are recomputed server-side with
 * the same rules as the cart (20% service, −10% birthday). Out-of-stock or
 * unpublished dishes are rejected. This protects the finance figures.
 *
 * Data access lives here; the actual math/validation is the pure, unit-tested
 * `priceLines` in `lib/pricing-core.ts`.
 */
export async function priceOrder(
  lines: Line[],
  isBirthday: boolean
): Promise<PricedOk | PricedErr> {
  if (!lines.length) return { ok: false, error: "Корзина пуста" };

  const slugs = [...new Set(lines.map((l) => l.id))];
  const dishRows = await db
    .select({
      id: dishes.id,
      slug: dishes.slug,
      price: dishes.price,
      isPublished: dishes.isPublished,
      inStock: dishes.inStock,
    })
    .from(dishes)
    .where(inArray(dishes.slug, slugs));

  const variantRows = dishRows.length
    ? await db
        .select({ dishId: dishVariants.dishId, price: dishVariants.price })
        .from(dishVariants)
        .where(
          inArray(
            dishVariants.dishId,
            dishRows.map((d) => d.id)
          )
        )
    : [];

  const variantPrices = new Map<string, number[]>();
  for (const v of variantRows) {
    if (!variantPrices.has(v.dishId)) variantPrices.set(v.dishId, []);
    variantPrices.get(v.dishId)!.push(v.price);
  }

  // Build the per-dish pricing lookup the pure core needs.
  const lookup = new Map<string, DishPricing>();
  for (const d of dishRows) {
    const validPrices =
      variantPrices.get(d.id) ?? (d.price != null ? [d.price] : []);
    lookup.set(d.slug, {
      isPublished: d.isPublished,
      inStock: d.inStock,
      validPrices,
    });
  }

  return priceLines(lines, lookup, isBirthday);
}
