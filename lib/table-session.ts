import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tableSessions } from "@/db/schema";

/**
 * Return the open bill (session) for a table, creating one if needed.
 * Race-safe: a partial unique index allows only one open session per table,
 * so a concurrent insert conflict falls back to the existing one.
 */
export async function getOrCreateTableSession(
  tableNumber: string
): Promise<string | null> {
  try {
    const [open] = await db
      .select({ id: tableSessions.id })
      .from(tableSessions)
      .where(
        and(
          eq(tableSessions.tableNumber, tableNumber),
          eq(tableSessions.status, "open")
        )
      );
    if (open) return open.id;

    const [created] = await db
      .insert(tableSessions)
      .values({ tableNumber })
      .returning({ id: tableSessions.id });
    return created.id;
  } catch (e) {
    // lost the race for the unique open session → use the existing one
    if ((e as { code?: string })?.code === "23505") {
      const [open] = await db
        .select({ id: tableSessions.id })
        .from(tableSessions)
        .where(
          and(
            eq(tableSessions.tableNumber, tableNumber),
            eq(tableSessions.status, "open")
          )
        );
      if (open) return open.id;
    }
    console.error("getOrCreateTableSession failed (non-fatal):", e);
    return null; // never block the order over session bookkeeping
  }
}
