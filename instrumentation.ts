import * as Sentry from "@sentry/nextjs";

/**
 * Sentry на сервере и edge. Без SENTRY_DSN — полный no-op: код готов,
 * включается одной env-переменной, когда заведём аккаунт.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? "development",
    // Ошибки шлём все; перфоманс-трейсы — выборочно, чтобы не жечь квоту
    tracesSampleRate: 0.1,
  });
}

/** Ошибки рендера/роутов App Router (RSC, route handlers, server actions). */
export const onRequestError = Sentry.captureRequestError;
