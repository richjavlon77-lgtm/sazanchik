import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendErrorToTelegram } from "@/lib/telegram";

/** Receives client-side runtime errors and forwards them to Telegram,
 *  throttled so a recurring error can't flood the chat. Always 204 — must
 *  never surface an error to the page. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      message?: string;
      url?: string;
      ua?: string;
      stack?: string;
    };
    const message = (body.message ?? "").trim();
    if (!message) return new NextResponse(null, { status: 204 });

    // global flood cap (per serverless instance)
    if (!checkRateLimit("err:global", { limit: 20, windowMs: 60_000 }).allowed) {
      return new NextResponse(null, { status: 204 });
    }
    // dedupe the same error signature for 10 minutes
    const sig = message.slice(0, 80);
    if (!checkRateLimit(`err:${sig}`, { limit: 1, windowMs: 600_000 }).allowed) {
      return new NextResponse(null, { status: 204 });
    }

    await sendErrorToTelegram({
      message,
      url: body.url,
      ua: body.ua,
      stack: body.stack,
    });
  } catch {
    /* swallow — error reporting must not error */
  }
  return new NextResponse(null, { status: 204 });
}
