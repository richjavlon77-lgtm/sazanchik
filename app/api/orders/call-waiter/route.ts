import { NextResponse } from "next/server";
import { db } from "@/db";
import { waiterCalls } from "@/db/schema";
import { callWaiterSchema } from "@/lib/validators";
import { sendWaiterCallToTelegram } from "@/lib/telegram";
import { verifyTableToken } from "@/lib/table-sign";
import { notifyWaiters } from "@/lib/realtime";

export async function POST(request: Request) {
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

  // Signed QR token is authoritative; a present-but-invalid token = tampering.
  let table = tableNumber;
  if (tableToken) {
    const verified = verifyTableToken(tableToken);
    if (!verified) {
      return NextResponse.json(
        { error: "Недействительный QR-код стола" },
        { status: 403 }
      );
    }
    table = verified;
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
