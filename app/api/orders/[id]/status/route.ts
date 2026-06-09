import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

// Public: a guest polls the status of their own order by its (unguessable) id.
// Returns only the status — no personal or financial data.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Basic UUID shape guard
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [row] = await db
    .select({ status: orders.status, createdAt: orders.createdAt })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { status: row.status, createdAt: row.createdAt.toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
