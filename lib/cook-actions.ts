"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { dishes } from "@/db/schema";
import { getSession } from "@/lib/session";

async function requireCook() {
  const session = await getSession();
  if (!session || (session.role !== "cook" && session.role !== "manager")) {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Cook toggles a dish's availability (stop-list / 86). `inStock=false`
 *  hides it from ordering on the client menu until turned back on. */
export async function setDishStock(dishId: string, inStock: boolean) {
  await requireCook();
  await db
    .update(dishes)
    .set({ inStock, updatedAt: sql`now()` })
    .where(eq(dishes.id, dishId));
  // The public menu is cached (ISR) — refresh it and the panels immediately.
  revalidatePath("/");
  revalidatePath("/kitchen");
  revalidatePath("/admin");
}
