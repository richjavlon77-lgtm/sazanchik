import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { createOrderSchema } from "@/lib/validators";
import { sendOrderToTelegram } from "@/lib/telegram";
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

  const { tableNumber, lines, subtotal, service, total } = parsed.data;

  try {
    const [order] = await db
      .insert(orders)
      .values({
        tableNumber,
        status: "pending",
        totalPrice: total,
        serviceCharge: service,
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

    sendOrderToTelegram(
      order.id,
      tableNumber,
      lines.map((l) => ({
        name: l.name.ru,
        variantLabel: l.variantLabel?.ru,
        qty: l.qty,
        price: l.price,
      })),
      subtotal,
      service,
      total
    ).catch((err) => console.error("Telegram notification failed:", err));

    return NextResponse.json({ id: order.id, status: "pending" }, { status: 201 });
  } catch (e) {
    console.error("Order creation failed:", e);
    return NextResponse.json(
      { error: "Не удалось создать заказ. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
