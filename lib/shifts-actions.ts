"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { shifts, employees } from "@/db/schema";
import { getSession } from "@/lib/session";

async function requireManager() {
  const session = await getSession();
  if (!session || session.role !== "manager") throw new Error("Unauthorized");
}

/** Clock in — opens a shift. One open shift per employee (unique index). */
export async function clockIn(employeeId: string) {
  await requireManager();
  try {
    await db.insert(shifts).values({ employeeId });
  } catch (e) {
    if ((e as { code?: string })?.code === "23505") {
      throw new Error("Сотрудник уже на смене");
    }
    throw e;
  }
  revalidatePath("/admin/shifts");
}

/** Clock out — closes the open shift. */
export async function clockOut(employeeId: string) {
  await requireManager();
  const res = await db
    .update(shifts)
    .set({ endedAt: sql`now()` })
    .where(and(eq(shifts.employeeId, employeeId), isNull(shifts.endedAt)))
    .returning({ id: shifts.id });
  if (res.length === 0) throw new Error("Сотрудник не на смене");
  revalidatePath("/admin/shifts");
}

/** Manual shift (correction): explicit start/end. */
export async function addShift(input: {
  employeeId: string;
  startedAt: string;
  endedAt?: string;
}) {
  await requireManager();
  if (!input.startedAt) throw new Error("Укажите начало");
  await db.insert(shifts).values({
    employeeId: input.employeeId,
    startedAt: sql`${input.startedAt}::timestamptz`,
    ...(input.endedAt ? { endedAt: sql`${input.endedAt}::timestamptz` } : {}),
  });
  revalidatePath("/admin/shifts");
}

export async function deleteShift(id: string) {
  await requireManager();
  await db.delete(shifts).where(eq(shifts.id, id));
  revalidatePath("/admin/shifts");
}

/** Set an employee's planned start time "HH:MM" (for lateness). */
export async function setShiftStart(employeeId: string, value: string) {
  await requireManager();
  const v = /^\d{1,2}:\d{2}$/.test(value.trim()) ? value.trim() : null;
  await db
    .update(employees)
    .set({ shiftStart: v, updatedAt: sql`now()` })
    .where(eq(employees.id, employeeId));
  revalidatePath("/admin/shifts");
}
