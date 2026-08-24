import { NextResponse } from "next/server";
import { isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";

export const revalidate = 60;

/** Средние оценки блюд для карточек меню: { slug: { avg, count } }.
 *  Оценки блюд публикуются сразу (это числа, модерировать нечего). */
export async function GET() {
  const rows = await db
    .select({
      slug: reviews.dishSlug,
      avg: sql<number>`round(avg(${reviews.rating})::numeric, 1)`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(isNotNull(reviews.dishSlug))
    .groupBy(reviews.dishSlug);

  const map: Record<string, { avg: number; count: number }> = {};
  for (const r of rows) {
    if (r.slug) map[r.slug] = { avg: Number(r.avg), count: r.count };
  }
  return NextResponse.json(map, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
