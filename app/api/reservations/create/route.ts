import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { createReservationSchema } from "@/lib/validators";
import { sendReservationToTelegram } from "@/lib/telegram";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { parseTashkentLocal } from "@/lib/tz";

const TOO_FAST = "Слишком много заявок. Попробуйте позже.";

export async function POST(request: Request) {
  // Reservations come from anywhere (not shared venue Wi-Fi), so a per-IP limit
  // is meaningful here.
  const ip = clientIp(request);
  if (!checkRateLimit(`reserve-ip:${ip}`, { limit: 5, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: TOO_FAST }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createReservationSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { name, phone, guests, reservedAt, tableNumber, comment, isBirthday } =
    parsed.data;

  // Per-phone guard: bounds how many bookings one number can spam.
  if (
    !checkRateLimit(`reserve-phone:${phone}`, { limit: 3, windowMs: 600_000 })
      .allowed
  ) {
    return NextResponse.json({ error: TOO_FAST }, { status: 429 });
  }

  try {
    const reservedDate = parseTashkentLocal(reservedAt);

    const [row] = await db
      .insert(reservations)
      .values({
        name,
        phone,
        guests,
        reservedAt: reservedDate,
        tableNumber: tableNumber || null,
        comment: comment || null,
        isBirthday,
        status: "new",
      })
      .returning({ id: reservations.id });

    // Await so the serverless function isn't frozen before Telegram is sent.
    try {
      await sendReservationToTelegram({
        id: row.id,
        name,
        phone,
        guests,
        reservedAt: reservedDate,
        tableNumber: tableNumber || null,
        comment: comment || null,
        isBirthday,
      });
    } catch (err) {
      console.error("Telegram reservation notification failed:", err);
    }

    return NextResponse.json({ id: row.id, status: "new" }, { status: 201 });
  } catch (e) {
    console.error("Reservation creation failed:", e);
    return NextResponse.json(
      { error: "Не удалось создать бронь. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
