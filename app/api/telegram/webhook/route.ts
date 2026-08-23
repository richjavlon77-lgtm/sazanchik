import { NextResponse } from "next/server";
import { handleUpdate, type TgUpdate } from "@/lib/tg/handlers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Webhook @Sazanchik_city_bot. Telegram присылает сюда каждое сообщение.
 * Подлинность — секрет в заголовке (задаётся при setWebhook,
 * scripts/telegram-setup.mjs). Отвечаем 200 всегда: иначе Telegram
 * зациклит ретраи одного и того же апдейта.
 */
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new NextResponse("Not found", { status: 404 });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleUpdate(update);
  } catch (e) {
    console.error("tg webhook failed:", e);
  }
  return NextResponse.json({ ok: true });
}
