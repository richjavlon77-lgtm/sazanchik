import Link from "next/link";
import { db } from "@/db";
import { categories, dishes } from "@/db/schema";
import { asc, count } from "drizzle-orm";
import { CategorySortList } from "@/components/admin/CategorySortList";

export const dynamic = "force-dynamic";

export default async function CategoriesIndex() {
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));

  // Count dishes per category
  const counts = await db
    .select({ id: dishes.categoryId, count: count() })
    .from(dishes)
    .groupBy(dishes.categoryId);
  const countMap = new Map(counts.map((c) => [c.id, c.count]));

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl">Категории</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cats.length} категорий · перетаскивай за{" "}
            <span className="text-gold">⠿</span> для сортировки
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Новая категория
        </Link>
      </div>

      <CategorySortList
        categories={cats.map((c) => ({
          id: c.id,
          slug: c.slug,
          nameRu: c.nameRu,
          isPublished: c.isPublished,
          dishCount: countMap.get(c.id) ?? 0,
        }))}
      />
    </div>
  );
}
