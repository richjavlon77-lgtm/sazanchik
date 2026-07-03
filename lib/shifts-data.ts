import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";

export type EmployeeShift = {
  id: string;
  name: string;
  position: string;
  dailyRate: number;
  shiftStart: string | null;
  onShift: boolean;
  todayHours: number;
  shifts30: number;
  hours30: number;
  lateCount: number;
  expectedPay: number;
};

export type ShiftLog = {
  id: string;
  name: string;
  date: string;
  start: string;
  end: string | null;
  hours: number;
  lateMin: number;
};

export type ShiftsData = {
  employees: EmployeeShift[];
  log: ShiftLog[];
  onShiftCount: number;
};

const TZ = "Asia/Tashkent";
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export async function loadShifts(): Promise<ShiftsData> {
  const emps = await db
    .select()
    .from(employees)
    .where(eq(employees.isActive, true))
    .orderBy(asc(employees.name));

  const rows = (await db.execute(sql`
    select s.id, s.employee_id,
      to_char(s.started_at at time zone ${TZ}, 'DD.MM') as date,
      to_char(s.started_at at time zone ${TZ}, 'HH24:MI') as start,
      case when s.ended_at is null then null
           else to_char(s.ended_at at time zone ${TZ}, 'HH24:MI') end as end,
      (s.ended_at is null) as open,
      ((s.started_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date) as is_today,
      extract(epoch from (coalesce(s.ended_at, now()) - s.started_at)) as seconds
    from shifts s
    where s.started_at >= now() - interval '30 days'
    order by s.started_at desc
  `)) as unknown as {
    id: string;
    employee_id: string;
    date: string;
    start: string;
    end: string | null;
    open: boolean;
    is_today: boolean;
    seconds: string | number;
  }[];

  const byEmp = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!byEmp.has(r.employee_id)) byEmp.set(r.employee_id, []);
    byEmp.get(r.employee_id)!.push(r);
  }

  const lateOf = (start: string, shiftStart: string | null) =>
    shiftStart ? Math.max(0, toMin(start) - toMin(shiftStart)) : 0;

  const empList: EmployeeShift[] = emps.map((e) => {
    const mine = byEmp.get(e.id) ?? [];
    const onShift = mine.some((r) => r.open);
    const hours30 = mine.reduce((s, r) => s + Number(r.seconds) / 3600, 0);
    const todayHours = mine
      .filter((r) => r.is_today)
      .reduce((s, r) => s + Number(r.seconds) / 3600, 0);
    const lateCount = mine.filter((r) => lateOf(r.start, e.shiftStart) > 0).length;
    // A lunch-break clock-out/in creates two shift rows the same calendar
    // day — pay is per day worked, not per clock-in, so dedupe by date.
    const daysWorked = new Set(mine.map((r) => r.date)).size;
    return {
      id: e.id,
      name: e.name,
      position: e.position,
      dailyRate: e.dailyRate,
      shiftStart: e.shiftStart,
      onShift,
      todayHours: Math.round(todayHours * 10) / 10,
      shifts30: mine.length,
      hours30: Math.round(hours30 * 10) / 10,
      lateCount,
      expectedPay: daysWorked * e.dailyRate,
    };
  });

  const nameById = new Map(emps.map((e) => [e.id, e]));
  const log: ShiftLog[] = rows.slice(0, 25).map((r) => {
    const e = nameById.get(r.employee_id);
    return {
      id: r.id,
      name: e?.name ?? "—",
      date: r.date,
      start: r.start,
      end: r.end,
      hours: Math.round((Number(r.seconds) / 3600) * 10) / 10,
      lateMin: lateOf(r.start, e?.shiftStart ?? null),
    };
  });

  return {
    employees: empList,
    log,
    onShiftCount: empList.filter((e) => e.onShift).length,
  };
}
