"use server";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { employees, expenses } from "@/db/schema";
import { getSession } from "@/lib/session";
import { POSITION_LABEL } from "@/lib/positions";

async function requireManager() {
  const session = await getSession();
  if (!session || session.role !== "manager") throw new Error("Unauthorized");
}

export async function addEmployee(input: {
  name: string;
  position: string;
  dailyRate: number;
}) {
  await requireManager();
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Укажите имя");
  await db.insert(employees).values({
    name,
    position: input.position?.trim() || "other",
    dailyRate: Math.max(0, Math.round(Number(input.dailyRate) || 0)),
  });
  revalidatePath("/admin/payroll");
}

export async function updateEmployee(
  id: string,
  input: { name: string; position: string; dailyRate: number }
) {
  await requireManager();
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Укажите имя");
  await db
    .update(employees)
    .set({
      name,
      position: input.position?.trim() || "other",
      dailyRate: Math.max(0, Math.round(Number(input.dailyRate) || 0)),
      updatedAt: sql`now()`,
    })
    .where(eq(employees.id, id));
  revalidatePath("/admin/payroll");
}

export async function setEmployeeActive(id: string, isActive: boolean) {
  await requireManager();
  await db
    .update(employees)
    .set({ isActive, updatedAt: sql`now()` })
    .where(eq(employees.id, id));
  revalidatePath("/admin/payroll");
}

export async function deleteEmployee(id: string) {
  await requireManager();
  await db.delete(employees).where(eq(employees.id, id));
  revalidatePath("/admin/payroll");
}

/** Pay salary → records an expense (category "salary") that flows into the
 *  finance profit. Amount = daily rate × days. */
export async function paySalary(input: {
  employeeId: string;
  days: number;
  note?: string;
}) {
  await requireManager();
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, input.employeeId));
  if (!emp) throw new Error("Сотрудник не найден");

  const days = Math.max(0.5, Number(input.days) || 1);
  const amount = Math.round(emp.dailyRate * days);
  if (amount <= 0) throw new Error("Дневная ставка не задана");

  const label = POSITION_LABEL[emp.position] ?? emp.position;
  const note =
    `ЗП: ${emp.name} · ${label} · ${days % 1 === 0 ? days : days.toFixed(1)} дн` +
    (input.note?.trim() ? ` · ${input.note.trim()}` : "");

  // Guard against a double-submit (slow network + re-click, or two managers
  // acting at once): an identical payment recorded moments ago is almost
  // certainly a duplicate, not a second real payment.
  const [dup] = await db
    .select({ id: expenses.id })
    .from(expenses)
    .where(
      and(
        eq(expenses.category, "salary"),
        eq(expenses.note, note),
        sql`${expenses.spentAt} >= now() - interval '10 seconds'`
      )
    );
  if (dup) throw new Error("Эта выплата уже проведена — не отправляйте дважды");

  await db.insert(expenses).values({ amount, category: "salary", note });
  await logAudit("payroll.pay", input.employeeId, {
    employee: emp.name,
    days,
    amount,
  });
  revalidatePath("/admin/payroll");
  revalidatePath("/admin/finance");
}
