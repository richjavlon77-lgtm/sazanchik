"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ingredients, stockMovements } from "@/db/schema";
import { getSession } from "@/lib/session";
import { sendLowStockToTelegram } from "@/lib/telegram";
import { logAudit } from "@/lib/audit";

const UNITS = ["g", "kg", "ml", "l", "pcs"] as const;
type Unit = (typeof UNITS)[number];

async function requireManager() {
  const session = await getSession();
  if (!session || session.role !== "manager") throw new Error("Unauthorized");
}

function cleanUnit(u: string): Unit {
  return (UNITS as readonly string[]).includes(u) ? (u as Unit) : "pcs";
}

export async function addIngredient(input: {
  name: string;
  unit: string;
  stock?: number;
  minStock?: number;
  costPerUnit?: number;
}) {
  await requireManager();
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Укажите название");

  await db.insert(ingredients).values({
    name,
    unit: cleanUnit(input.unit),
    stock: Math.max(0, Number(input.stock) || 0),
    minStock: Math.max(0, Number(input.minStock) || 0),
    costPerUnit: Math.max(0, Math.round(Number(input.costPerUnit) || 0)),
  });
  revalidatePath("/admin/inventory");
}

export async function updateIngredient(
  id: string,
  input: {
    name: string;
    unit: string;
    minStock?: number;
    costPerUnit?: number;
  }
) {
  await requireManager();
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Укажите название");
  await db
    .update(ingredients)
    .set({
      name,
      unit: cleanUnit(input.unit),
      minStock: Math.max(0, Number(input.minStock) || 0),
      costPerUnit: Math.max(0, Math.round(Number(input.costPerUnit) || 0)),
      updatedAt: sql`now()`,
    })
    .where(eq(ingredients.id, id));
  revalidatePath("/admin/inventory");
}

export async function deleteIngredient(id: string) {
  await requireManager();
  await db.delete(ingredients).where(eq(ingredients.id, id));
  revalidatePath("/admin/inventory");
}

/** Receive (+приход) or write off (−уход) stock. `amount` is positive;
 *  `direction` decides the sign. Logs a movement + updates the balance. */
export async function adjustStock(input: {
  ingredientId: string;
  amount: number;
  direction: "receive" | "writeoff";
  note?: string;
}) {
  await requireManager();
  const amount = Math.abs(Number(input.amount) || 0);
  if (amount <= 0) throw new Error("Введите количество больше нуля");
  const delta = input.direction === "receive" ? amount : -amount;

  const [before] = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.id, input.ingredientId));

  await db.insert(stockMovements).values({
    ingredientId: input.ingredientId,
    delta,
    reason: input.direction,
    note: input.note?.trim() || null,
  });
  await db
    .update(ingredients)
    .set({ stock: sql`${ingredients.stock} + ${delta}`, updatedAt: sql`now()` })
    .where(eq(ingredients.id, input.ingredientId));

  // Telegram alert when a write-off drops the stock to/below its minimum.
  if (before && delta < 0 && before.minStock > 0) {
    const after = before.stock + delta;
    if (before.stock > before.minStock && after <= before.minStock) {
      await sendLowStockToTelegram(
        before.name,
        after,
        before.unit,
        before.minStock
      ).catch(() => {});
    }
  }
  await logAudit("stock.adjust", input.ingredientId, {
    name: before?.name,
    direction: input.direction,
    delta,
    note: input.note?.trim() || undefined,
  });
  revalidatePath("/admin/inventory");
}
