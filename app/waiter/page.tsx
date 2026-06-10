import { redirect } from "next/navigation";
import { inArray, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, waiterCalls, staff } from "@/db/schema";
import { getSession } from "@/lib/session";
import {
  WaiterBoard,
  type BoardOrder,
  type BoardCall,
} from "@/components/waiter/WaiterBoard";

export const dynamic = "force-dynamic";

export default async function WaiterPage() {
  const session = await getSession();
  if (!session || (session.role !== "waiter" && session.role !== "manager")) {
    redirect("/waiter/login");
  }

  const [orderRows, callRows] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(inArray(orders.status, ["pending", "cooking"]))
      .orderBy(asc(orders.createdAt)),
    db
      .select()
      .from(waiterCalls)
      .where(eq(waiterCalls.status, "new"))
      .orderBy(asc(waiterCalls.createdAt)),
  ]);

  const board: BoardOrder[] = orderRows.map((o) => ({
    id: o.id,
    tableNumber: o.tableNumber,
    status: o.status as BoardOrder["status"],
    totalPrice: o.totalPrice,
    createdAt: o.createdAt.toISOString(),
    isBirthday: o.isBirthday,
    items: (o.itemsSnapshot ?? []).map((it) => ({
      name: it.nameRu,
      qty: it.quantity,
    })),
  }));

  const calls: BoardCall[] = callRows.map((c) => ({
    id: c.id,
    tableNumber: c.tableNumber,
    type: c.type as BoardCall["type"],
    createdAt: c.createdAt.toISOString(),
  }));

  // This waiter's assigned tables (for the "Мои / Все" filter)
  let myTables: string[] = [];
  if (session.waiterId) {
    const [me] = await db
      .select({ tables: staff.tables })
      .from(staff)
      .where(eq(staff.id, session.waiterId));
    myTables = (me?.tables as string[]) ?? [];
  }

  return (
    <WaiterBoard
      orders={board}
      calls={calls}
      waiterName={session.name ?? "официант"}
      myTables={myTables}
    />
  );
}
