import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { createOrderSchema } from "@/lib/validators";
import { sendOrderToTelegram } from "@/lib/telegram";
import { verifyTableToken } from "@/lib/table-sign";
import { notifyWaiters } from "@/lib/realtime";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { tableNumber, tableToken, isBirthday, lines, subtotal, service, total } =
    parsed.data;

  // If a signed table token is present (from a QR), it is authoritative and
  // cannot be forged. A present-but-invalid token means tampering → reject.
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
    const [order] = await db
      .insert(orders)
      .values({
        tableNumber: table,
        status: "pending",
        totalPrice: total,
        serviceCharge: service,
        isBirthday: isBirthday ?? false,
        itemsSnapshot: lines.map((l) => ({
          nameRu: l.name.ru,
          nameUz: l.name.uz,
          nameEn: l.name.en,
          variantLabelRu: l.variantLabel?.ru,
          variantLabelUz: l.variantLabel?.uz,
          variantLabelEn: l.variantLabel?.en,
          quantity: l.qty,
          price: l.price,
        })),
      })
      .returning({ id: orders.id });

    if (lines.length > 0) {
      await db.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          dishNameRu: l.name.ru,
          dishNameUz: l.name.uz,
          dishNameEn: l.name.en,
          variantLabelRu: l.variantLabel?.ru ?? null,
          variantLabelUz: l.variantLabel?.uz ?? null,
          variantLabelEn: l.variantLabel?.en ?? null,
          quantity: l.qty,
          price: l.price,
        }))
      );
    }

    await db
      .update(orders)
      .set({ updatedAt: sql`now()` })
      .where(eq(orders.id, order.id));

    // Push to the waiter board in real time
    await notifyWaiters();

    // Await so the serverless function isn't frozen before Telegram is sent.
    // Wrapped: a Telegram failure must NOT fail the order.
    try {
      await sendOrderToTelegram(
        order.id,
        table,
        lines.map((l) => ({
          name: l.name.ru,
          variantLabel: l.variantLabel?.ru,
          qty: l.qty,
          price: l.price,
        })),
        subtotal,
        service,
        total,
        isBirthday ?? false
      );
    } catch (err) {
      console.error("Telegram notification failed:", err);
    }

    return NextResponse.json({ id: order.id, status: "pending" }, { status: 201 });
  } catch (e) {
    console.error("Order creation failed:", e);
    return NextResponse.json(
      { error: "Не удалось создать заказ. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
