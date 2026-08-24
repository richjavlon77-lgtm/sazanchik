"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

async function requireManager() {
  const session = await getSession();
  if (!session || session.role !== "manager") throw new Error("Unauthorized");
}

/** Опубликовать/скрыть отзыв на сайте */
export async function setReviewPublished(id: string, isPublished: boolean) {
  await requireManager();
  await db.update(reviews).set({ isPublished }).where(eq(reviews.id, id));
  revalidatePath("/");
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: string) {
  await requireManager();
  const [gone] = await db
    .delete(reviews)
    .where(eq(reviews.id, id))
    .returning({ rating: reviews.rating, comment: reviews.comment });
  if (gone) {
    await logAudit("review.delete", id, { rating: gone.rating, comment: gone.comment });
  }
  revalidatePath("/");
  revalidatePath("/admin/reviews");
}
