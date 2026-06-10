"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, dishes, dishVariants, restaurant, storyChapters, reservations, staff, footballEvents } from "@/db/schema";
import { hashPin, verifyPin, isValidPin } from "@/lib/staff-auth";
import { signTable } from "@/lib/table-sign";
import { slugify } from "@/lib/slug";
import QRCode from "qrcode";

/** A slug that's unique among dishes (auto-suffixed), excluding the dish itself. */
async function uniqueDishSlug(
  desired: string,
  fallbackName: string,
  excludeId: string | null
): Promise<string> {
  const base = slugify(desired || fallbackName);
  let candidate = base;
  let n = 2;
  // small loop; dish counts are tiny
  for (;;) {
    const [row] = await db
      .select({ id: dishes.id })
      .from(dishes)
      .where(eq(dishes.slug, candidate));
    if (!row || (excludeId && row.id === excludeId)) return candidate;
    candidate = `${base}-${n++}`;
  }
}
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
  calories?: number | null;
  allergens?: string[];
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
  if (!input.nameRu?.trim()) throw new Error("Укажите название (RU)");

  const useVariants = (input.variants?.length ?? 0) > 0;

  // Auto slug: keeps an existing dish's slug; generates a unique one for new
  // dishes (or when left blank) so the manager never has to think about it.
  const slug = await uniqueDishSlug(input.slug, input.nameRu, id);

  // Fill UZ/EN from RU when left blank, so the manager can fill just RU and
  // the dish still shows in every language (instead of going blank).
  const ru = input.nameRu.trim();
  const descRu = input.descriptionRu?.trim() || null;
  const values = {
    categoryId: cat.id,
    slug,
    nameRu: ru,
    nameUz: input.nameUz?.trim() || ru,
    nameEn: input.nameEn?.trim() || ru,
    descriptionRu: descRu,
    descriptionUz: input.descriptionUz?.trim() || descRu,
    descriptionEn: input.descriptionEn?.trim() || descRu,
    price: useVariants ? null : input.price ?? null,
    imageUrl: input.imageUrl || null,
    weight: input.weight || null,
    spicy: input.spicy ?? null,
    diet: input.diet,
    calories: input.calories ?? null,
    allergens: input.allergens ?? [],
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
// Reordering (drag-n-drop)
// ============================================================================

export async function reorderDishes(orderedIds: string[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(dishes)
      .set({ sortOrder: i, updatedAt: sql`now()` })
      .where(eq(dishes.id, orderedIds[i]));
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function reorderCategories(orderedIds: string[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(categories)
      .set({ sortOrder: i, updatedAt: sql`now()` })
      .where(eq(categories.id, orderedIds[i]));
  }
  revalidatePath("/");
  revalidatePath("/admin");
}

// ============================================================================
// Reservations
// ============================================================================

export async function setReservationStatus(
  id: string,
  status: "new" | "confirmed" | "seated" | "cancelled"
) {
  await db
    .update(reservations)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(reservations.id, id));
  revalidatePath("/admin/reservations");
}

// ============================================================================
// Staff (waiters)
// ============================================================================

export async function createStaff(input: {
  name: string;
  pin: string;
  zone?: string;
}) {
  const name = input.name.trim();
  const pin = input.pin.trim();
  if (name.length < 2) throw new Error("Укажите имя");
  if (!isValidPin(pin)) throw new Error("PIN — это 4 цифры");

  // PIN must be unique among active staff (login matches by PIN)
  const active = await db.select().from(staff).where(eq(staff.isActive, true));
  if (active.some((s) => verifyPin(pin, s.pinHash))) {
    throw new Error("Этот PIN уже занят");
  }

  await db.insert(staff).values({
    name,
    pinHash: hashPin(pin),
    zone: input.zone?.trim() || null,
    isActive: true,
  });
  revalidatePath("/admin/staff");
}

export async function setStaffActive(id: string, isActive: boolean) {
  await db.update(staff).set({ isActive }).where(eq(staff.id, id));
  revalidatePath("/admin/staff");
}

export async function deleteStaff(id: string) {
  await db.delete(staff).where(eq(staff.id, id));
  revalidatePath("/admin/staff");
}

// ============================================================================
// Football events
// ============================================================================

export async function saveFootballEvent(
  id: string | null,
  input: {
    homeTeam: string;
    awayTeam: string;
    startsAt: string; // datetime-local
    league?: string;
    note?: string;
    isPublished: boolean;
  }
) {
  if (!input.homeTeam.trim() || !input.awayTeam.trim())
    throw new Error("Укажите обе команды");
  const starts = new Date(input.startsAt);
  if (Number.isNaN(starts.getTime())) throw new Error("Укажите дату и время");

  const values = {
    homeTeam: input.homeTeam.trim(),
    awayTeam: input.awayTeam.trim(),
    startsAt: starts,
    league: input.league?.trim() || null,
    note: input.note?.trim() || null,
    isPublished: input.isPublished,
  };

  if (id) {
    await db.update(footballEvents).set(values).where(eq(footballEvents.id, id));
  } else {
    await db.insert(footballEvents).values(values);
  }
  revalidatePath("/");
  revalidatePath("/admin/football");
}

export async function deleteFootballEvent(id: string) {
  await db.delete(footballEvents).where(eq(footballEvents.id, id));
  revalidatePath("/");
  revalidatePath("/admin/football");
}

// ============================================================================
// Tables — signed QR codes (anti-spoof)
// ============================================================================

export async function generateTableQRs(
  count: number
): Promise<{ num: number; url: string; qr: string }[]> {
  const n = Math.max(1, Math.min(100, Math.floor(count)));
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sazanchik.vercel.app";
  const out: { num: number; url: string; qr: string }[] = [];
  for (let i = 1; i <= n; i++) {
    const url = `${base}/?t=${encodeURIComponent(signTable(String(i)))}`;
    const qr = await QRCode.toDataURL(url, {
      width: 600,
      margin: 1,
      color: { dark: "#1a1611", light: "#ffffff" },
    });
    out.push({ num: i, url, qr });
  }
  return out;
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
