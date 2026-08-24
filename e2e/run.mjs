/**
 * E2E-прогон на ИЗОЛИРОВАННОЙ базе — прод не трогается вообще.
 *
 *   npm run e2e
 *
 * Что происходит:
 *  1. Поднимается одноразовый Postgres (initdb во временной папке;
 *     либо берётся готовый из E2E_DATABASE_URL — так работает CI).
 *  2. drizzle-kit push накатывает схему, сид кладёт минимальные данные.
 *  3. Стартует next dev на тестовом порту с тестовыми env.
 *  4. Сценарии: гость заказывает по подписанному QR (API), подделка QR
 *     отклоняется, официант логинится PIN'ом и видит заказ (браузер),
 *     закрывает счёт, админ-гард держит без сессии, аудит-лог пишется,
 *     склад списывается по рецепту.
 *  5. Всё гасится и удаляется.
 */
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHmac, scryptSync, randomBytes } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PG_PORT = 54329;
const APP_PORT = 3899;
const BASE = `http://localhost:${APP_PORT}`;
const SESSION_SECRET = "e2e-secret-not-for-prod";
const ADMIN_PASSWORD = "e2e-admin-pass";
const WAITER_PIN = "4321";

const externalDb = process.env.E2E_DATABASE_URL || null;
let dataDir = null;
let appProc = null;
const cleanups = [];

