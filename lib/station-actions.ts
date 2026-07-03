"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/session";
import { notifyWaiters } from "@/lib/realtime";
import {
  STATIONS,
  STATION_READY_COLUMN,
  itemStation,
  type StationKey,
} from "@/lib/stations";

/** Mark ALL of an order's items for one station as prepared (bulk shortcut).
 *  Sets each line's per-dish `ready` flag too, so the waiter board lights them
 *  up, and flags the station column so the order leaves this board. */
export async function markStationReady(orderId: string, station: StationKey) {
  const cfg = STATIONS[station];
  const session = await getSession();
  if (!session || (session.role !== cfg.role && session.role !== "manager")) {
    throw new Error("Unauthorized");
  }

  // Row-locked read + write: a station tick and a waiter's "delivered" tap
  // both read-modify-write this same JSONB column, so without a lock one can
  // silently clobber the other's flag.
  await db.transaction(async (tx) => {
    const [cur] = await tx
      .select({ snap: orders.itemsSnapshot })
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");
    const next = (cur?.snap ?? []).map((it) =>
      itemStation(it) === station ? { ...it, ready: true } : it
    );

    await tx
      .update(orders)
      .set({
        itemsSnapshot: next,
        [STATION_READY_COLUMN[station]]: true,
        // credit the staff who handed this station off (per-staff stats)
        ...(session.name
          ? {
              readyBy: sql`coalesce(${orders.readyBy}, '{}'::jsonb) || ${JSON.stringify(
                { [station]: session.name }
              )}::jsonb`,
            }
          : {}),
        updatedAt: sql`now()`,
      })
      .where(eq(orders.id, orderId));
  });

  await notifyWaiters();
  revalidatePath(cfg.homePath);
  revalidatePath("/waiter");
}

/** Mark a SINGLE dish ready/unready. The order stays on the station board
 *  until every one of its station's dishes is ready, at which point the
 *  station column flips and it drops off. Authorized for that station's role. */
export async function toggleItemReady(
  orderId: string,
  index: number,
  ready: boolean
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  let cfg: (typeof STATIONS)[StationKey];

  // Row-locked read + write — see markStationReady for why.
  await db.transaction(async (tx) => {
    const [cur] = await tx
      .select({ snap: orders.itemsSnapshot })
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");
    if (!cur?.snap) throw new Error("Заказ не найден");
    if (index < 0 || index >= cur.snap.length) {
      throw new Error("Позиция не найдена");
    }

    const station = itemStation(cur.snap[index]);
    cfg = STATIONS[station];
    if (session.role !== cfg.role && session.role !== "manager") {
      throw new Error("Unauthorized");
    }

    const next = cur.snap.map((it, i) => (i === index ? { ...it, ready } : it));
    // The station is "done" only once all of its dishes in this order are ready.
    const stationDone = next
      .filter((it) => itemStation(it) === station)
      .every((it) => it.ready);

    await tx
      .update(orders)
      .set({
        itemsSnapshot: next,
        [STATION_READY_COLUMN[station]]: stationDone,
        // credit the staff who marked this station done (per-staff stats)
        ...(stationDone && session.name
          ? {
              readyBy: sql`coalesce(${orders.readyBy}, '{}'::jsonb) || ${JSON.stringify(
                { [station]: session.name }
              )}::jsonb`,
            }
          : {}),
        updatedAt: sql`now()`,
      })
      .where(eq(orders.id, orderId));
  });

  await notifyWaiters();
  revalidatePath(cfg!.homePath);
  revalidatePath("/waiter");
}
