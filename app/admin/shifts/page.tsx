import { loadShifts } from "@/lib/shifts-data";
import { ShiftsManager } from "@/components/admin/ShiftsManager";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const data = await loadShifts();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Смены</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Приход и уход персонала: часы, опоздания, отработанные смены. Выплаты
          по сменам делаешь в разделе Зарплаты.
        </p>
      </div>
      <ShiftsManager data={data} />
    </div>
  );
}
