import Link from "next/link";
import { db } from "@/db";
import { categories, dishes } from "@/db/schema";
import { asc, eq, count } from "drizzle-orm";
import { formatPrice } from "@/lib/i18n-core";
import { DishActions } from "@/components/admin/DishActions";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  const allDishes = await db
    .select()
    .from(dishes)
    .orderBy(asc(dishes.categoryId), asc(dishes.sortOrder));

  const [{ count: totalDishes }] = await db
    .select({ count: count() })
    .from(dishes);

  const dishesByCat = new Map<string, typeof allDishes>();
  for (const d of allDishes) {
    const list = dishesByCat.get(d.categoryId) ?? [];
    list.push(d);
    dishesByCat.set(d.categoryId, list);
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl">Меню</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cats.length} категорий · {totalDishes} блюд
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/dishes/new"
            className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + Новое блюдо
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {cats.map((c) => {
          const items = dishesByCat.get(c.id) ?? [];
          return (
            <section
              key={c.id}
              className="overflow-hidden rounded-xl border border-border bg-card/40"
            >
              <header className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <h2 className="font-heading text-lg">{c.nameRu}</h2>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {items.length} блюд · {c.isPublished ? "published" : "hidden"}
                  </p>
                </div>
                <Link
                  href={`/admin/categories/${c.id}/edit`}
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
                >
                  Править
                </Link>
              </header>

              {items.length === 0 ? (
                <div className="px-5 py-6 text-sm text-muted-foreground">
                  Нет блюд.{" "}
                  <Link
                    href={`/admin/dishes/new?category=${c.id}`}
                    className="text-gold hover:underline"
                  >
                    Добавить первое
                  </Link>
                </div>
              ) : (
                <ul>
                  {items.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-4 border-b border-border/50 px-5 py-3 last:border-b-0 hover:bg-card/60"
                    >
                      <Link
                        href={`/admin/dishes/${d.id}/edit`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="truncate font-heading text-base">
                            {d.nameRu}
                          </span>
                          {!d.isPublished && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                              hidden
                            </span>
                          )}
                          {d.spicy && (
                            <span className="text-[9px] uppercase text-red-400">
                              {"🌶".repeat(d.spicy)}
                            </span>
                          )}
                        </div>
                        {d.descriptionRu && (
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {d.descriptionRu}
                          </div>
                        )}
                      </Link>

                      <span className="shrink-0 font-heading tabular-nums text-gold">
                        {d.price !== null
                          ? formatPrice(d.price, "ru")
                          : "—"}
                      </span>

                      <DishActions id={d.id} slug={d.slug} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
