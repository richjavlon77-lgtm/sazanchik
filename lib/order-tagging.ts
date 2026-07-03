import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { dishes, categories } from "@/db/schema";
import { stationForCategory, type StationKey } from "@/lib/stations";

/** Map each dish slug to its prep station (bar/hookah/cold/meat/kitchen) by
 *  category. Used by both the public order API and the waiter's manual order,
 *  so routing to stations is identical everywhere. */
export async function tagLineStations(
  slugs: string[]
): Promise<Map<string, StationKey>> {
  const map = new Map<string, StationKey>();
  const ids = [...new Set(slugs)];
  if (ids.length === 0) return map;

  const rows = await db
    .select({ slug: dishes.slug, cat: categories.slug })
    .from(dishes)
    .innerJoin(categories, eq(dishes.categoryId, categories.id))
    .where(inArray(dishes.slug, ids));

  for (const r of rows) map.set(r.slug, stationForCategory(r.cat));
  return map;
}
