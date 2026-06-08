import { NextResponse } from "next/server";
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
    const first = parsed.error.errors[0];
    return NextResponse.json(
      { error: first?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { tableNumber, type } = parsed.data;

  try {
    const result = await sendWaiterCallToTelegram(tableNumber, type);

    if (!result.ok) {
      // Telegram not configured — still accept the call, just log it
      console.warn(
        "Waiter call accepted but Telegram not configured or failed."
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Waiter call failed:", e);
    return NextResponse.json(
      { error: "Не удалось отправить вызов. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
