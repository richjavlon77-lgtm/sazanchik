import * as Sentry from "@sentry/nextjs";

/**
 * Sentry в браузере гостя/персонала. Без NEXT_PUBLIC_SENTRY_DSN — no-op.
 * Дополняет ErrorReporter (Telegram): туда — «что-то сломалось у гостя»,
 * сюда — стек, группировка, breadcrumbs.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    tracesSampleRate: 0.05,
    // Реплеи только на ошибках — дешево и достаточно
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
  });
}

/** Навигации App Router в перфоманс-трейсах */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
