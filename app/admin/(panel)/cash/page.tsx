import { loadCash } from "@/lib/cash-data";
import { CashRegister } from "@/components/admin/CashRegister";

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const data = await loadCash();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Касса · Закрытые счета</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Фактически закрытые счета по столам. Счёт закрывает официант в
          панели «Счета». Это кассовый учёт — в отличие от «Финансов», где
          учитываются все заказы (включая открытые).
        </p>
      </div>
      <CashRegister data={data} />
    </div>
  );
}
