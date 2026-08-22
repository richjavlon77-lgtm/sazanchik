import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

/**
 * Sentry-обёртка активна всегда (без DSN SDK — no-op и почти ничего не
 * весит). Сорсмапы заливаются только когда задан SENTRY_AUTH_TOKEN.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  // Гоняем ошибки через первую сторону, чтобы блокировщики не съедали их
  tunnelRoute: "/monitoring",
  disableLogger: true,
});
