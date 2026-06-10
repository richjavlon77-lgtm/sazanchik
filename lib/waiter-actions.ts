"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, waiterCalls } from "@/db/schema";
import { getSession } from "@/lib/session";
import { notifyWaiters } from "@/lib/realtime";

async function requireStaff() {
  const session = await getSession();
  if (!session || (session.role !== "waiter" && session.role !== "manager")) {
    throw new Error("Unauthorized");
  }
  return session;
}

type OrderStatus = "pending" | "cooking" | "delivered" | "cancelled";

/**
 * Advance an order's status. Authorized for waiters and managers only —
 * the client contour can never call this (no valid session).
 */
export async function advanceOrder(id: string, status: OrderStatus) {
  await requireStaff();
  await db
    .update(orders)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(orders.id, id));
  await notifyWaiters();
  revalidatePath("/waiter");
  revalidatePath("/admin");
}

/** Mark a waiter call as handled. */
export async function resolveCall(id: string) {
  await requireStaff();
  await db
    .update(waiterCalls)
    .set({ status: "done", resolvedAt: sql`now()` })
    .where(eq(waiterCalls.id, id));
  await notifyWaiters();
  revalidatePath("/waiter");
}
