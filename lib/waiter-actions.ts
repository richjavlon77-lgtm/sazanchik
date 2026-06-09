"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/session";

type OrderStatus = "pending" | "cooking" | "delivered" | "cancelled";

/**
 * Advance an order's status. Authorized for waiters and managers only —
 * the client contour can never call this (no valid session).
 */
export async function advanceOrder(id: string, status: OrderStatus) {
  const session = await getSession();
  if (!session || (session.role !== "waiter" && session.role !== "manager")) {
    throw new Error("Unauthorized");
  }
  await db
    .update(orders)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(orders.id, id));
  revalidatePath("/waiter");
  revalidatePath("/admin");
}
