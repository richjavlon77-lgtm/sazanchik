import { NextResponse } from "next/server";
import { db } from "@/db";
import { waiterCalls } from "@/db/schema";
import { callWaiterSchema } from "@/lib/validators";
import { sendWaiterCallToTelegram } from "@/lib/telegram";
import { resolveTable } from "@/lib/table-sign";
import { notifyWaiters } from "@/lib/realtime";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

const TOO_FAST = "Слишком часто. Подождите немного.";

export async function POST(request: Request) {
  // Coarse per-IP backstop (venue Wi-Fi shares an IP, so keep it generous).
  const ip = clientIp(request);
  if (!checkRateLimit(`call-ip:${ip}`, { limit: 30, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: TOO_FAST }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = callWaiterSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { tableNumber, tableToken, type } = parsed.data;

  // Signed QR token is authoritative; strict-QR mode rejects tokenless calls.
  const resolved = resolveTable(tableNumber, tableToken);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const table = resolved.table;

  // Per-table anti-spam: nobody legitimately calls a waiter many times a minute.
  if (!checkRateLimit(`call-table:${table}`, { limit: 5, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: TOO_FAST }, { status: 429 });
  }

  try {
    // Persist the call so the waiter board never loses it (survives offline)
    const [row] = await db
      .insert(waiterCalls)
      .values({ tableNumber: table, type, status: "new" })
      .returning({ id: waiterCalls.id });

    await notifyWaiters();

    // Await so the serverless function isn't frozen before Telegram is sent.
    try {
      await sendWaiterCallToTelegram(table, type);
    } catch (err) {
      console.error("Telegram waiter call failed:", err);
    }

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (e) {
    console.error("Waiter call failed:", e);
    return NextResponse.json(
      { error: "Не удалось отправить вызов. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
