import { NextResponse } from "next/server";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { deliveryRequests, dishes, dishVariants } from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { sendMessage } from "@/lib/tg/api";
import { deliveryKeyboard } from "@/lib/delivery-status";

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Некорректный телефон"),
  address: z.string().trim().min(5, "Укажите адрес подробнее").max(300),
  comment: z.string().trim().max(200).optional().or(z.literal("")),
  lines: z
    .array(
      z.object({
        slug: z.string().min(1).max(64),
        price: z.number().int().positive(),
        qty: z.number().int().min(1).max(50),
      })
    )
    .min(1, "Корзина пуста")
    .max(50),
});

/**
 * Заказ доставки из мини-аппа /delivery. Названия и цены берём ИЗ БД по
 * slug+price (клиенту не верим), заявка → delivery_requests + рабочий чат.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!checkRateLimit(`delivery-ip:${ip}`, { limit: 10, windowMs: 600_000 }).allowed) {
    return NextResponse.json({ error: "Слишком много заявок — позвоните нам" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }
  const { phone, address, comment, lines } = parsed.data;

  // Серверная сверка: блюдо существует, опубликовано, не в стопе,
  // цена — настоящая (базовая или одного из вариантов)
  const slugs = [...new Set(lines.map((l) => l.slug))];
  const dishRows = await db
    .select({
      id: dishes.id,
      slug: dishes.slug,
      nameRu: dishes.nameRu,
      price: dishes.price,
      isPublished: dishes.isPublished,
      inStock: dishes.inStock,
    })
    .from(dishes)
    .where(inArray(dishes.slug, slugs));
  const variantRows = dishRows.length
    ? await db
        .select({ dishId: dishVariants.dishId, labelRu: dishVariants.labelRu, price: dishVariants.price })
        .from(dishVariants)
        .where(inArray(dishVariants.dishId, dishRows.map((d) => d.id)))
    : [];

  const bySlug = new Map(dishRows.map((d) => [d.slug, d]));
  const parts: string[] = [];
  let total = 0;
  for (const l of lines) {
    const d = bySlug.get(l.slug);
    if (!d || !d.isPublished || !d.inStock) {
      return NextResponse.json({ error: "Часть блюд недоступна — обновите меню" }, { status: 422 });
    }
    const variant = variantRows.find((v) => v.dishId === d.id && v.price === l.price);
    const priceOk = d.price === l.price || !!variant;
    if (!priceOk) {
      return NextResponse.json({ error: "Цены обновились — обновите меню" }, { status: 422 });
    }
    const name = variant ? `${d.nameRu} (${variant.labelRu})` : d.nameRu;
    total += l.price * l.qty;
    parts.push(`${name} ×${l.qty} — ${(l.price * l.qty).toLocaleString("ru-RU")} сум`);
  }
  const itemsText =
    parts.join("\n") + `\n──────────────\nИтого: ${total.toLocaleString("ru-RU")} сум`;

  const [created] = await db
    .insert(deliveryRequests)
    .values({
      chatId: "webapp",
      phone,
      address,
      items: comment ? `${itemsText}\n💬 ${comment}` : itemsText,
    })
    .returning({ id: deliveryRequests.id });

  const workChat = process.env.TELEGRAM_CHAT_ID;
  if (workChat) {
    await sendMessage(
      workChat,
      `🚚 <b>ЗАКАЗ НА ДОСТАВКУ</b>\n📞 ${phone}\n📍 ${address}\n\n${itemsText}` +
        (comment ? `\n💬 ${comment}` : "") +
        `\n\nПерезвоните для подтверждения суммы доставки. Жмите статус:`,
      { inline: deliveryKeyboard(created.id, "new") }
    );
  }

  return NextResponse.json({ ok: true, total }, { status: 201 });
}
