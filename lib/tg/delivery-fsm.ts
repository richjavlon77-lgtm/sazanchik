/**
 * Диалог заявки на доставку — чистая машина состояний (как booking-fsm).
 * MVP-процесс ресторана: гость оставляет телефон, адрес и список блюд,
 * менеджер перезванивает, подтверждает сумму и отправляет курьера.
 */

export type DeliveryData = {
  phone?: string;
  address?: string;
  items?: string;
};

export type DeliveryState = "phone" | "address" | "items" | "confirm";

export type DeliveryInput =
  | { kind: "text"; text: string }
  | { kind: "contact"; phone: string }
  | { kind: "callback"; data: string };

export type DeliveryReply = {
  text: string;
  inline?: { text: string; callback_data: string }[][];
  askContact?: boolean;
};

export type DeliveryResult =
  | { done: false; state: DeliveryState; data: DeliveryData; reply: DeliveryReply }
  | { done: true; request: Required<DeliveryData>; reply: DeliveryReply }
  | { cancelled: true; reply: DeliveryReply };

const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

const CANCELLED: DeliveryResult = {
  cancelled: true,
  reply: { text: "Заявка отменена. Будем ждать вас снова 🐟" },
};

export const DELIVERY_START: DeliveryReply = {
  text:
    "🚚 <b>Доставка на дом</b>\n\n" +
    "Оставьте заявку — менеджер перезвонит в течение 10 минут, подтвердит сумму и время доставки.\n\n" +
    "Ваш телефон? Можно кнопкой ниже 👇",
  askContact: true,
};

export function deliveryStep(
  state: DeliveryState,
  data: DeliveryData,
  input: DeliveryInput
): DeliveryResult {
  if (input.kind === "callback" && input.data === "dl_cancel") return CANCELLED;
  if (input.kind === "text" && /^\/(cancel|отмена)/i.test(input.text)) return CANCELLED;

  switch (state) {
    case "phone": {
      const phone =
        input.kind === "contact"
          ? input.phone
          : input.kind === "text" && PHONE_RE.test(input.text.trim())
            ? input.text.trim()
            : null;
      if (!phone) {
        return {
          done: false,
          state,
          data,
          reply: { text: "Нужен номер телефона — цифрами или кнопкой «Поделиться» 👇", askContact: true },
        };
      }
      return {
        done: false,
        state: "address",
        data: { ...data, phone },
        reply: { text: "Адрес доставки? (улица, дом, подъезд/ориентир)" },
      };
    }

    case "address": {
      if (input.kind !== "text" || input.text.trim().length < 5) {
        return {
          done: false,
          state,
          data,
          reply: { text: "Напишите адрес подробнее, чтобы курьер нашёл вас 🙂" },
        };
      }
      return {
        done: false,
        state: "items",
        data: { ...data, address: input.text.trim().slice(0, 300) },
        reply: {
          text:
            "Что закажете? Напишите списком, например:\n" +
            "<i>Плов ×2, ачичук, лимонад тархун</i>\n\n" +
            "Меню с ценами — по кнопке «🍽 Меню» в /start.",
        },
      };
    }

    case "items": {
      if (input.kind !== "text" || input.text.trim().length < 3) {
        return {
          done: false,
          state,
          data,
          reply: { text: "Напишите хотя бы одно блюдо 🙂" },
        };
      }
      const d = { ...data, items: input.text.trim().slice(0, 800) } as Required<DeliveryData>;
      return {
        done: false,
        state: "confirm",
        data: d,
        reply: {
          text:
            `Проверим заявку:\n\n📞 ${d.phone}\n📍 ${d.address}\n🍽 ${d.items}\n\nОтправляем?`,
          inline: [
            [
              { text: "✅ Отправить", callback_data: "dl_ok" },
              { text: "✖ Отмена", callback_data: "dl_cancel" },
            ],
          ],
        },
      };
    }

    case "confirm": {
      if (input.kind === "callback" && input.data === "dl_ok") {
        return {
          done: true,
          request: data as Required<DeliveryData>,
          reply: {
            text:
              "🎉 <b>Заявка отправлена!</b>\n\n" +
              "Менеджер перезвонит в течение 10 минут, назовёт сумму и время доставки. Спасибо! 🐟",
          },
        };
      }
      return {
        done: false,
        state,
        data,
        reply: { text: "Нажмите «Отправить» или «Отмена» 🙂" },
      };
    }
  }
}
