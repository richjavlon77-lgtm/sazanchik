import { loadPayroll } from "@/lib/payroll-data";
import { PayrollManager } from "@/components/admin/PayrollManager";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const data = await loadPayroll();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Зарплаты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Реестр сотрудников и дневной гарант. Выплата записывается в расходы и
          уменьшает прибыль в Финансах.
        </p>
      </div>
      <PayrollManager data={data} />
    </div>
  );
}
