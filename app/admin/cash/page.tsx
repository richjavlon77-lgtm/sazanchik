import { loadCash } from "@/lib/cash-data";
import { CashRegister } from "@/components/admin/CashRegister";

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const data = await loadCash();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Касса</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Архив закрытых счетов — деньги, фактически принятые по столам. Счёт
          закрывает официант в /waiter/bills.
        </p>
      </div>
      <CashRegister data={data} />
    </div>
  );
}
