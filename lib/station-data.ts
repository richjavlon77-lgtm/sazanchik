import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { STATION_READY_COLUMN, itemStation, type StationKey } from "@/lib/stations";
import type { StationOrder } from "@/components/staff/StationBoard";

/** Active orders that still have unprepared items for this station,
 *  reduced to just that station's lines. */
export async function loadStationOrders(
  station: StationKey
): Promise<StationOrder[]> {
  const readyCol = orders[STATION_READY_COLUMN[station]];

  const rows = await db
    .select()
    .from(orders)
    .where(
      and(inArray(orders.status, ["pending", "cooking"]), eq(readyCol, false))
    )
    .orderBy(asc(orders.createdAt));

  return rows
    .map((o) => ({
      id: o.id,
      tableNumber: o.tableNumber,
      createdAt: o.createdAt.toISOString(),
      items: (o.itemsSnapshot ?? [])
        // keep the original snapshot index — the per-dish toggle references it
        .map((it, index) => ({ it, index }))
        .filter(({ it }) => itemStation(it) === station)
        .map(({ it, index }) => ({
          name: it.nameRu,
          qty: it.quantity,
          ready: it.ready ?? false,
          index,
        })),
    }))
    .filter((o) => o.items.length > 0);
}
