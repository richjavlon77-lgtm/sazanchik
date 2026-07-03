"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { recipeItems } from "@/db/schema";
import { getSession } from "@/lib/session";

async function requireManager() {
  const session = await getSession();
  if (!session || session.role !== "manager") throw new Error("Unauthorized");
}

/** Set how much of an ingredient a dish uses. qty<=0 removes the line. */
export async function setRecipeQty(
  dishId: string,
  ingredientId: string,
  qty: number
) {
  await requireManager();
  const q = Number(qty);
  if (!Number.isFinite(q) || q <= 0) {
    await db
      .delete(recipeItems)
      .where(
        and(
          eq(recipeItems.dishId, dishId),
          eq(recipeItems.ingredientId, ingredientId)
        )
      );
  } else {
    await db
      .insert(recipeItems)
      .values({ dishId, ingredientId, qty: q })
      .onConflictDoUpdate({
        target: [recipeItems.dishId, recipeItems.ingredientId],
        set: { qty: q },
      });
  }
  revalidatePath("/admin/recipes");
}

export async function removeRecipeItem(dishId: string, ingredientId: string) {
  await requireManager();
  await db
    .delete(recipeItems)
    .where(
      and(
        eq(recipeItems.dishId, dishId),
        eq(recipeItems.ingredientId, ingredientId)
      )
    );
  revalidatePath("/admin/recipes");
}
