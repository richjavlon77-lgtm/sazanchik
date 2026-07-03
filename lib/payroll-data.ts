import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { employees, expenses } from "@/db/schema";

export type EmployeeRow = {
  id: string;
  name: string;
  position: string;
  dailyRate: number;
  isActive: boolean;
};

export type SalaryPayment = {
  id: string;
  amount: number;
  note: string | null;
  at: string;
};

export type PayrollData = {
  employees: EmployeeRow[];
  dailyFund: number; // sum of active daily rates
  monthlyEstimate: number; // dailyFund × 26 working days
  paidThisMonth: number; // salary expenses, last 30 days
  payments: SalaryPayment[];
};

const TZ = "Asia/Tashkent";

export async function loadPayroll(): Promise<PayrollData> {
  const rows = await db
    .select()
    .from(employees)
    .orderBy(desc(employees.isActive), employees.name);

  const list: EmployeeRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    position: r.position,
    dailyRate: r.dailyRate,
    isActive: r.isActive,
  }));

  const dailyFund = list
    .filter((e) => e.isActive)
    .reduce((s, e) => s + e.dailyRate, 0);

  const paidRows = (await db.execute(sql`
    select coalesce(sum(amount),0)::bigint as paid
    from expenses
    where category = 'salary' and spent_at >= now() - interval '30 days'
  `)) as unknown as { paid: string | number }[];

  const payRows = await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      note: expenses.note,
      at: sql<string>`to_char(${expenses.spentAt} at time zone ${TZ}, 'DD.MM.YYYY')`,
    })
    .from(expenses)
    .where(eq(expenses.category, "salary"))
    .orderBy(desc(expenses.spentAt))
    .limit(15);

  return {
    employees: list,
    dailyFund,
    monthlyEstimate: dailyFund * 26,
    paidThisMonth: Number(paidRows[0]?.paid ?? 0),
    payments: payRows,
  };
}
