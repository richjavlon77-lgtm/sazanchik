import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { createReviewSchema } from "@/lib/validators";
import { verifyTableToken } from "@/lib/table-sign";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { sendReviewToTelegram } from "@/lib/telegram";

/**
 * Отзыв гостя: ⭐1–5 + комментарий ≤100 символов. Публикуется на сайте
 * только после модерации в админке — сюда лишь приём и уведомление.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  // Отзывы не пишут пачками: 3 в 10 минут с IP более чем достаточно
  if (!checkRateLimit(`review-ip:${ip}`, { limit: 3, windowMs: 600_000 }).allowed) {
    return NextResponse.json(
      { error: "Слишком много отзывов подряд — спасибо, мы уже получили ваш!" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }
  const { rating, comment, guestName, tableToken } = parsed.data;
  const table = tableToken ? verifyTableToken(tableToken) : null;

  await db.insert(reviews).values({
    rating,
    comment,
    guestName: guestName || null,
    tableNumber: table,
  });

  await sendReviewToTelegram(rating, comment, guestName || null, table).catch(() => {});
  return NextResponse.json({ ok: true }, { status: 201 });
}
