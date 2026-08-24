import { desc } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { ReviewsManager } from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const rows = await db
    .select()
    .from(reviews)
    .orderBy(desc(reviews.createdAt))
    .limit(200);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Отзывы гостей</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Новые отзывы скрыты — на сайт попадают только опубликованные вами.
        </p>
      </div>
      <ReviewsManager
        rows={rows.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          guestName: r.guestName,
          tableNumber: r.tableNumber,
          dishName: r.dishName,
          isPublished: r.isPublished,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
