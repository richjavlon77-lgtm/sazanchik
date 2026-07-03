import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dishes, categories } from "@/db/schema";
import { getSession } from "@/lib/session";
import { KitchenBoard, type KitchenDish } from "@/components/kitchen/KitchenBoard";

export const dynamic = "force-dynamic";

export default async function KitchenStopPage() {
  const session = await getSession();
  if (!session || (session.role !== "cook" && session.role !== "manager")) {
    redirect("/kitchen/login");
  }

  const rows = await db
    .select({
      id: dishes.id,
      name: dishes.nameRu,
      inStock: dishes.inStock,
      category: categories.nameRu,
    })
    .from(dishes)
    .innerJoin(categories, eq(dishes.categoryId, categories.id))
    .where(eq(dishes.isPublished, true))
    .orderBy(asc(categories.sortOrder), asc(dishes.sortOrder), asc(dishes.nameRu));

  const list: KitchenDish[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    inStock: r.inStock,
  }));

  return <KitchenBoard dishes={list} cookName={session.name ?? "повар"} />;
}
