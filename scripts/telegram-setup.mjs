/**
 * Настройка @Sazanchik_city_bot: webhook + меню команд.
 *
 *   node scripts/telegram-setup.mjs           # на прод (sazanchik.vercel.app)
 *   BASE_URL=... node scripts/telegram-setup.mjs
 *
 * Нужны TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET (env или .env.local).
 */
import { readFileSync } from "node:fs";

function env(name) {
  if (process.env[name]) return process.env[name];
  const s = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = s.match(new RegExp(`^${name}=(.+)$`, "m"));
  return m ? m[1].trim().replace(/^(["'])(.*)\1$/, "$2") : null;
}

const TOKEN = env("TELEGRAM_BOT_TOKEN");
const SECRET = env("TELEGRAM_WEBHOOK_SECRET");
const BASE = process.env.BASE_URL || "https://sazanchik.vercel.app";
if (!TOKEN || !SECRET) {
  console.error("Нужны TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET");
  process.exit(1);
}

const api = (method, payload) =>
  fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => r.json());

const webhook = await api("setWebhook", {
  url: `${BASE}/api/telegram/webhook`,
  secret_token: SECRET,
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: true,
});
console.log("setWebhook:", webhook.ok ? "✓" : webhook);

// Публичное меню команд (гостевые; остальные — скрытые, по ролям)
const commands = await api("setMyCommands", {
  commands: [
    { command: "start", description: "Главное меню" },
    { command: "menu", description: "🍽 Меню ресторана" },
    { command: "book", description: "📅 Забронировать стол" },
    { command: "delivery", description: "🚚 Доставка на дом" },
  ],
});
console.log("setMyCommands:", commands.ok ? "✓" : commands);

// Синяя кнопка — мини-апп ДОСТАВКИ (не столовый сайт зала!)
const menuBtn = await api("setChatMenuButton", {
  menu_button: { type: "web_app", text: "Доставка", web_app: { url: `${BASE}/delivery` } },
});
console.log("setChatMenuButton:", menuBtn.ok ? "✓" : menuBtn);

const info = await api("getWebhookInfo", {});
console.log("webhook url:", info.result?.url, "| pending:", info.result?.pending_update_count ?? 0);
