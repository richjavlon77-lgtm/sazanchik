"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, dishes, dishVariants, restaurant, storyChapters } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";

// ============================================================================
// Dish CRUD
// ============================================================================

export type DishFormInput = {
  categorySlug: string;
  slug: string;
  nameRu: string;
  nameUz: string;
  nameEn: string;
  descriptionRu?: string;
  descriptionUz?: string;
  descriptionEn?: string;
  price?: number | null;
  weight?: string;
  imageUrl?: string;
  spicy?: 1 | 2 | 3 | null;
  diet: string[];
  isPublished: boolean;
  sortOrder?: number;
  variants?: {
    labelRu: string;
    labelUz: string;
    labelEn: string;
    price: number;
  }[];
};

export async function saveDish(id: string | null, input: DishFormInput) {
  // Find category by slug
  const [cat] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, input.categorySlug));
  if (!cat) throw new Error("Category not found");

  const useVariants = (input.variants?.length ?? 0) > 0;

  const values = {
    categoryId: cat.id,
    slug: input.slug,
    nameRu: input.nameRu,
    nameUz: input.nameUz,
    nameEn: input.nameEn,
    descriptionRu: input.descriptionRu || null,
    descriptionUz: input.descriptionUz || null,
    descriptionEn: input.descriptionEn || null,
    price: useVariants ? null : input.price ?? null,
    imageUrl: input.imageUrl || null,
    weight: input.weight || null,
    spicy: input.spicy ?? null,
    diet: input.diet,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder ?? 0,
  };

  let dishId: string;
  if (id) {
    await db.update(dishes).set({ ...values, updatedAt: sql`now()` }).where(eq(dishes.id, id));
    dishId = id;
  } else {
    const [row] = await db.insert(dishes).values(values).returning({ id: dishes.id });
    dishId = row.id;
  }

  // Replace variants
  await db.delete(dishVariants).where(eq(dishVariants.dishId, dishId));
  if (useVariants && input.variants) {
    for (let i = 0; i < input.variants.length; i++) {
      const v = input.variants[i];
      await db.insert(dishVariants).values({
        dishId,
        labelRu: v.labelRu,
        labelUz: v.labelUz,
        labelEn: v.labelEn,
        price: v.price,
        sortOrder: i,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { id: dishId };
}

export async function deleteDish(id: string) {
  await db.delete(dishes).where(eq(dishes.id, id));
  revalidatePath("/");
  revalidatePath("/admin");
}

// ============================================================================
// Category CRUD
// ============================================================================

export type CategoryFormInput = {
  slug: string;
  nameRu: string;
  nameUz: string;
  nameEn: string;
  introRu?: string;
  introUz?: string;
  introEn?: string;
  isPublished: boolean;
  sortOrder?: number;
};

export async function saveCategory(id: string | null, input: CategoryFormInput) {
  const values = {
    slug: input.slug,
    nameRu: input.nameRu,
    nameUz: input.nameUz,
    nameEn: input.nameEn,
    introRu: input.introRu || null,
    introUz: input.introUz || null,
    introEn: input.introEn || null,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder ?? 0,
  };

  if (id) {
    await db.update(categories).set({ ...values, updatedAt: sql`now()` }).where(eq(categories.id, id));
  } else {
    await db.insert(categories).values(values);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/");
  revalidatePath("/admin");
}

// ============================================================================
// Restaurant
// ============================================================================

export async function saveRestaurant(input: {
  name: string;
  taglineRu: string;
  taglineUz: string;
  taglineEn: string;
  addressRu: string;
  addressUz: string;
  addressEn: string;
  phone: string;
  hoursRu: string;
  hoursUz: string;
  hoursEn: string;
  instagram: string;
}) {
  await db
    .insert(restaurant)
    .values({ id: 1, ...input })
    .onConflictDoUpdate({
      target: restaurant.id,
      set: { ...input, updatedAt: sql`now()` },
    });
  revalidatePath("/");
  revalidatePath("/admin");
}

// ============================================================================
// Story chapters
// ============================================================================

export async function saveStory(
  chapters: {
    id?: string;
    titleRu: string;
    titleUz: string;
    titleEn: string;
    bodyRu: string;
    bodyUz: string;
    bodyEn: string;
  }[]
) {
  // Simple replace-all strategy — small list (~4 chapters)
  await db.delete(storyChapters);
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    await db.insert(storyChapters).values({
      titleRu: c.titleRu,
      titleUz: c.titleUz,
      titleEn: c.titleEn,
      bodyRu: c.bodyRu,
      bodyUz: c.bodyUz,
      bodyEn: c.bodyEn,
      sortOrder: i,
    });
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

// ============================================================================
// Fetch helpers for forms
// ============================================================================

export async function getAllCategoriesForForm() {
  return db
    .select({ id: categories.id, slug: categories.slug, nameRu: categories.nameRu })
    .from(categories)
    .orderBy(asc(categories.sortOrder));
}

export async function getDishById(id: string) {
  const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
  if (!dish) return null;
  const variants = await db
    .select()
    .from(dishVariants)
    .where(eq(dishVariants.dishId, id))
    .orderBy(asc(dishVariants.sortOrder));
  const [cat] = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, dish.categoryId));
  return { dish, variants, categorySlug: cat?.slug };
}
