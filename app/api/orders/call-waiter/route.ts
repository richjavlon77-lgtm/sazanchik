import { NextResponse } from "next/server";
import { db } from "@/db";
import { waiterCalls } from "@/db/schema";
import { callWaiterSchema } from "@/lib/validators";
import { sendWaiterCallToTelegram } from "@/lib/telegram";

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

  const { tableNumber, type } = parsed.data;

  try {
    // Persist the call so the waiter board never loses it (survives offline)
    const [row] = await db
      .insert(waiterCalls)
      .values({ tableNumber, type, status: "new" })
      .returning({ id: waiterCalls.id });

    // Fire-and-forget Telegram notification (don't block the guest)
    sendWaiterCallToTelegram(tableNumber, type).catch((err) =>
      console.error("Telegram waiter call failed:", err)
    );

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (e) {
    console.error("Waiter call failed:", e);
    return NextResponse.json(
      { error: "Не удалось отправить вызов. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
