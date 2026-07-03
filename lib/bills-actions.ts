"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { tableSessions, orders } from "@/db/schema";
import { getSession } from "@/lib/session";
import { notifyWaiters } from "@/lib/realtime";

async function requireStaff() {
  const session = await getSession();
  if (!session || (session.role !== "waiter" && session.role !== "manager")) {
    throw new Error("Unauthorized");
  }
  return session;
}

/** Close a table's bill — the guest has paid and left. A later order for the
 *  same table opens a fresh session. Guarded against double-close. */
export async function closeBill(sessionId: string) {
  const session = await requireStaff();

  // A dish still cooking/pending would be orphaned from any bill the moment
  // its session closes (the next order for the table opens a fresh one) —
  // refuse rather than silently losing revenue on an uncharged order.
  const [active] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.sessionId, sessionId),
        inArray(orders.status, ["pending", "cooking"])
      )
    )
    .limit(1);
  if (active) {
    throw new Error(
      "У стола есть незавершённый заказ (готовится) — сначала дождитесь его выдачи"
    );
  }

  await db
    .update(tableSessions)
    .set({
      status: "closed",
      closedAt: sql`now()`,
      closedBy: session.name ?? null,
    })
    .where(
      and(eq(tableSessions.id, sessionId), eq(tableSessions.status, "open"))
    );
  await notifyWaiters();
  revalidatePath("/waiter/bills");
  revalidatePath("/waiter");
}
