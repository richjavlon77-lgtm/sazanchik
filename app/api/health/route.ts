import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** Лёгкая проверка живости для внешнего мониторинга: приложение + БД. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json(
      { ok: true, ts: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
