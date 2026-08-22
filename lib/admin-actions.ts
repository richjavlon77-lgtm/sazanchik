"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, dishes, dishVariants, restaurant, storyChapters, reservations, staff, footballEvents, uploads } from "@/db/schema";
import { hashPin, verifyPin, isValidPin } from "@/lib/staff-auth";
import { signTable } from "@/lib/table-sign";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { getSession } from "@/lib/session";
import { parseTashkentLocal } from "@/lib/tz";
import QRCode from "qrcode";

/** Every admin action is manager-only — verified in-action (defense in depth,
 *  not just the proxy). */
async function requireManager() {
  const session = await getSession();
  if (!session || session.role !== "manager") throw new Error("Unauthorized");
}

/** Deletes an orphaned dish photo (DB-stored `/api/img/:id` row, or a Vercel
 *  Blob object) when it's no longer the current image for `excludeDishId`
 *  and no *other* dish still points at it. Swaps and cancelled edits used to
 *  leak these forever — best-effort, never blocks the save. */
async function cleanupOldDishImage(
  oldUrl: string | null | undefined,
  newUrl: string | null | undefined,
  excludeDishId: string | null
) {
  if (!oldUrl || oldUrl === newUrl) return;
  try {
    const stillUsedQuery = db
      .select({ id: dishes.id })
      .from(dishes)
      .where(eq(dishes.imageUrl, oldUrl));
    const stillUsed = excludeDishId
      ? (await stillUsedQuery).filter((r) => r.id !== excludeDishId)
      : await stillUsedQuery;
    if (stillUsed.length) return; // another dish still uses this image

    const dbImage = oldUrl.match(/^\/api\/img\/([0-9a-f-]+)$/i);
    if (dbImage) {
      await db.delete(uploads).where(eq(uploads.id, dbImage[1]));
      return;
    }
    if (oldUrl.includes(".blob.vercel-storage.com")) {
      const { del } = await import("@vercel/blob");
      await del(oldUrl).catch(() => {});
    }
  } catch (err) {
    console.error("Old dish image cleanup failed (non-fatal):", err);
  }
}

/** Called when a manager uploads a new dish photo but then cancels the form
 *  instead of saving — the upload already landed in storage/DB, so without
 *  this it leaks forever. Manager-gated like every other admin action. */
export async function discardUnsavedImage(url: string) {
  await requireManager();
  await cleanupOldDishImage(url, null, null);
}

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
  nameTr?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  descriptionEn?: string;
  descriptionTr?: string;
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
    labelTr?: string;
    price: number;
    /** Доля рецепта блюда за эту порцию (по умолчанию 1) */
    stockFactor?: number;
  }[];
};

export async function saveDish(id: string | null, input: DishFormInput) {
  await requireManager();
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
    nameTr: input.nameTr?.trim() || null,
    descriptionRu: descRu,
    descriptionUz: input.descriptionUz?.trim() || descRu,
    descriptionEn: input.descriptionEn?.trim() || descRu,
    descriptionTr: input.descriptionTr?.trim() || null,
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
    const [prev] = await db
      .select({ imageUrl: dishes.imageUrl })
      .from(dishes)
      .where(eq(dishes.id, id));
    await db.update(dishes).set({ ...values, updatedAt: sql`now()` }).where(eq(dishes.id, id));
    dishId = id;
    await cleanupOldDishImage(prev?.imageUrl, values.imageUrl, id);
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
        labelTr: v.labelTr?.trim() || null,
        price: v.price,
        // защита от мусора из формы: фактор всегда положительный
        stockFactor:
          v.stockFactor && v.stockFactor > 0 ? v.stockFactor : 1,
        sortOrder: i,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { id: dishId };
}

export async function deleteDish(id: string) {
  await requireManager();
  const [prev] = await db
    .select({ imageUrl: dishes.imageUrl, nameRu: dishes.nameRu })
    .from(dishes)
    .where(eq(dishes.id, id));
  await db.delete(dishes).where(eq(dishes.id, id));
  if (prev) await logAudit("dish.delete", id, { name: prev.nameRu });
  await cleanupOldDishImage(prev?.imageUrl, null, id);
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
  nameTr?: string;
  introRu?: string;
  introUz?: string;
  introEn?: string;
  introTr?: string;
  isPublished: boolean;
  sortOrder?: number;
};

