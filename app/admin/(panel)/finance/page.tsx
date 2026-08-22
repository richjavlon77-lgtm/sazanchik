import { loadFinance } from "@/lib/finance-data";
import { FinanceManager } from "@/components/admin/FinanceManager";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const data = await loadFinance();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Финансы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Доход, расход и прибыль. Доход считается по всем заказам, кроме
          отменённых. Расходы вносишь вручную.
        </p>
      </div>
      <FinanceManager data={data} />
    </div>
  );
}
