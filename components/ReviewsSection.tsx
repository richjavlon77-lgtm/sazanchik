import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { ReviewForm } from "@/components/ReviewForm";

/**
 * Отзывы гостей на главной: средний рейтинг + последние опубликованные
 * (модерация в админке) + форма «Оцените нас». БД недоступна → только форма.
 */
export async function ReviewsSection() {
  let published: { id: string; rating: number; comment: string; guestName: string | null }[] = [];
  let avg = 0;
  let total = 0;
  try {
    published = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        guestName: reviews.guestName,
      })
      .from(reviews)
      .where(and(eq(reviews.isPublished, true), sql`${reviews.comment} <> ''`))
      .orderBy(desc(reviews.createdAt))
      .limit(6);
    const [stat] = await db
      .select({
        avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        n: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.isPublished, true));
    avg = Number(stat?.avg ?? 0);
    total = stat?.n ?? 0;
  } catch {
    /* отзывы — не критичный контент */
  }

  return (
    <section id="reviews" className="mx-auto w-full max-w-3xl scroll-mt-16 px-4 py-14 md:py-20">
      {total > 0 && (
        <div className="mb-8 text-center">
          <div className="font-heading text-5xl text-gold">
            {avg.toFixed(1).replace(".", ",")}
          </div>
          <div className="mt-1 text-lg tracking-widest text-gold" aria-label={`${avg.toFixed(1)} из 5`}>
            {"★".repeat(Math.round(avg))}
            <span className="text-muted-foreground/30">{"★".repeat(5 - Math.round(avg))}</span>
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {total} отзыв{total % 10 === 1 && total % 100 !== 11 ? "" : total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 10 || total % 100 >= 20) ? "а" : "ов"}
          </div>
        </div>
      )}

      {published.length > 0 && (
        <div className="mb-8 grid gap-3 md:grid-cols-2">
          {published.map((r) => (
            <figure
              key={r.id}
              className="rounded-2xl border border-border bg-card/30 px-5 py-4"
            >
              <div className="text-sm tracking-widest text-gold">
                {"★".repeat(r.rating)}
                <span className="text-muted-foreground/25">{"★".repeat(5 - r.rating)}</span>
              </div>
              <blockquote className="mt-2 text-sm leading-relaxed text-foreground/90">
                «{r.comment}»
              </blockquote>
              {r.guestName && (
                <figcaption className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  — {r.guestName}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <ReviewForm />
    </section>
  );
}
