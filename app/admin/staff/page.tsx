import { db } from "@/db";
import { staff } from "@/db/schema";
import { asc } from "drizzle-orm";
import { StaffManager, type StaffRow } from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const rows = await db.select().from(staff).orderBy(asc(staff.name));
  const list: StaffRow[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    zone: s.zone,
    isActive: s.isActive,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Персонал</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Официанты входят на <span className="text-gold">/waiter</span> по
          личному PIN. {rows.length} в команде.
        </p>
      </div>
      <StaffManager initial={list} />
    </div>
  );
}
