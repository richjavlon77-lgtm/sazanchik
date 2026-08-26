/**
 * Бэкап прод-БД в файл — независимо от бэкапов Neon.
 *   node scripts/backup-db.mjs            → backups/sazanchik-YYYY-MM-DD-HHmm.sql.gz
 * Держи последние копии в надёжном месте (облако/флешка).
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(name) {
  if (process.env[name]) return process.env[name];
  const s = readFileSync(join(ROOT, ".env.local"), "utf8");
  const m = s.match(new RegExp(`^${name}=(.+)$`, "m"));
  return m ? m[1].trim().replace(/^(["'])(.*)\1$/, "$2") : null;
}

const url = env("DATABASE_URL_UNPOOLED") || env("POSTGRES_URL_NON_POOLING");
if (!url) {
  console.error("Нет строки подключения к БД");
  process.exit(1);
}

// pg_dump обязан быть не старше сервера (Neon = 17+) — берём из libpq
const PG_DUMP = "/opt/homebrew/opt/libpq/bin/pg_dump";

const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
const dir = join(ROOT, "backups");
mkdirSync(dir, { recursive: true });
const raw = join(dir, `sazanchik-${stamp}.sql`);

// без pipe — чтобы ошибка pg_dump не маскировалась gzip'ом
execSync(`"${PG_DUMP}" --no-owner --no-privileges -f "${raw}" "${url}"`, {
  stdio: ["ignore", "ignore", "inherit"],
});
const bytes = Number(execSync(`stat -f %z "${raw}"`).toString().trim());
if (bytes < 50_000) {
  console.error(`✗ Подозрительно маленький дамп (${bytes} байт) — не доверяю, проверь вручную`);
  process.exit(1);
}
execSync(`gzip -f "${raw}"`);
const size = execSync(`du -h "${raw}.gz" | cut -f1`).toString().trim();
console.log(`✓ Бэкап: ${raw}.gz (${size})`);
