import { db } from "@/db";
import { categories, dishes, dishVariants, restaurant, storyChapters } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import type {
  MenuCategory,
  MenuItem,
  Localized,
  Price,
  RestaurantInfo,
} from "@/types/menu";

/**
 * Fetches full menu from DB shaped to match the static MENU structure.
 * Used by server components — caches per build / on-demand revalidation.
 */
export async function getMenuFromDb(): Promise<MenuCategory[]> {
  const [cats, allDishes, allVariants] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.isPublished, true))
      .orderBy(asc(categories.sortOrder)),
    db
      .select()
      .from(dishes)
      .where(eq(dishes.isPublished, true))
      .orderBy(asc(dishes.sortOrder)),
    db.select().from(dishVariants).orderBy(asc(dishVariants.sortOrder)),
  ]);

  // Group variants by dish_id
  const variantsByDish = new Map<string, typeof allVariants>();
  for (const v of allVariants) {
    const list = variantsByDish.get(v.dishId) ?? [];
    list.push(v);
    variantsByDish.set(v.dishId, list);
  }

  // Group dishes by category_id
  const dishesByCat = new Map<string, typeof allDishes>();
  for (const d of allDishes) {
    const list = dishesByCat.get(d.categoryId) ?? [];
    list.push(d);
    dishesByCat.set(d.categoryId, list);
  }

  return cats.map<MenuCategory>((c) => {
    const items: MenuItem[] = (dishesByCat.get(c.id) ?? []).map((d) => {
      const variants = variantsByDish.get(d.id) ?? [];
      let price: Price;
      if (variants.length > 0) {
        price = variants.map((v) => ({
          label: {
            ru: v.labelRu,
            uz: v.labelUz,
            en: v.labelEn,
            tr: v.labelTr ?? undefined,
          } as Localized,
          price: v.price,
        }));
      } else {
        price = d.price ?? 0;
      }

      const tags: Localized[] = [];
      const len = Math.max(d.tagsRu.length, d.tagsUz.length, d.tagsEn.length);
      for (let i = 0; i < len; i++) {
        tags.push({
          ru: d.tagsRu[i] ?? "",
          uz: d.tagsUz[i] ?? "",
          en: d.tagsEn[i] ?? "",
        });
      }

      return {
        id: d.slug,
        name: {
          ru: d.nameRu,
          uz: d.nameUz,
          en: d.nameEn,
          tr: d.nameTr ?? undefined,
        },
        description:
          d.descriptionRu || d.descriptionUz || d.descriptionEn
            ? {
                ru: d.descriptionRu ?? "",
                uz: d.descriptionUz ?? "",
                en: d.descriptionEn ?? "",
                tr: d.descriptionTr ?? undefined,
              }
            : undefined,
        price,
        image: d.imageUrl ?? undefined,
        weight: d.weight ?? undefined,
        spicy: d.spicy as 1 | 2 | 3 | undefined,
        diet: (d.diet as MenuItem["diet"]) ?? [],
        calories: d.calories ?? undefined,
        allergens: ((d.allergens as string[]) ?? []).length
          ? (d.allergens as string[])
          : undefined,
        tags: tags.length ? tags : undefined,
        outOfStock: d.inStock === false,
      };
    });

    return {
      id: c.slug,
      name: {
        ru: c.nameRu,
        uz: c.nameUz,
        en: c.nameEn,
        tr: c.nameTr ?? undefined,
      },
      intro:
        c.introRu || c.introUz || c.introEn
          ? {
              ru: c.introRu ?? "",
              uz: c.introUz ?? "",
              en: c.introEn ?? "",
              tr: c.introTr ?? undefined,
            }
          : undefined,
      items,
    };
  });
}

export async function getRestaurantFromDb(): Promise<RestaurantInfo | null> {
  const [r] = await db.select().from(restaurant).where(eq(restaurant.id, 1));
  if (!r) return null;
  return {
    name: r.name,
    tagline: { ru: r.taglineRu, uz: r.taglineUz, en: r.taglineEn, tr: r.taglineTr || undefined },
    address: { ru: r.addressRu, uz: r.addressUz, en: r.addressEn, tr: r.addressTr || undefined },
    phone: r.phone,
    workingHours: { ru: r.hoursRu, uz: r.hoursUz, en: r.hoursEn, tr: r.hoursTr || undefined },
    instagram: r.instagram,
  };
}

export type StoryFromDb = {
  title: Localized;
  body: Localized;
};

export async function getStoryFromDb(): Promise<StoryFromDb[]> {
  const rows = await db
    .select()
    .from(storyChapters)
    .orderBy(asc(storyChapters.sortOrder));
  return rows.map((r) => ({
    title: { ru: r.titleRu, uz: r.titleUz, en: r.titleEn, tr: r.titleTr ?? undefined },
    body: { ru: r.bodyRu, uz: r.bodyUz, en: r.bodyEn, tr: r.bodyTr ?? undefined },
  }));
}
