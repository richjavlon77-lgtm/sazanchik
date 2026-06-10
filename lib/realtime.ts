import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Notify the waiter board that orders/calls changed. The SSE stream LISTENs on
 * this channel and pushes an event to connected waiter devices instantly.
 * Best-effort: a failure here must never break the order/call itself.
 */
export async function notifyWaiters(): Promise<void> {
  try {
    await db.execute(sql`select pg_notify('waiter_events', 'x')`);
  } catch (e) {
    console.error("notifyWaiters failed:", e);
  }
}
