import { redirect } from "next/navigation";
import { inArray, asc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/session";
import { WaiterBoard, type BoardOrder } from "@/components/waiter/WaiterBoard";

export const dynamic = "force-dynamic";

export default async function WaiterPage() {
  const session = await getSession();
  if (!session || (session.role !== "waiter" && session.role !== "manager")) {
    redirect("/waiter/login");
  }

  const rows = await db
    .select()
    .from(orders)
    .where(inArray(orders.status, ["pending", "cooking"]))
    .orderBy(asc(orders.createdAt));

  const board: BoardOrder[] = rows.map((o) => ({
    id: o.id,
    tableNumber: o.tableNumber,
    status: o.status as BoardOrder["status"],
    totalPrice: o.totalPrice,
    createdAt: o.createdAt.toISOString(),
    items: (o.itemsSnapshot ?? []).map((it) => ({
      name: it.nameRu,
      qty: it.quantity,
    })),
  }));

  return (
    <WaiterBoard orders={board} waiterName={session.name ?? "официант"} />
  );
}
