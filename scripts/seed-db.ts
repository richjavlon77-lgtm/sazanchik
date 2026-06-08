#!/usr/bin/env tsx
/**
 * Seed Neon database with the current static menu data.
 * Idempotent — uses upsert on slug.
 *
 * Usage: npm run seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import { MENU } from "../data/menu";
import { RESTAURANT } from "../data/restaurant";
import { STORY } from "../data/story";
import { CATEGORY_INTROS } from "../data/category-intros";
import {
  categories,
  dishes,
  dishVariants,
  restaurant,
  storyChapters,
} from "../db/schema";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error("Missing DATABASE_URL_UNPOOLED in env");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function seedRestaurant() {
  console.log("• Restaurant info...");
  await db
    .insert(restaurant)
    .values({
      id: 1,
      name: RESTAURANT.name,
      taglineRu: RESTAURANT.tagline.ru,
      taglineUz: RESTAURANT.tagline.uz,
      taglineEn: RESTAURANT.tagline.en,
      addressRu: RESTAURANT.address.ru,
      addressUz: RESTAURANT.address.uz,
      addressEn: RESTAURANT.address.en,
      phone: RESTAURANT.phone,
      hoursRu: RESTAURANT.workingHours.ru,
      hoursUz: RESTAURANT.workingHours.uz,
      hoursEn: RESTAURANT.workingHours.en,
      instagram: RESTAURANT.instagram,
    })
    .onConflictDoUpdate({
      target: restaurant.id,
      set: {
        name: RESTAURANT.name,
        taglineRu: RESTAURANT.tagline.ru,
        taglineUz: RESTAURANT.tagline.uz,
        taglineEn: RESTAURANT.tagline.en,
        addressRu: RESTAURANT.address.ru,
        addressUz: RESTAURANT.address.uz,
        addressEn: RESTAURANT.address.en,
        phone: RESTAURANT.phone,
        hoursRu: RESTAURANT.workingHours.ru,
        hoursUz: RESTAURANT.workingHours.uz,
        hoursEn: RESTAURANT.workingHours.en,
        instagram: RESTAURANT.instagram,
      },
    });
}

async function seedStory() {
  console.log("• Story chapters...");
  // Clear all then re-insert in order
  await db.delete(storyChapters);
  for (let i = 0; i < STORY.length; i++) {
    const ch = STORY[i];
    await db.insert(storyChapters).values({
      titleRu: ch.title.ru,
      titleUz: ch.title.uz,
      titleEn: ch.title.en,
      bodyRu: ch.body.ru,
      bodyUz: ch.body.uz,
      bodyEn: ch.body.en,
      sortOrder: i,
    });
  }
}

async function seedMenu() {
  console.log("• Categories + dishes...");
  for (let ci = 0; ci < MENU.length; ci++) {
    const cat = MENU[ci];
    const intro = CATEGORY_INTROS[cat.id];

    const [catRow] = await db
      .insert(categories)
      .values({
        slug: cat.id,
        nameRu: cat.name.ru,
        nameUz: cat.name.uz,
        nameEn: cat.name.en,
        introRu: intro?.ru ?? null,
        introUz: intro?.uz ?? null,
        introEn: intro?.en ?? null,
        sortOrder: ci,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          nameRu: cat.name.ru,
          nameUz: cat.name.uz,
          nameEn: cat.name.en,
          introRu: intro?.ru ?? null,
          introUz: intro?.uz ?? null,
          introEn: intro?.en ?? null,
          sortOrder: ci,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: categories.id });

    for (let di = 0; di < cat.items.length; di++) {
      const item = cat.items[di];
      const isVariants = Array.isArray(item.price);
      const flatPrice = isVariants ? null : (item.price as number);

      const tagsRu = item.tags?.map((t) => t.ru) ?? [];
      const tagsUz = item.tags?.map((t) => t.uz) ?? [];
      const tagsEn = item.tags?.map((t) => t.en) ?? [];

      const [dishRow] = await db
        .insert(dishes)
        .values({
          categoryId: catRow.id,
          slug: item.id,
          nameRu: item.name.ru,
          nameUz: item.name.uz,
          nameEn: item.name.en,
          descriptionRu: item.description?.ru ?? null,
          descriptionUz: item.description?.uz ?? null,
          descriptionEn: item.description?.en ?? null,
          price: flatPrice,
          imageUrl: item.image ?? null,
          weight: item.weight ?? null,
          spicy: item.spicy ?? null,
          diet: item.diet ?? [],
          tagsRu,
          tagsUz,
          tagsEn,
          sortOrder: di,
        })
        .onConflictDoUpdate({
          target: dishes.slug,
          set: {
            categoryId: catRow.id,
            nameRu: item.name.ru,
            nameUz: item.name.uz,
            nameEn: item.name.en,
            descriptionRu: item.description?.ru ?? null,
            descriptionUz: item.description?.uz ?? null,
            descriptionEn: item.description?.en ?? null,
            price: flatPrice,
            imageUrl: item.image ?? null,
            weight: item.weight ?? null,
            spicy: item.spicy ?? null,
            diet: item.diet ?? [],
            tagsRu,
            tagsUz,
            tagsEn,
            sortOrder: di,
            updatedAt: sql`now()`,
          },
        })
        .returning({ id: dishes.id });

      // Reset variants and reinsert
      await db.delete(dishVariants).where(eq(dishVariants.dishId, dishRow.id));
      if (isVariants) {
        const variants = item.price as {
          label: { ru: string; uz: string; en: string };
          price: number;
        }[];
        for (let vi = 0; vi < variants.length; vi++) {
          const v = variants[vi];
          await db.insert(dishVariants).values({
            dishId: dishRow.id,
            labelRu: v.label.ru,
            labelUz: v.label.uz,
            labelEn: v.label.en,
            price: v.price,
            sortOrder: vi,
          });
        }
      }
    }
  }
}

async function main() {
  console.log("Seeding Neon from static menu data...\n");
  await seedRestaurant();
  await seedStory();
  await seedMenu();

  const [{ count: catsCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categories);
  const [{ count: dishesCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dishes);
  const [{ count: variantsCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dishVariants);

  console.log(
    `\n✓ Done. Categories: ${catsCount}, dishes: ${dishesCount}, variants: ${variantsCount}`
  );
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
