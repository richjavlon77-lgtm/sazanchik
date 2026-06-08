import Link from "next/link";
import { db } from "@/db";
import { categories, dishes } from "@/db/schema";
import { asc, eq, count } from "drizzle-orm";

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
          <p className="mt-1 text-sm text-muted-foreground">{cats.length} категорий</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Новая категория
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/40">
        {cats.map((c) => (
          <Link
            key={c.id}
            href={`/admin/categories/${c.id}/edit`}
            className="flex items-center gap-4 border-b border-border/50 px-5 py-3 last:border-b-0 hover:bg-card/60"
          >
            <span className="w-8 text-xs tabular-nums text-muted-foreground">
              {String(c.sortOrder).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-base">{c.nameRu}</div>
              <div className="text-xs text-muted-foreground">/{c.slug}</div>
            </div>
            <span className="text-xs text-muted-foreground">
              {countMap.get(c.id) ?? 0} блюд
            </span>
            {!c.isPublished && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                hidden
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
