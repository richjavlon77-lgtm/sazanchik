import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { createReservationSchema } from "@/lib/validators";
import { sendReservationToTelegram } from "@/lib/telegram";

export async function POST(request: Request) {
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

  try {
    const reservedDate = new Date(reservedAt);

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

    sendReservationToTelegram({
      id: row.id,
      name,
      phone,
      guests,
      reservedAt: reservedDate,
      tableNumber: tableNumber || null,
      comment: comment || null,
      isBirthday,
    }).catch((err) =>
      console.error("Telegram reservation notification failed:", err)
    );

    return NextResponse.json({ id: row.id, status: "new" }, { status: 201 });
  } catch (e) {
    console.error("Reservation creation failed:", e);
    return NextResponse.json(
      { error: "Не удалось создать бронь. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
