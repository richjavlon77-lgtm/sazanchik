"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, waiterCalls } from "@/db/schema";
import { getSession } from "@/lib/session";
import { notifyWaiters } from "@/lib/realtime";
import { tagLineStations } from "@/lib/order-tagging";
import { priceOrder } from "@/lib/order-pricing";
import { getOrCreateTableSession } from "@/lib/table-session";
import { deductForOrder, restockForOrder } from "@/lib/stock-deduct";
import { sendOrderToTelegram } from "@/lib/telegram";
import { logAudit } from "@/lib/audit";

async function requireStaff() {
  const session = await getSession();
  if (!session || (session.role !== "waiter" && session.role !== "manager")) {
    throw new Error("Unauthorized");
  }
  return session;
}

type OrderStatus = "pending" | "cooking" | "delivered" | "cancelled";

/**
 * Advance an order's status. Authorized for waiters and managers only —
 * the client contour can never call this (no valid session).
 */
export async function advanceOrder(id: string, status: OrderStatus) {
  const session = await requireStaff();

  if (status === "cancelled") {
    // Atomic check-and-set: only the request that actually flips the status
    // gets to restock, so a double-cancel (double-tap, two devices) can't
    // credit ingredients twice.
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: sql`now()` })
      .where(and(eq(orders.id, id), ne(orders.status, "cancelled")))
      .returning({
        snap: orders.itemsSnapshot,
        tableNumber: orders.tableNumber,
        totalPrice: orders.totalPrice,
      });
    if (updated) {
      await logAudit("order.cancel", id, {
        table: updated.tableNumber,
        total: updated.totalPrice,
        items: (updated.snap ?? []).length,
      });
      const restock = (updated.snap ?? [])
        .filter((it) => it.slug)
        .map((it) => ({
          id: it.slug as string,
          qty: it.quantity,
          // цена из снапшота → тот же фактор варианта, что был при списании
          price: it.price,
        }));
      await restockForOrder(restock);
    }
  } else {
    await db
      .update(orders)
      .set({
        status,
        updatedAt: sql`now()`,
        // credit the waiter who actually served it
        ...(status === "delivered" ? { servedBy: session.name ?? null } : {}),
      })
      .where(eq(orders.id, id));
  }

  await notifyWaiters();
  revalidatePath("/waiter");
  revalidatePath("/bar");
  revalidatePath("/hookah");
  revalidatePath("/kitchen");
  revalidatePath("/admin");
}

export type ManualLine = {
  id: string; // dish slug
  variantKey?: string;
  nameRu: string;
  nameUz: string;
  nameEn: string;
  variantLabelRu?: string;
  variantLabelUz?: string;
  variantLabelEn?: string;
  price: number;
  qty: number;
};

/**
 * Offline order: a waiter takes a verbal order and submits it himself.
 * Goes through the exact same pipeline as a client order, so lines route
 * to the bartender (drinks), hookah master, and the kitchen (food) on their
 * own boards. The waiter is credited as the one who took it.
 */
export async function createManualOrder(input: {
  tableNumber: string;
  isBirthday?: boolean;
  lines: ManualLine[];
}) {
  const session = await requireStaff();

  const table = (input.tableNumber ?? "").trim();
  if (!table) throw new Error("Укажите стол");
  const lines = (input.lines ?? []).filter((l) => l.qty > 0);
  if (lines.length === 0) throw new Error("Добавьте хотя бы одну позицию");

  // Same server-authoritative pricing as a guest order: validates prices
  // against the DB and applies the 20% service charge + birthday −10%.
  const priced = await priceOrder(
    lines.map((l) => ({ id: l.id, qty: l.qty, price: l.price })),
    input.isBirthday ?? false
  );
  if (!priced.ok) throw new Error(priced.error);
  const { subtotal, service, total } = priced;

  const stationMap = await tagLineStations(lines.map((l) => l.id));
  const sessionId = await getOrCreateTableSession(table);

  // Заказ и позиции — атомарно (как в /api/orders/create): упавший второй
  // insert не должен оставить заказ без строк в order_items.
  const order = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        tableNumber: table,
        status: "pending",
        totalPrice: total,
        serviceCharge: service,
        isBirthday: input.isBirthday ?? false,
        servedBy: session.name ?? null,
        sessionId,
        itemsSnapshot: lines.map((l) => {
          const st = stationMap.get(l.id) ?? "kitchen";
          return {
            slug: l.id,
            nameRu: l.nameRu,
            nameUz: l.nameUz,
            nameEn: l.nameEn,
            variantLabelRu: l.variantLabelRu,
            variantLabelUz: l.variantLabelUz,
            variantLabelEn: l.variantLabelEn,
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
        dishNameRu: l.nameRu,
        dishNameUz: l.nameUz,
        dishNameEn: l.nameEn,
        variantLabelRu: l.variantLabelRu ?? null,
        variantLabelUz: l.variantLabelUz ?? null,
        variantLabelEn: l.variantLabelEn ?? null,
        quantity: l.qty,
        price: l.price,
      }))
    );

    return created;
  });

  await deductForOrder(
    lines.map((l) => ({ id: l.id, qty: l.qty, price: l.price }))
  );
  await notifyWaiters();

  try {
    await sendOrderToTelegram(
      order.id,
      table,
      lines.map((l) => ({
        name: l.nameRu,
        variantLabel: l.variantLabelRu,
        qty: l.qty,
        price: l.price,
      })),
      subtotal,
      service,
      total,
      input.isBirthday ?? false
    );
  } catch (err) {
    console.error("Telegram (manual order) failed:", err);
  }

  revalidatePath("/waiter");
  revalidatePath("/bar");
  revalidatePath("/hookah");
  revalidatePath("/kitchen");
  return { id: order.id };
}

/**
 * Per-dish delivery checklist. A waiter taps a line as he carries it to the
 * table; the flag lives in the order's items snapshot so every staff device
 * (a second waiter, a runner) sees the same ticks live via SSE. Purely a
 * working aid — it does not change the order's status.
 */
export async function toggleItemDelivered(
  orderId: string,
  index: number,
  delivered: boolean
) {
  await requireStaff();

  // Row-locked read + write: a station board's "ready" tick and this
  // "delivered" tick both read-modify-write the same JSONB snapshot, so
  // without a lock one can silently clobber the other's flag.
  await db.transaction(async (tx) => {
    const [cur] = await tx
      .select({ snap: orders.itemsSnapshot })
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");
    if (!cur?.snap) throw new Error("Заказ не найден");
    if (index < 0 || index >= cur.snap.length) {
      throw new Error("Позиция не найдена");
    }

    const next = cur.snap.map((it, i) =>
      i === index ? { ...it, delivered } : it
    );
    await tx
      .update(orders)
      .set({ itemsSnapshot: next, updatedAt: sql`now()` })
      .where(eq(orders.id, orderId));
  });

  await notifyWaiters();
  revalidatePath("/waiter");
}

/** Mark a waiter call as handled. */
export async function resolveCall(id: string) {
  const session = await requireStaff();
  await db
    .update(waiterCalls)
    .set({
      status: "done",
      resolvedAt: sql`now()`,
      resolvedBy: session.name ?? null,
    })
    .where(eq(waiterCalls.id, id));
  await notifyWaiters();
  revalidatePath("/waiter");
}
