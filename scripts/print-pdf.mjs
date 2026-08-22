/**
 * Генерация печатных PDF (для типографии) из /print-маршрутов.
 *
 *   node scripts/print-pdf.mjs qr [count] [out.pdf]   — QR-карточки столов
 *   node scripts/print-pdf.mjs menu [out.pdf]         — печатное меню
 *
 * Нужен запущенный dev/prod сервер (BASE_URL, по умолчанию :3000).
 * Использует системный Chrome (playwright-core, браузеры не качает) и
 * сам подписывает менеджерскую сессию секретом из .env.local.
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { SignJWT } from "jose";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/** SESSION_SECRET из окружения или .env.local — без сторонних dotenv */
function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(/^SESSION_SECRET=(.+)$/m);
  if (!m) throw new Error("SESSION_SECRET не найден в .env.local");
  // Next.js срезает обрамляющие кавычки при загрузке env — делаем так же
  return m[1].trim().replace(/^(["'])(.*)\1$/, "$2");
}

async function managerToken() {
  return new SignJWT({ role: "manager" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(sessionSecret()));
}

const [, , mode = "qr", ...rest] = process.argv;

let path, out;
if (mode === "qr") {
  const count = /^\d+$/.test(rest[0]) ? rest.shift() : "35";
  path = `/print/qr?count=${count}`;
  out = rest[0] || "sazanchik-qr.pdf";
} else if (mode === "menu") {
  path = "/print";
  out = rest[0] || "sazanchik-menu.pdf";
} else {
  console.error("Использование: node scripts/print-pdf.mjs qr|menu [count] [out.pdf]");
  process.exit(1);
}

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext();
await context.addCookies([
  {
    name: "sazanchik_session",
    value: await managerToken(),
    domain: new URL(BASE_URL).hostname,
    path: "/",
  },
]);

const page = await context.newPage();
const resp = await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
if (new URL(page.url()).pathname !== path.split("?")[0]) {
  console.error(
    `✗ Редирект на ${page.url()} (HTTP ${resp?.status()}) — сессия не принята`
  );
  await browser.close();
  process.exit(1);
}
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: out,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();
console.log(`✓ ${out} ← ${path}`);
