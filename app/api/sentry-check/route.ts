import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Проверка мониторинга: намеренно бросает ошибку, которую должен поймать
 * Sentry (onRequestError). Только для менеджера — чужие не сожгут квоту.
 * Дёрнуть: GET /api/sentry-check под менеджерской сессией → в Sentry
 * появится issue "sentry-check".
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "manager") {
    return new Response("Not found", { status: 404 });
  }
  throw new Error(
    `sentry-check: тестовая ошибка мониторинга (${new Date().toISOString()})`
  );
}
