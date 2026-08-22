"use server";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { getSession } from "@/lib/session";

const CATEGORIES = ["purchase", "rent", "salary", "utilities", "other"] as const;
type ExpenseCategory = (typeof CATEGORIES)[number];

async function requireManager() {
  const session = await getSession();
  if (!session || session.role !== "manager") throw new Error("Unauthorized");
}

export async function addExpense(input: {
  amount: number;
  category: string;
  note?: string;
  spentAt?: string; // yyyy-mm-dd
}) {
  await requireManager();

  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Введите сумму больше нуля");
  }
  const category: ExpenseCategory = (CATEGORIES as readonly string[]).includes(
    input.category
  )
    ? (input.category as ExpenseCategory)
    : "other";

  await db.insert(expenses).values({
    amount,
    category,
    note: input.note?.trim() || null,
    // a date-only value lands at local midnight; null → now()
    ...(input.spentAt
      ? { spentAt: sql`(${input.spentAt}::date)` }
      : {}),
  });
  revalidatePath("/admin/finance");
}

export async function deleteExpense(id: string) {
  await requireManager();
  const [gone] = await db
    .delete(expenses)
    .where(eq(expenses.id, id))
    .returning({ amount: expenses.amount, note: expenses.note, category: expenses.category });
  if (gone) {
    await logAudit("expense.delete", id, {
      amount: gone.amount,
      category: gone.category,
      note: gone.note ?? undefined,
    });
  }
  revalidatePath("/admin/finance");
}
