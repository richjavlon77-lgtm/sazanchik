"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  applyDeliveryStatus,
  type DeliveryStatus,
} from "@/lib/delivery-status";

export type { DeliveryStatus } from "@/lib/delivery-status";

/** Смена статуса из админки; гостю из бота статус уходит автоматически. */
export async function setDeliveryStatus(id: string, status: DeliveryStatus) {
  const session = await getSession();
  if (!session || session.role !== "manager") throw new Error("Unauthorized");

  await applyDeliveryStatus(id, status, {
    name: session.name ?? "manager",
    role: "manager",
  });
  revalidatePath("/admin/delivery");
  revalidatePath("/admin");
}
