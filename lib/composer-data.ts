import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dishes, categories, dishVariants } from "@/db/schema";

/** One orderable line for the waiter's manual order composer.
 *  Dishes with portion variants are flattened into one entry per variant. */
export type ComposerItem = {
  key: string; // unique: slug[:variantKey]
  id: string; // dish slug
  variantKey?: string;
  nameRu: string;
  nameUz: string;
  nameEn: string;
  variantLabelRu?: string;
  variantLabelUz?: string;
  variantLabelEn?: string;
  label: string; // display (ru) incl. variant
  price: number;
  category: string; // ru category name (for grouping)
};

export async function loadComposerItems(): Promise<ComposerItem[]> {
  const [dishRows, variantRows] = await Promise.all([
    db
      .select({
        id: dishes.id,
        slug: dishes.slug,
        nameRu: dishes.nameRu,
        nameUz: dishes.nameUz,
        nameEn: dishes.nameEn,
        price: dishes.price,
        inStock: dishes.inStock,
        category: categories.nameRu,
        catSort: categories.sortOrder,
        dishSort: dishes.sortOrder,
      })
      .from(dishes)
      .innerJoin(categories, eq(dishes.categoryId, categories.id))
      .where(eq(dishes.isPublished, true))
      .orderBy(asc(categories.sortOrder), asc(dishes.sortOrder)),
    db.select().from(dishVariants).orderBy(asc(dishVariants.sortOrder)),
  ]);

  const variantsByDish = new Map<string, typeof variantRows>();
  for (const v of variantRows) {
    if (!variantsByDish.has(v.dishId)) variantsByDish.set(v.dishId, []);
    variantsByDish.get(v.dishId)!.push(v);
  }

  const items: ComposerItem[] = [];
  for (const d of dishRows) {
    if (d.inStock === false) continue; // respect the cook's stop-list
    const variants = variantsByDish.get(d.id) ?? [];
    if (variants.length > 0) {
      for (const v of variants) {
        items.push({
          key: `${d.slug}:${v.id}`,
          id: d.slug,
          variantKey: v.id,
          nameRu: d.nameRu,
          nameUz: d.nameUz,
          nameEn: d.nameEn,
          variantLabelRu: v.labelRu,
          variantLabelUz: v.labelUz,
          variantLabelEn: v.labelEn,
          label: `${d.nameRu} · ${v.labelRu}`,
          price: v.price,
          category: d.category,
        });
      }
    } else if (d.price != null) {
      items.push({
        key: d.slug,
        id: d.slug,
        nameRu: d.nameRu,
        nameUz: d.nameUz,
        nameEn: d.nameEn,
        label: d.nameRu,
        price: d.price,
        category: d.category,
      });
    }
  }
  return items;
}
