import { tableLabel } from "@/lib/tables";

type TelegramEnv = {
  botToken?: string;
  chatId?: string;
};

function getEnv(): TelegramEnv {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  };
}

function isConfigured(env: TelegramEnv): env is Required<TelegramEnv> {
  return !!env.botToken && !!env.chatId;
}

type OrderItem = {
  name: string;
  variantLabel?: string;
  qty: number;
  price: number;
};

export async function sendOrderToTelegram(
  orderId: string,
  tableNumber: string,
  items: OrderItem[],
  subtotal: number,
  service: number,
  total: number,
  isBirthday = false
): Promise<{ ok: boolean }> {
  const env = getEnv();
  if (!isConfigured(env)) {
    return { ok: false };
  }

  const lines = items
    .map(
      (item) =>
        `• ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} x${item.qty} — ${formatPrice(item.price * item.qty)}`
    )
    .join("\n");

  const message = [
    `<b>Поступил ЗАКАЗ №${orderId.slice(0, 8)}</b>`,
    tableLabel(tableNumber),
    `───────────────────────────`,
    lines,
    `───────────────────────────`,
    isBirthday ? `🎂 День рождения — скидка 10% (проверить документ)` : "",
    `Сервис-чардж 20%: ${formatPrice(service)}`,
    `<b>ИТОГО К ОПЛАТЕ: ${formatPrice(total)}</b>`,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000); // Telegram soft-limit is 4096 chars

  const url = `https://api.telegram.org/bot${env.botToken}/sendMessage`;

  // We send structured parse_mode=HTML without inline buttons
  // because Telegram Bot API inline keyboards require a webhook / polling loop.
  // For MVP we send a clean formatted message.
  // Staff pin the chat and get notified by sound.

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.chatId,
      text: message,
      parse_mode: "HTML",
      disable_notification: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    console.error("Telegram send failed:", res.status, err);
    return { ok: false };
  }

  return { ok: true };
}

export async function sendLowStockToTelegram(
  name: string,
  stock: number,
  unit: string,
  min: number
): Promise<{ ok: boolean }> {
  const env = getEnv();
  if (!isConfigured(env)) return { ok: false };

  const n = (v: number) => Number(v.toFixed(2)).toLocaleString("ru-RU");
  const message = [
    `<b>⚠️ Заканчивается на складе</b>`,
    `${name}: осталось <b>${n(stock)} ${unit}</b> (минимум ${n(min)} ${unit})`,
    `Пора пополнить запас.`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${env.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.chatId,
      text: message,
      parse_mode: "HTML",
      disable_notification: false,
    }),
  });
  if (!res.ok) {
    console.error("Telegram low-stock failed:", res.status);
    return { ok: false };
  }
  return { ok: true };
}

export async function sendErrorToTelegram(input: {
  message: string;
  url?: string;
  ua?: string;
  stack?: string;
}): Promise<{ ok: boolean }> {
  const env = getEnv();
  if (!isConfigured(env)) return { ok: false };

  const clip = (s: string | undefined, n: number) =>
    (s ?? "").slice(0, n).replace(/[<>&]/g, " ");
  const message = [
    `<b>🐞 Ошибка на сайте</b>`,
    clip(input.message, 300),
    input.url ? `Стр: ${clip(input.url, 120)}` : "",
    input.ua ? `Устр: ${clip(input.ua, 120)}` : "",
    input.stack ? `<code>${clip(input.stack, 400)}</code>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const url = `https://api.telegram.org/bot${env.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.chatId,
      text: message,
      parse_mode: "HTML",
      disable_notification: true,
    }),
  });
  if (!res.ok) {
    console.error("Telegram error-report failed:", res.status);
    return { ok: false };
  }
  return { ok: true };
}

export async function sendWaiterCallToTelegram(
  tableNumber: string,
  type: "waiter" | "bill" | "water"
): Promise<{ ok: boolean }> {
  const env = getEnv();
  if (!isConfigured(env)) {
    return { ok: false };
  }

  const labelMap: Record<typeof type, string> = {
    waiter: "🚨 Вызов официанта",
    bill: "💰 Просят счёт",
    water: "🚰 Просят воду",
  };

  const message = [
    `<b>${labelMap[type]}</b>`,
    tableLabel(tableNumber),
    type === "waiter" ? `⏱ Срочно!` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const url = `https://api.telegram.org/bot${env.botToken}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.chatId,
      text: message,
      parse_mode: "HTML",
      disable_notification: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    console.error("Telegram waiter call failed:", res.status, err);
    return { ok: false };
  }

  return { ok: true };
}

export async function sendReservationToTelegram(input: {
  id: string;
  name: string;
  phone: string;
  guests: number;
  reservedAt: Date;
  tableNumber?: string | null;
  comment?: string | null;
  isBirthday: boolean;
}): Promise<{ ok: boolean }> {
  const env = getEnv();
  if (!isConfigured(env)) {
    return { ok: false };
  }

  const when = input.reservedAt.toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const message = [
    `<b>🪑 НОВАЯ БРОНЬ №${input.id.slice(0, 8)}</b>`,
    `Гость: <b>${escapeHtml(input.name)}</b>`,
    `Телефон: ${escapeHtml(input.phone)}`,
    `Когда: <b>${when}</b> (Ташкент)`,
    `Гостей: ${input.guests}`,
    input.tableNumber ? escapeHtml(tableLabel(input.tableNumber)) : "",
    input.isBirthday ? `🎂 День рождения — скидка 10% (проверить документ)` : "",
    input.comment ? `Комментарий: ${escapeHtml(input.comment)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const url = `https://api.telegram.org/bot${env.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.chatId,
      text: message,
      parse_mode: "HTML",
      disable_notification: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    console.error("Telegram reservation failed:", res.status, err);
    return { ok: false };
  }

  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatPrice(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} сум`;
}

/** Уведомление об успешной онлайн-оплате счёта (Payme/Click). */
export async function sendPaymentToTelegram(
  provider: "payme" | "click",
  tableNumber: string,
  amount: number
): Promise<{ ok: boolean }> {
  const env = getEnv();
  if (!isConfigured(env)) return { ok: false };

  const label = provider === "payme" ? "Payme" : "Click";
  const message = [
    `<b>💳 Оплата онлайн (${label})</b>`,
    tableLabel(tableNumber),
    `Сумма: <b>${formatPrice(amount)}</b>`,
    `Проверьте и закройте счёт.`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${env.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.chatId,
      text: message,
      parse_mode: "HTML",
      disable_notification: false,
    }),
  });
  if (!res.ok) {
    console.error("Telegram payment notify failed:", res.status);
    return { ok: false };
  }
  return { ok: true };
}
