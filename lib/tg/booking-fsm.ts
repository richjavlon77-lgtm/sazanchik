/**
 * Диалог брони в боте — чистая машина состояний, без БД и Telegram.
 * Вход: текущее состояние + данные + сообщение/кнопка гостя.
 * Выход: новое состояние + что ответить + готовая бронь (на финале).
 * Все побочные эффекты — в обработчике вебхука.
 */

export type BookingData = {
  name?: string;
  phone?: string;
  /** YYYY-MM-DD (Ташкент) */
  date?: string;
  /** HH:MM */
  time?: string;
  guests?: number;
};

export type BookingState =
  | "name"
  | "phone"
  | "date"
  | "time"
  | "guests"
  | "confirm";

export type FsmInput =
  | { kind: "text"; text: string }
  | { kind: "contact"; phone: string; name?: string }
  | { kind: "callback"; data: string };

export type FsmReply = {
  text: string;
  inline?: { text: string; callback_data: string }[][];
  /** просим поделиться контактом reply-кнопкой */
  askContact?: boolean;
};

export type FsmResult =
  | { done: false; state: BookingState; data: BookingData; reply: FsmReply }
  | { done: true; booking: Required<BookingData>; reply: FsmReply }
  | { cancelled: true; reply: FsmReply };

const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;
const TIME_RE = /^([01]?\d|2[0-3])[:.]([0-5]\d)$/;

/** «Сегодня»/«завтра» + ДД.ММ → YYYY-MM-DD относительно ташкентского дня. */
export function parseDate(text: string, todayTashkent: string): string | null {
  const t = text.trim().toLowerCase();
  const [y, m, d] = todayTashkent.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  if (t === "сегодня" || t === "bugun" || t === "today") return fmt(base);
  if (t === "завтра" || t === "ertaga" || t === "tomorrow") {
    base.setUTCDate(base.getUTCDate() + 1);
    return fmt(base);
  }
  const m1 = t.match(/^(\d{1,2})[./](\d{1,2})$/);
  if (m1) {
    const dd = Number(m1[1]);
    const mm = Number(m1[2]);
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
    let year = y;
    // прошедшая в этом году дата → значит, речь про следующий год
    const candidate = new Date(Date.UTC(year, mm - 1, dd));
    if (candidate < base) year += 1;
    const dt = new Date(Date.UTC(year, mm - 1, dd));
    if (dt.getUTCMonth() !== mm - 1) return null; // 31.02 и подобное
    return fmt(dt);
  }
  return null;
}

