import Link from "next/link";
import { db } from "@/db";
import { categories, dishes } from "@/db/schema";
import { asc } from "drizzle-orm";
import { formatPrice } from "@/lib/i18n-core";
import { DishSortList } from "@/components/admin/DishSortList";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-heading text-3xl tabular-nums text-gold">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

export default async function AdminMenuPage() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  const allDishes = await db
    .select()
    .from(dishes)
    .orderBy(asc(dishes.categoryId), asc(dishes.sortOrder));

  // Stats
  const totalDishes = allDishes.length;
  const published = allDishes.filter((d) => d.isPublished).length;
  const hidden = totalDishes - published;
  const priced = allDishes.filter((d) => d.price !== null) as {
    price: number;
  }[];
  const avgPrice =
    priced.length > 0
      ? Math.round(priced.reduce((s, d) => s + d.price, 0) / priced.length)
      : 0;

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
            Перетаскивай блюда за <span className="text-gold">⠿</span> для
            сортировки
          </p>
        </div>
        <Link
          href="/admin/dishes/new"
          className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          + Новое блюдо
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Категорий" value={String(cats.length)} />
        <StatCard
          label="Блюд"
          value={String(totalDishes)}
          hint={`${published} опубл. · ${hidden} скрыто`}
        />
        <StatCard label="Средний чек" value={formatPrice(avgPrice, "ru")} />
        <StatCard
          label="Опубликовано"
          value={`${totalDishes ? Math.round((published / totalDishes) * 100) : 0}%`}
          hint={`${hidden} скрытых`}
        />
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
                    href={`/admin/dishes/new?category=${c.slug}`}
                    className="text-gold hover:underline"
                  >
                    Добавить первое
                  </Link>
                </div>
              ) : (
                <DishSortList
                  dishes={items.map((d) => ({
                    id: d.id,
                    slug: d.slug,
                    nameRu: d.nameRu,
                    descriptionRu: d.descriptionRu,
                    price: d.price,
                    isPublished: d.isPublished,
                    spicy: d.spicy,
                  }))}
                />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