export async function saveCategory(id: string | null, input: CategoryFormInput) {
  await requireManager();
  const slug = slugify(input.slug || input.nameRu);

  const [dupe] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug));
  if (dupe && dupe.id !== id) {
    throw new Error("Такой раздел уже существует — выберите другой slug");
  }

  const values = {
    slug,
    nameRu: input.nameRu,
    nameUz: input.nameUz,
    nameEn: input.nameEn,
    nameTr: input.nameTr?.trim() || null,
    introRu: input.introRu || null,
    introUz: input.introUz || null,
    introEn: input.introEn || null,
    introTr: input.introTr?.trim() || null,
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
  await requireManager();
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
  await requireManager();
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
  await requireManager();
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
  await requireManager();
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(dishes)
        .set({ sortOrder: i, updatedAt: sql`now()` })
        .where(eq(dishes.id, orderedIds[i]));
    }
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function reorderCategories(orderedIds: string[]) {
  await requireManager();
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(categories)
        .set({ sortOrder: i, updatedAt: sql`now()` })
        .where(eq(categories.id, orderedIds[i]));
    }
  });
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
  await requireManager();
  await db
    .update(reservations)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(reservations.id, id));
  revalidatePath("/admin/reservations");
}

// ============================================================================
// Staff (waiters)
// ============================================================================

function parseTables(input?: string | string[]): string[] {
  const raw = Array.isArray(input) ? input.join(",") : input ?? "";
  return Array.from(
    new Set(
      raw
        .split(/[,\s]+/)
        .map((t) => t.replace(/\D/g, ""))
        .filter(Boolean)
    )
  );
}

export async function createStaff(input: {
  name: string;
  pin: string;
  zone?: string;
  tables?: string;
  role?: string;
}) {
  await requireManager();
  const name = input.name.trim();
  const pin = input.pin.trim();
  if (name.length < 2) throw new Error("Укажите имя");
  if (!isValidPin(pin)) throw new Error("PIN — это 4 цифры");

  type Kind = "waiter" | "bartender" | "hookah" | "cook" | "cold" | "meat";
  const kinds: Kind[] = ["waiter", "bartender", "hookah", "cook", "cold", "meat"];
  const role: Kind = kinds.includes(input.role as Kind)
    ? (input.role as Kind)
    : "waiter";

  // PIN must be unique among active staff (login matches by PIN)
  const active = await db.select().from(staff).where(eq(staff.isActive, true));
  if (active.some((s) => verifyPin(pin, s.pinHash))) {
    throw new Error("Этот PIN уже занят");
  }

  await db.insert(staff).values({
    name,
    pinHash: hashPin(pin),
    role,
    zone: input.zone?.trim() || null,
    tables: parseTables(input.tables),
    isActive: true,
  });
  revalidatePath("/admin/staff");
}

export async function setStaffActive(id: string, isActive: boolean) {
  await requireManager();
  await db.update(staff).set({ isActive }).where(eq(staff.id, id));
  revalidatePath("/admin/staff");
}

export async function setStaffTables(id: string, tables: string) {
  await requireManager();
  await db
    .update(staff)
    .set({ tables: parseTables(tables) })
    .where(eq(staff.id, id));
  revalidatePath("/admin/staff");
}

export async function deleteStaff(id: string) {
  await requireManager();
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
  await requireManager();
  if (!input.homeTeam.trim() || !input.awayTeam.trim())
    throw new Error("Укажите обе команды");
  const starts = parseTashkentLocal(input.startsAt);
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
  await requireManager();
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
  await requireManager();
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
  await requireManager();
  return db
    .select({ id: categories.id, slug: categories.slug, nameRu: categories.nameRu })
    .from(categories)
    .orderBy(asc(categories.sortOrder));
}

export async function getDishById(id: string) {
  await requireManager();
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
