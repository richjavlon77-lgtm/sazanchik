import { loadInventory } from "@/lib/inventory-data";
import { InventoryManager } from "@/components/admin/InventoryManager";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const data = await loadInventory();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Склад</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Товары для блюд: остатки, приход и списание. Дальше подключим рецепты
          (что в каком блюде) и авто-списание по заказам.
        </p>
      </div>
      <InventoryManager data={data} />
    </div>
  );
}
