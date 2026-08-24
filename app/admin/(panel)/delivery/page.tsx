import { desc } from "drizzle-orm";
import { db } from "@/db";
import { deliveryRequests } from "@/db/schema";
import { DeliveryBoard } from "@/components/admin/DeliveryBoard";

export const dynamic = "force-dynamic";

export default async function DeliveryAdminPage() {
  const rows = await db
    .select()
    .from(deliveryRequests)
    .orderBy(desc(deliveryRequests.createdAt))
    .limit(100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Доставка</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Новая → Подтверждена → Курьер в пути → Доставлена. Гостю из бота
          статусы приходят автоматически.
        </p>
      </div>
      <DeliveryBoard
        rows={rows.map((r) => ({
          id: r.id,
          phone: r.phone,
          address: r.address,
          items: r.items,
          status: r.status,
          fromBot: /^\d+$/.test(r.chatId),
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
