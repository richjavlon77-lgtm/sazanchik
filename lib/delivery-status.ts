import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { deliveryRequests, auditLog } from "@/db/schema";
import { sendMessage, type InlineButton } from "@/lib/tg/api";

/**
 * Общая логика смены статуса доставки — используется и админкой (server
 * action), и кнопками в Telegram-чате. Гостю из бота статус приходит
 * автоматически; отмена пишется в аудит-лог с реальным актором.
 */

export type DeliveryStatus = "new" | "confirmed" | "courier" | "done" | "cancelled";

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  courier: "Курьер в пути",
  done: "Доставлена",
  cancelled: "Отменена",
};

const GUEST_NOTICE: Record<Exclude<DeliveryStatus, "new">, string> = {
  confirmed:
    "✅ <b>Заказ подтверждён!</b>\nУже готовим. Курьер выедет, как только всё будет горячим 🐟",
  courier:
    "🛵 <b>Курьер выехал!</b>\nЗаказ уже в пути — встречайте. Приятного аппетита!",
  done:
    "🎉 <b>Заказ доставлен.</b>\nСпасибо, что выбрали «Сазанчик»! Будем рады снова — /start",
  cancelled:
    "😔 <b>Заказ отменён.</b>\nЕсли это ошибка — позвоните нам или оформите заявку заново: /delivery",
};

/** true — статус реально изменился (уведомления/аудит только тогда). */
export async function applyDeliveryStatus(
  id: string,
  status: DeliveryStatus,
  actor: { name: string; role: string }
): Promise<boolean> {
  const [updated] = await db
    .update(deliveryRequests)
    .set({ status })
    .where(and(eq(deliveryRequests.id, id), ne(deliveryRequests.status, status)))
    .returning({ chatId: deliveryRequests.chatId, phone: deliveryRequests.phone });
  if (!updated) return false;

  if (status === "cancelled") {
    // напрямую (не logAudit): актором может быть человек из Telegram без web-сессии
    await db
      .insert(auditLog)
      .values({
        actor: actor.name,
        role: actor.role,
        action: "delivery.cancel",
        entityId: id,
        details: { phone: updated.phone },
      })
      .catch(() => {});
  }

  if (status !== "new" && /^\d+$/.test(updated.chatId)) {
    await sendMessage(updated.chatId, GUEST_NOTICE[status]);
  }
  return true;
}

/** Кнопки заявки в рабочем чате: текущий шаг + следующий + отмена. */
export function deliveryKeyboard(
  id: string,
  status: DeliveryStatus,
  by?: string
): InlineButton[][] {
  const done = (label: string) => [
    { text: `· ${label}${by ? ` · ${by}` : ""} ·`, callback_data: "noop" },
  ];
  switch (status) {
    case "new":
      return [
        [
          { text: "✅ Подтвердить", callback_data: `dstat_${id}_confirmed` },
          { text: "✖ Отмена", callback_data: `dstat_${id}_cancelled` },
        ],
      ];
    case "confirmed":
      return [
        done("Подтверждена"),
        [
          { text: "🛵 Курьер выехал", callback_data: `dstat_${id}_courier` },
          { text: "✖ Отмена", callback_data: `dstat_${id}_cancelled` },
        ],
      ];
    case "courier":
      return [
        done("Курьер в пути"),
        [{ text: "🎉 Доставлена", callback_data: `dstat_${id}_done` }],
      ];
    case "done":
      return [done("Доставлена 🎉")];
    case "cancelled":
      return [done("Отменена")];
  }
}