export function parseTime(text: string): string | null {
  const m = text.trim().match(TIME_RE);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

const timeButtons = () => [
  [
    { text: "18:00", callback_data: "bk_t_18:00" },
    { text: "19:00", callback_data: "bk_t_19:00" },
    { text: "20:00", callback_data: "bk_t_20:00" },
  ],
  [
    { text: "13:00", callback_data: "bk_t_13:00" },
    { text: "21:00", callback_data: "bk_t_21:00" },
    { text: "✖ Отмена", callback_data: "bk_cancel" },
  ],
];

const guestButtons = () => [
  [1, 2, 3, 4].map((n) => ({ text: String(n), callback_data: `bk_g_${n}` })),
  [
    { text: "5", callback_data: "bk_g_5" },
    { text: "6", callback_data: "bk_g_6" },
    { text: "8+", callback_data: "bk_g_8" },
    { text: "✖", callback_data: "bk_cancel" },
  ],
];

const dateButtons = () => [
  [
    { text: "Сегодня", callback_data: "bk_d_today" },
    { text: "Завтра", callback_data: "bk_d_tomorrow" },
  ],
  [{ text: "✖ Отмена", callback_data: "bk_cancel" }],
];

const CANCELLED: FsmResult = {
  cancelled: true,
  reply: { text: "Бронь отменена. Возвращайтесь, когда будете готовы 🐟" },
};

export const START_REPLY: FsmReply = {
  text: "📅 <b>Бронь столика</b>\n\nКак вас записать? Напишите имя.",
};

/** Один шаг диалога. */
export function bookingStep(
  state: BookingState,
  data: BookingData,
  input: FsmInput,
  todayTashkent: string
): FsmResult {
  if (input.kind === "callback" && input.data === "bk_cancel") return CANCELLED;
  if (input.kind === "text" && /^\/(cancel|отмена)/i.test(input.text)) return CANCELLED;

  switch (state) {
    case "name": {
      if (input.kind !== "text" || input.text.trim().length < 2) {
        return {
          done: false,
          state,
          data,
          reply: { text: "Напишите имя текстом, пожалуйста 🙂" },
        };
      }
      return {
        done: false,
        state: "phone",
        data: { ...data, name: input.text.trim().slice(0, 80) },
        reply: {
          text: "Телефон для подтверждения брони?\nМожно нажать кнопку ниже 👇",
          askContact: true,
        },
      };
    }

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
        state: "date",
        data: { ...data, phone },
        reply: { text: "На какой день? Можно написать дату (например 25.08).", inline: dateButtons() },
      };
    }

    case "date": {
      const raw =
        input.kind === "callback"
          ? input.data === "bk_d_today"
            ? "сегодня"
            : input.data === "bk_d_tomorrow"
              ? "завтра"
              : ""
          : input.kind === "text"
            ? input.text
            : "";
      const date = parseDate(raw, todayTashkent);
      if (!date) {
        return {
          done: false,
          state,
          data,
          reply: { text: "Не понял дату 😅 Напишите как 25.08 — или выберите кнопкой.", inline: dateButtons() },
        };
      }
      return {
        done: false,
        state: "time",
        data: { ...data, date },
        reply: { text: "Во сколько?", inline: timeButtons() },
      };
    }

    case "time": {
      const raw =
        input.kind === "callback" && input.data.startsWith("bk_t_")
          ? input.data.slice(5)
          : input.kind === "text"
            ? input.text
            : "";
      const time = parseTime(raw);
      if (!time) {
        return {
          done: false,
          state,
          data,
          reply: { text: "Время в формате 19:30, пожалуйста — или кнопкой.", inline: timeButtons() },
        };
      }
      return {
        done: false,
        state: "guests",
        data: { ...data, time },
        reply: { text: "Сколько гостей?", inline: guestButtons() },
      };
    }

    case "guests": {
      const raw =
        input.kind === "callback" && input.data.startsWith("bk_g_")
          ? input.data.slice(5)
          : input.kind === "text"
            ? input.text.trim()
            : "";
      const guests = Number(raw);
      if (!Number.isInteger(guests) || guests < 1 || guests > 50) {
        return {
          done: false,
          state,
          data,
          reply: { text: "Число гостей от 1 до 50 🙂", inline: guestButtons() },
        };
      }
      const d = { ...data, guests } as Required<BookingData>;
      const [yy, mm, dd] = d.date.split("-");
      return {
        done: false,
        state: "confirm",
        data: d,
        reply: {
          text:
            `Проверим:\n\n` +
            `👤 ${d.name}\n📞 ${d.phone}\n📅 ${dd}.${mm}.${yy} в ${d.time}\n👥 ${d.guests} гост.\n\nВсё верно?`,
          inline: [
            [
              { text: "✅ Забронировать", callback_data: "bk_ok" },
              { text: "✖ Отмена", callback_data: "bk_cancel" },
            ],
          ],
        },
      };
    }

    case "confirm": {
      if (input.kind === "callback" && input.data === "bk_ok") {
        const d = data as Required<BookingData>;
        const [yy, mm, dd] = d.date.split("-");
        return {
          done: true,
          booking: d,
          reply: {
            text:
              `🎉 <b>Бронь принята!</b>\n\n` +
              `${dd}.${mm}.${yy} в ${d.time} · ${d.guests} гост. · ${d.name}\n\n` +
              `Мы позвоним для подтверждения. До встречи в «Сазанчике»! 🐟`,
          },
        };
      }
      return {
        done: false,
        state,
        data,
        reply: { text: "Нажмите «Забронировать» или «Отмена» 🙂" },
      };
    }
  }
}
