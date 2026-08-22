import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { createOrderSchema } from "@/lib/validators";
import { sendOrderToTelegram } from "@/lib/telegram";
import { resolveTable } from "@/lib/table-sign";
import { notifyWaiters } from "@/lib/realtime";
import { tagLineStations } from "@/lib/order-tagging";
import { priceOrder } from "@/lib/order-pricing";
import { getOrCreateTableSession } from "@/lib/table-session";
import { deductForOrder } from "@/lib/stock-deduct";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { eq } from "drizzle-orm";

const TOO_FAST = "Слишком много заказов подряд. Подождите немного.";

export async function POST(request: Request) {
  // Coarse DoS backstop per IP. Generous, because a whole venue can share one
  // NAT IP (restaurant Wi-Fi) — the per-table limit below is the real guard.
  const ip = clientIp(request);
  if (!checkRateLimit(`order-ip:${ip}`, { limit: 40, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: TOO_FAST }, { status: 429 });
  }

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

  const { tableNumber, tableToken, isBirthday, lines, idempotencyKey } =
    parsed.data;

  // De-dupe: a repeated submit (double-tap / network retry) with the same key
  // returns the original order instead of creating a duplicate.
  if (idempotencyKey) {
    const [existing] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.idempotencyKey, idempotencyKey));
    if (existing) {
      return NextResponse.json(
        { id: existing.id, status: existing.status },
        { status: 200 }
      );
    }
  }

  // Resolve the authoritative table: a signed QR token (if present) wins and
  // can't be forged; strict-QR mode (REQUIRE_TABLE_TOKEN) rejects tokenless orders.
  const resolved = resolveTable(tableNumber, tableToken);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const table = resolved.table;

  // Per-table anti-spam: bounds how fast any single table can fire orders,
  // even via a forged/absent token. A real table rarely orders >10x/min.
  if (!checkRateLimit(`order-table:${table}`, { limit: 10, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: TOO_FAST }, { status: 429 });
  }

  // Server-authoritative pricing — client prices are never trusted.
  const priced = await priceOrder(
    lines.map((l) => ({ id: l.id, qty: l.qty, price: l.price })),
    isBirthday ?? false
  );
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: 422 });
  }
  const { subtotal, service, total } = priced;

  // Tag each line with its prep station (bar/hookah/cold/meat/kitchen).
  let stationMap = new Map<string, string>();
  try {
    stationMap = await tagLineStations(lines.map((l) => l.id));
  } catch (err) {
    console.error("Station tagging failed (non-fatal):", err);
  }
  const lineStation = (id: string) => stationMap.get(id) ?? "kitchen";

  // Attach the order to the table's open bill (creates one if needed).
  const sessionId = await getOrCreateTableSession(table);

  try {
    // Заказ и его позиции пишутся атомарно: упавший второй insert не должен
    // оставить заказ без строк в order_items (отчёты бы разошлись со snapshot).
    const order = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({
          tableNumber: table,
          status: "pending",
          totalPrice: total,
          serviceCharge: service,
          isBirthday: isBirthday ?? false,
          idempotencyKey: idempotencyKey ?? null,
          sessionId,
          itemsSnapshot: lines.map((l) => {
            const st = lineStation(l.id) as
              | "bar"
              | "hookah"
              | "cold"
              | "meat"
              | "kitchen";
            return {
              slug: l.id,
              nameRu: l.name.ru,
              nameUz: l.name.uz,
              nameEn: l.name.en,
              variantLabelRu: l.variantLabel?.ru,
              variantLabelUz: l.variantLabel?.uz,
              variantLabelEn: l.variantLabel?.en,
              quantity: l.qty,
              price: l.price,
              station: st,
              isDrink: st === "bar",
              isHookah: st === "hookah",
            };
          }),
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: created.id,
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

      return created;
    });

    // Deduct recipe ingredients from stock (best-effort, never blocks the order)
    await deductForOrder(lines.map((l) => ({ id: l.id, qty: l.qty })));

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
    // Race: two simultaneous submits with the same key — return the winner.
    if (idempotencyKey && (e as { code?: string })?.code === "23505") {
      const [existing] = await db
        .select({ id: orders.id, status: orders.status })
        .from(orders)
        .where(eq(orders.idempotencyKey, idempotencyKey));
      if (existing) {
        return NextResponse.json(
          { id: existing.id, status: existing.status },
          { status: 200 }
        );
      }
    }
    console.error("Order creation failed:", e);
    return NextResponse.json(
      { error: "Не удалось создать заказ. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