const log = (s) => console.log(`  ${s}`);
const step = (s) => console.log(`\n▶ ${s}`);
let failed = 0;
function check(name, ok, extra = "") {
  if (ok) console.log(`  ✓ ${name}`);
  else {
    failed++;
    console.error(`  ✗ ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

// Тот же алгоритм, что lib/table-sign.ts — токен стола для гостя
function signTable(num, secret) {
  const sig = createHmac("sha256", secret)
    .update(`table:${num}`)
    .digest("hex")
    .slice(0, 16);
  return `${num}.${sig}`;
}

// Тот же алгоритм, что lib/staff-auth.ts — PIN официанта
function hashPin(pin) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

async function main() {
  // ── 1. База ──
  let dbUrl;
  if (externalDb) {
    step(`Внешняя тестовая БД (CI): ${externalDb.replace(/:[^:@/]+@/, ":***@")}`);
    dbUrl = externalDb;
  } else {
    step("Одноразовый Postgres");
    dataDir = mkdtempSync(join(tmpdir(), "sazanchik-e2e-pg-"));
    execSync(`initdb -D "${dataDir}" -U e2e --auth=trust -E UTF8`, { stdio: "ignore" });
    execSync(
      `pg_ctl -D "${dataDir}" -o "-p ${PG_PORT} -c listen_addresses=localhost" -l "${dataDir}/pg.log" start`,
      { stdio: "ignore" }
    );
    cleanups.push(() => {
      try { execSync(`pg_ctl -D "${dataDir}" stop -m immediate`, { stdio: "ignore" }); } catch {}
      try { rmSync(dataDir, { recursive: true, force: true }); } catch {}
    });
    execSync(`createdb -h localhost -p ${PG_PORT} -U e2e sazanchik_e2e`, { stdio: "ignore" });
    dbUrl = `postgres://e2e@localhost:${PG_PORT}/sazanchik_e2e`;
    log(`готово: ${dbUrl}`);
  }

  // Страховка: тестовая база обязана быть локальной, если не задана CI-переменная
  if (!externalDb && !dbUrl.includes("localhost")) {
    throw new Error("Отказ: тестовый URL не локальный");
  }

  const testEnv = {
    ...process.env,
    DATABASE_URL: dbUrl,
    POSTGRES_URL: dbUrl,
    DATABASE_URL_UNPOOLED: dbUrl,
    POSTGRES_URL_NON_POOLING: dbUrl,
    SESSION_SECRET,
    ADMIN_PASSWORD,
    // Внешние интеграции выключены — ничего не улетает наружу
    TELEGRAM_BOT_TOKEN: "",
    TELEGRAM_CHAT_ID: "",
    BLOB_READ_WRITE_TOKEN: "",
    SENTRY_DSN: "",
    NEXT_PUBLIC_SENTRY_DSN: "",
    PAYME_MERCHANT_ID: "",
    PAYME_KEY: "",
    CLICK_SERVICE_ID: "",
    REQUIRE_TABLE_TOKEN: "0",
    NEXT_PUBLIC_SITE_URL: BASE,
  };

  // ── 2. Схема + сид ──
  step("Схема (drizzle-kit push) и сид");
  execSync("npx drizzle-kit push --force", { cwd: ROOT, env: testEnv, stdio: "ignore" });

  const { default: postgres } = await import("postgres");
  const sql = postgres(dbUrl, { max: 1 });
  cleanups.push(() => sql.end({ timeout: 1 }).catch(() => {}));

  const [cat] = await sql`
    insert into categories (slug, name_ru, name_uz, name_en, sort_order)
    values ('e2e-hot', 'Горячее E2E', 'Issiq', 'Hot', 1) returning id`;
  const [dishPlain] = await sql`
    insert into dishes (category_id, slug, name_ru, name_uz, name_en, price, sort_order)
    values (${cat.id}, 'e2e-plov', 'Плов E2E', 'Osh', 'Plov', 50000, 1) returning id`;
  const [dishVar] = await sql`
    insert into dishes (category_id, slug, name_ru, name_uz, name_en, price, sort_order)
    values (${cat.id}, 'e2e-soup', 'Суп E2E', 'Sho''rva', 'Soup', null, 2) returning id`;
  await sql`
    insert into dish_variants (dish_id, label_ru, label_uz, label_en, price, stock_factor, sort_order)
    values (${dishVar.id}, 'малая', 'kichik', 'small', 35000, 0.5, 0),
           (${dishVar.id}, 'большая', 'katta', 'large', 50000, 1, 1)`;
  const [ing] = await sql`
    insert into ingredients (name, unit, stock, min_stock, cost_per_unit)
    values ('Рис E2E', 'kg', 100, 5, 12000) returning id`;
  await sql`
    insert into recipe_items (dish_id, ingredient_id, qty)
    values (${dishPlain.id}, ${ing.id}, 2), (${dishVar.id}, ${ing.id}, 4)`;
  await sql`
    insert into staff (name, pin_hash, role) values ('E2E Официант', ${hashPin(WAITER_PIN)}, 'waiter')`;
  log("категория, 2 блюда (одно с вариантами), рецепт, официант");

  // ── 3. Приложение ──
  step(`next dev на :${APP_PORT}`);
  appProc = spawn("npx", ["next", "dev", "-p", String(APP_PORT)], {
    cwd: ROOT,
    env: testEnv,
    stdio: "ignore",
  });
  cleanups.push(() => { try { appProc.kill("SIGTERM"); } catch {} });

  const deadline = Date.now() + 90_000;
  for (;;) {
    try {
      const r = await fetch(`${BASE}/api/orders/create`, { method: "POST", body: "{}" });
      if (r.status) break;
    } catch {}
    if (Date.now() > deadline) throw new Error("next dev не поднялся за 90с");
    await new Promise((r) => setTimeout(r, 1000));
  }
  log("сервер отвечает");

  // ── 4. Сценарии ──
  const mkLine = (slug, nameRu, price, qty) => ({
    id: slug,
    qty,
    price,
    name: { ru: nameRu, uz: nameRu, en: nameRu },
  });

  step("Гость: заказ по подписанному QR (API)");
  const goodToken = signTable("5", SESSION_SECRET);
  const orderRes = await fetch(`${BASE}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tableNumber: "5",
      tableToken: goodToken,
      lines: [mkLine("e2e-plov", "Плов E2E", 50000, 2), mkLine("e2e-soup", "Суп E2E", 35000, 1)],
    }),
  });
  const order = await orderRes.json().catch(() => ({}));
  check("заказ принят (201)", orderRes.status === 201, `got ${orderRes.status}: ${JSON.stringify(order)}`);

  // 2×50000 + 35000 = 135000; сервис 20% = 27000; итого 162000
  const [dbOrder] = await sql`select * from orders where id = ${order.id ?? "00000000-0000-0000-0000-000000000000"}`;
  check("сумма пересчитана сервером (162 000)", dbOrder?.total_price === 162000, `got ${dbOrder?.total_price}`);
  check("заказ привязан к открытому счёту стола", !!dbOrder?.session_id);

  step("Гость: подделка QR-токена отклоняется");
  const forged = await fetch(`${BASE}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tableNumber: "5",
      tableToken: "9.deadbeefdeadbeef",
      lines: [mkLine("e2e-plov", "Плов E2E", 50000, 1)],
    }),
  });
  check("403 на подделанный токен", forged.status === 403, `got ${forged.status}`);

  step("Гость: чужая цена отклоняется (серверное ценообразование)");
  const cheat = await fetch(`${BASE}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tableNumber: "5",
      tableToken: goodToken,
      lines: [mkLine("e2e-plov", "Плов E2E", 1000, 1)],
    }),
  });
  check("422 на неверную цену", cheat.status === 422, `got ${cheat.status}`);

  step("Склад: списание по рецепту с учётом фактора варианта");
  // плов 2×qty2=4 + суп «малая» (цена 35000, фактор 0.5) 1×qty4×0.5=2 → 100−6=94
  const [stock] = await sql`select stock from ingredients where id = ${ing.id}`;
  check("остаток 94 (списано 6)", Number(stock.stock) === 94, `got ${stock.stock}`);

  step("Отзывы: оценка блюда и текстовый отзыв (API)");
  const dishRate = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 5, comment: "", dishSlug: "e2e-plov", dishName: "Плов E2E" }),
  });
  check("оценка блюда принята (201)", dishRate.status === 201, `got ${dishRate.status}`);
  const textReview = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 4, comment: "Очень вкусно!", guestName: "E2E" }),
  });
  check("текстовый отзыв принят (201)", textReview.status === 201, `got ${textReview.status}`);
  const tooLong = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 4, comment: "x".repeat(101) }),
  });
  check("комментарий >100 символов отклонён (422)", tooLong.status === 422, `got ${tooLong.status}`);
  const ratings = await fetch(`${BASE}/api/dish-ratings`).then((r) => r.json());
  check("агрегат рейтинга блюда виден", ratings["e2e-plov"]?.avg === 5, JSON.stringify(ratings));
  const [rvCount] = await sql`select count(*)::int as n, bool_or(is_published) as pub from reviews`;
  check("отзывы в БД и НЕ опубликованы до модерации", rvCount.n === 2 && rvCount.pub === false, JSON.stringify(rvCount));

  step("Доставка (мини-апп): заказ с проверкой цен (API)");
  const delOk = await fetch(`${BASE}/api/delivery-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "+998901112233",
      address: "Юнусабад, 12-34, подъезд 2",
      comment: "",
      lines: [
        { slug: "e2e-plov", price: 50000, qty: 2 },
        { slug: "e2e-soup", price: 35000, qty: 1 },
      ],
    }),
  });
  const delBody = await delOk.json().catch(() => ({}));
  check("заказ доставки принят, итог посчитан сервером (135 000)", delOk.status === 201 && delBody.total === 135000, `got ${delOk.status}: ${JSON.stringify(delBody)}`);
  const delCheat = await fetch(`${BASE}/api/delivery-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "+998901112233",
      address: "Юнусабад, 12-34",
      lines: [{ slug: "e2e-plov", price: 1000, qty: 1 }],
    }),
  });
  check("чужая цена в доставке отклонена (422)", delCheat.status === 422, `got ${delCheat.status}`);
  const [dreq] = await sql`select items from delivery_requests order by created_at desc limit 1`;
  const dreqNorm = (dreq?.items ?? "").replace(/\u00a0/g, " ");
  check("заявка в БД с итогом", dreqNorm.includes("Итого: 135 000"), dreqNorm.slice(0, 80));

    step("Официант: PIN-логин и доска (браузер)");
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({ channel: "chrome" });
  cleanups.push(() => browser.close().catch(() => {}));
  const page = await browser.newPage();
  page.on("dialog", (d) => d.accept());

  // PIN-пад из кнопок; после 4-й цифры логин уходит сам
  await page.goto(`${BASE}/waiter/login`, { waitUntil: "networkidle" });
  for (const digit of WAITER_PIN) {
    await page.getByRole("button", { name: digit, exact: true }).click();
  }
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30_000 });
  check("логин по PIN прошёл", !page.url().includes("/login"), page.url());

  await page.goto(`${BASE}/waiter`, { waitUntil: "networkidle" });
  const boardText = await page.textContent("body");
  check("заказ виден на доске (Плов E2E)", boardText?.includes("Плов E2E") ?? false);

  step("Счёт: закрытие после выдачи (браузер)");
  // «кухня приготовила и выдала» — вне UI-скоупа, двигаем статус в БД
  await sql`update orders set status = 'delivered' where id = ${order.id}`;
  await page.goto(`${BASE}/waiter/bills`, { waitUntil: "networkidle" });
  const billsText = await page.textContent("body");
  check("счёт стола №5 виден с суммой", billsText?.includes("162") ?? false);
  await page.click("text=Закрыть · оплачено");
  // Ждём не по DOM, а по факту в БД — server action коммитит асинхронно
  let session;
  const closeDeadline = Date.now() + 20_000;
  for (;;) {
    [session] = await sql`select status, closed_by from table_sessions where id = ${dbOrder.session_id}`;
    if (session?.status === "closed" || Date.now() > closeDeadline) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  check("счёт закрыт официантом", session?.status === "closed" && session?.closed_by === "E2E Официант", JSON.stringify(session));

  step("Админ: гард без сессии и вход");
  const anon = await fetch(`${BASE}/admin/finance`, { redirect: "manual" });
  check("без сессии — редирект на логин", anon.status >= 300 && anon.status < 400);

  const login = await fetch(`${BASE}/admin/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
  check("логин менеджера прошёл", login.status === 200 && cookie.startsWith("sazanchik_session="));

  step("Аудит-лог: закрытие счёта записано");
  const [audit] = await sql`select actor, action from audit_log where action = 'bill.close' order by created_at desc limit 1`;
  check("bill.close от официанта в журнале", audit?.actor === "E2E Официант", JSON.stringify(audit));
  const auditPage = await fetch(`${BASE}/admin/audit`, { headers: { cookie } });
  const auditHtml = await auditPage.text();
  check("страница журнала показывает запись", auditPage.status === 200 && auditHtml.includes("E2E Официант"));

  // ── Итог ──
  console.log("");
  if (failed) {
    console.error(`✗ E2E: ${failed} провал(ов)`);
    process.exitCode = 1;
  } else {
    console.log("✓ E2E: все сценарии прошли");
  }
}

main()
  .catch((e) => {
    console.error("\n✗ E2E упал:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const fn of cleanups.reverse()) {
      try { await fn(); } catch {}
    }
  });
