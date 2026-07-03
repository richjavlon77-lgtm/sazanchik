import { db } from "@/db";
import { staff } from "@/db/schema";
import { asc } from "drizzle-orm";
import { StaffManager, type StaffRow } from "@/components/admin/StaffManager";
import { loadStaffStats } from "@/lib/staff-stats";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const [rows, stats] = await Promise.all([
    db.select().from(staff).orderBy(asc(staff.name)),
    loadStaffStats(),
  ]);

  const list: StaffRow[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    role: (["waiter", "bartender", "hookah", "cook", "cold", "meat"].includes(
      s.role
    )
      ? s.role
      : "waiter") as StaffRow["role"],
    zone: s.zone,
    tables: (s.tables as string[]) ?? [],
    isActive: s.isActive,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Персонал</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Каждый входит по личному PIN, система сама ведёт в нужную панель:
          официант → <span className="text-gold">/waiter</span>, бармен →{" "}
          <span className="text-gold">/bar</span>, кальянщик →{" "}
          <span className="text-gold">/hookah</span>, повар →{" "}
          <span className="text-gold">/kitchen</span> (стоп-лист). {rows.length} в
          команде.
        </p>
      </div>
      <StaffManager initial={list} stats={stats} />
    </div>
  );
}
