import "server-only";
import { randomBytes } from "crypto";
import { and, eq, gte, isNull, ne, sql as dsql } from "drizzle-orm";
import { db } from "@/db";
import {
  tgUsers,
  tgInvites,
  tgDialogs,
  tgCarts,
  deliveryRequests,
  dishes,
  orders,
  tableSessions,
  reservations,
} from "@/db/schema";
import {
  sendMessage,
  sendPhoto,
  editMessageText,
  answerCallback,
  clearInlineKeyboard,
  type InlineButton,
} from "@/lib/tg/api";
import { getMenuFromDb, getRestaurantFromDb } from "@/lib/menu-from-db";
import {
  categoriesScreen,
  categoryScreen,
  dishCard,
} from "@/lib/tg/menu-browser";
import {
  deliveryHome,
  deliveryCategory,
  deliveryVariants,
  deliveryCart,
  resolveCartItem,
  cartAdd,
  cartBump,
  cartText,
  cartTotal,
  type CartItem,
} from "@/lib/tg/delivery-menu";
import {
  bookingStep,
  START_REPLY,
  type BookingState,
  type BookingData,
  type FsmInput,
  type FsmReply,
} from "@/lib/tg/booking-fsm";
import {
  deliveryStep,
  DELIVERY_START,
  type DeliveryState,
  type DeliveryData,
} from "@/lib/tg/delivery-fsm";
import { tableLabel } from "@/lib/tables";
import { parseTashkentLocal } from "@/lib/tz";

/**
 * Мозг @Sazanchik_city_bot. Роли:
 *  guest → меню (WebApp), бронь, доставка;
 *  staff → + /stops, /tables;
 *  admin → + /today, /week, /team, /invite_staff;
 *  owner → + /invite_admin, /remove. Владелец один, привязывается
 *  одноразовым кодом TG_OWNER_CODE (env): /start owner_<код>.
 */

type Role = "guest" | "staff" | "admin" | "owner";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sazanchik.vercel.app";

// ── Telegram update (только нужные поля) ────────────────────────
export type TgUpdate = {
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; username?: string; first_name?: string; last_name?: string };
    text?: string;
    contact?: { phone_number: string; first_name?: string };
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string; first_name?: string; last_name?: string };
    message?: { message_id: number; chat: { id: number; type: string } };
    data?: string;
  };
};

// ── Пользователи и роли ─────────────────────────────────────────

async function upsertUser(
  chatId: string,
  from?: { username?: string; first_name?: string; last_name?: string }
): Promise<Role> {
  const name = [from?.first_name, from?.last_name].filter(Boolean).join(" ");
  const [row] = await db
    .insert(tgUsers)
    .values({ chatId, username: from?.username ?? null, name })
    .onConflictDoUpdate({
      target: tgUsers.chatId,
      set: { username: from?.username ?? null, name, updatedAt: new Date() },
    })
    .returning({ role: tgUsers.role });
  return row.role;
}

const todayTashkent = () =>
  new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 10);

// ── Главное меню гостя ──────────────────────────────────────────

function guestMenu(): InlineButton[][] {
  return [
    [{ text: "🚚 Заказать доставку", callback_data: "dmenu" }],
    [
      { text: "🍽 Посмотреть меню", callback_data: "mc" },
      { text: "📅 Бронь стола", callback_data: "go_book" },
    ],
    [{ text: "📞 Контакты", callback_data: "go_contacts" }],
  ];
}

const WELCOME =
  "🐟 <b>САЗАНЧИК CITY</b>\n" +
  "──────────────\n" +
  "<i>В лучших традициях узбекской кухни\nс нотками европейской изысканности</i>\n\n" +
  "📍 Ташкент · ⏰ 10:00–23:00";

/** Приветствие с фирменной обложкой; фолбэк — текст, если фото не ушло. */
async function sendWelcome(chatId: string) {
  const ok = await sendPhoto(chatId, `${SITE()}/og-image.png`, WELCOME, guestMenu());
  if (!ok) await sendMessage(chatId, WELCOME, { inline: guestMenu() });
}

// ── Диалоги (бронь/доставка) ────────────────────────────────────

async function setDialog(chatId: string, state: string, data: Record<string, unknown>) {
  await db
    .insert(tgDialogs)
    .values({ chatId, state, data })
    .onConflictDoUpdate({
      target: tgDialogs.chatId,
      set: { state, data, updatedAt: new Date() },
    });
}

const clearDialog = (chatId: string) =>
  db.delete(tgDialogs).where(eq(tgDialogs.chatId, chatId));

// ── Корзина доставки ────────────────────────────────────────────

async function getCart(chatId: string): Promise<CartItem[]> {
  const [row] = await db.select().from(tgCarts).where(eq(tgCarts.chatId, chatId));
  return row?.items ?? [];
}

async function saveCart(chatId: string, items: CartItem[]) {
  await db
    .insert(tgCarts)
    .values({ chatId, items })
    .onConflictDoUpdate({ target: tgCarts.chatId, set: { items, updatedAt: new Date() } });
}

async function sendFsmReply(chatId: string, reply: FsmReply) {
  await sendMessage(chatId, reply.text, {
    inline: reply.inline,
    keyboard: reply.askContact
      ? [[{ text: "📱 Поделиться номером", request_contact: true }]]
      : undefined,
    removeKeyboard: !reply.askContact && !reply.inline ? true : undefined,
  });
}

// ── Отчёты ──────────────────────────────────────────────────────

const money = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} сум`;

async function reportToday(): Promise<string> {
  const TZ = "Asia/Tashkent";
  const [rev] = (await db.execute(dsql`
    select coalesce(sum(total_price),0)::bigint as revenue, count(*)::int as cnt
    from orders
    where status <> 'cancelled'
      and (created_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ})
  `)) as unknown as { revenue: string; cnt: number }[];
  const top = (await db.execute(dsql`
    select elem->>'nameRu' as name, sum((elem->>'quantity')::int)::int as qty
    from orders o
    cross join lateral jsonb_array_elements(coalesce(o.items_snapshot,'[]'::jsonb)) elem
    where o.status <> 'cancelled'
      and (o.created_at at time zone ${TZ}) >= date_trunc('day', now() at time zone ${TZ})
    group by 1 order by 2 desc limit 5
  `)) as unknown as { name: string; qty: number }[];

  const revenue = Number(rev.revenue);
  const cnt = rev.cnt;
  const lines = [
    `📊 <b>Сегодня</b>`,
    `Выручка: <b>${money(revenue)}</b>`,
    `Заказов: ${cnt}${cnt ? ` · средний чек ${money(revenue / cnt)}` : ""}`,
  ];
  if (top.length) {
    lines.push("", "🏆 Топ блюд:");
    top.forEach((t, i) => lines.push(`${i + 1}. ${t.name} ×${t.qty}`));
  }
  return lines.join("\n");
}

async function reportWeek(): Promise<string> {
  const [rev] = (await db.execute(dsql`
    select coalesce(sum(total_price),0)::bigint as revenue, count(*)::int as cnt
    from orders
    where status <> 'cancelled' and created_at >= now() - interval '7 days'
  `)) as unknown as { revenue: string; cnt: number }[];
  const revenue = Number(rev.revenue);
  return [
    `📈 <b>За 7 дней</b>`,
    `Выручка: <b>${money(revenue)}</b>`,
    `Заказов: ${rev.cnt}${rev.cnt ? ` · средний чек ${money(revenue / rev.cnt)}` : ""}`,
  ].join("\n");
}

async function reportStops(): Promise<string> {
  const rows = await db
    .select({ name: dishes.nameRu })
    .from(dishes)
    .where(and(eq(dishes.isPublished, true), eq(dishes.inStock, false)));
  if (!rows.length) return "✅ Стоп-лист пуст — всё в наличии.";
  return ["⛔ <b>Стоп-лист</b>", "", ...rows.map((r) => `• ${r.name}`)].join("\n");
}

async function reportTables(): Promise<string> {
  const sessions = await db
    .select({ id: tableSessions.id, table: tableSessions.tableNumber })
    .from(tableSessions)
    .where(eq(tableSessions.status, "open"));
  if (!sessions.length) return "Открытых столов нет.";
  const lines = ["🍽 <b>Открытые столы</b>", ""];
  for (const s of sessions) {
    const rows = await db
      .select({ total: orders.totalPrice })
      .from(orders)
      .where(and(eq(orders.sessionId, s.id), ne(orders.status, "cancelled")));
    const total = rows.reduce((a, r) => a + r.total, 0);
    lines.push(`${tableLabel(s.table)} — ${money(total)} (${rows.length} зак.)`);
  }
  return lines.join("\n");
}

async function reportBookings(): Promise<string> {
  const rows = await db
    .select()
    .from(reservations)
    .where(
      and(gte(reservations.reservedAt, new Date()), ne(reservations.status, "cancelled"))
    )
    .orderBy(reservations.reservedAt)
    .limit(15);
  if (!rows.length) return "Предстоящих броней нет.";
  const fmt = (d: Date) =>
    new Date(d).toLocaleString("ru-RU", {
      timeZone: "Asia/Tashkent",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  return [
    "📅 <b>Ближайшие брони</b>",
    "",
    ...rows.map(
      (r) =>
        `${fmt(r.reservedAt)} · ${r.name} · ${r.guests} гост.` +
        (r.tableNumber ? ` · ${tableLabel(r.tableNumber)}` : "")
    ),
  ].join("\n");
}

async function reportTeam(): Promise<string> {
  const rows = await db
    .select()
    .from(tgUsers)
    .where(ne(tgUsers.role, "guest"))
    .orderBy(tgUsers.role);
  const icon: Record<Role, string> = { owner: "👑", admin: "⭐", staff: "👨‍🍳", guest: "" };
  const lines = ["👥 <b>Команда в боте</b>", ""];
  for (const u of rows) {
    lines.push(
      `${icon[u.role]} ${u.name || "Без имени"}${u.username ? ` @${u.username}` : ""} — ${u.role} · id <code>${u.chatId}</code>`
    );
  }
  lines.push("", "Убрать: /remove &lt;id&gt;");
  return lines.join("\n");
}

// ── Приглашения ─────────────────────────────────────────────────

async function makeInvite(role: "staff" | "admin", createdBy: string): Promise<string> {
  const code = randomBytes(6).toString("hex");
  await db.insert(tgInvites).values({ code, role, createdBy });
  const label = role === "admin" ? "администратора" : "работника";
  return (
    `Приглашение для ${label} — отправьте человеку эту ссылку:\n\n` +
    `https://t.me/Sazanchik_city_bot?start=inv_${code}\n\n` +
    `Код одноразовый.`
  );
}

async function redeemInvite(code: string, chatId: string): Promise<Role | null> {
  const [inv] = await db
    .update(tgInvites)
    .set({ usedBy: chatId, usedAt: new Date() })
    .where(and(eq(tgInvites.code, code), isNull(tgInvites.usedBy)))
    .returning({ role: tgInvites.role });
  if (!inv) return null;
  await db.update(tgUsers).set({ role: inv.role, updatedAt: new Date() }).where(eq(tgUsers.chatId, chatId));
  return inv.role;
}

// ── Уведомление рабочего чата ───────────────────────────────────

async function notifyWorkChat(text: string) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (chatId) await sendMessage(chatId, text);
}

// ── Главный обработчик ──────────────────────────────────────────

export async function handleUpdate(update: TgUpdate): Promise<void> {
  // callback-кнопки
  if (update.callback_query) {
    const cq = update.callback_query;
    const chat = cq.message?.chat;
    if (!chat || chat.type !== "private") {
      await answerCallback(cq.id);
      return;
    }
    const chatId = String(chat.id);
    await upsertUser(chatId, cq.from);
    await answerCallback(cq.id);
    const data = cq.data ?? "";
    const messageId = cq.message?.message_id;

    // Навигация меню/корзины редактирует то же сообщение — клавиатуру не трогаем
    if (data === "mc" || data.startsWith("mcat_") || data.startsWith("mdish_") || data === "go_home") {
      await handleMenuNav(chatId, messageId, data);
      return;
    }
    if (data.startsWith("d") && data !== "dl_ok" && data !== "dl_cancel") {
      await handleDeliveryNav(chatId, messageId, data);
      return;
    }

    if (messageId) await clearInlineKeyboard(chatId, messageId);
    await routeInput(chatId, { kind: "callback", data });
    return;
  }

  const msg = update.message;
  if (!msg || msg.chat.type !== "private") return; // группы не обрабатываем
  const chatId = String(msg.chat.id);
  const role = await upsertUser(chatId, msg.from);
  const text = (msg.text ?? "").trim();

  // контакт (кнопка «Поделиться номером»)
  if (msg.contact) {
    await routeInput(chatId, {
      kind: "contact",
      phone: msg.contact.phone_number,
      name: msg.contact.first_name,
    });
    return;
  }

  // ── Команды ──
  if (text.startsWith("/")) {
    const [cmd, ...args] = text.split(/\s+/);
    const arg = args.join(" ");
    switch (cmd.toLowerCase().replace(/@sazanchik_city_bot$/, "")) {
      case "/start": {
        // deep-link: приглашение или владелец
        if (arg.startsWith("inv_")) {
          const got = await redeemInvite(arg.slice(4), chatId);
          if (got) {
            await sendMessage(
              chatId,
              got === "admin"
                ? "⭐ Вы теперь <b>администратор</b>. Команды: /today /week /stops /tables /bookings /team /invite_staff"
                : "👨‍🍳 Вы в команде! Команды: /stops /tables /bookings"
            );
            await notifyWorkChat(`👥 Новый ${got === "admin" ? "админ" : "сотрудник"} в боте: ${msg.from?.first_name ?? ""} @${msg.from?.username ?? "—"}`);
            return;
          }
          await sendMessage(chatId, "Ссылка-приглашение уже использована или неверна.");
          return;
        }
        if (arg.startsWith("owner_") || arg.startsWith("owner ")) {
          const code = arg.slice(6);
          if (code && code === process.env.TG_OWNER_CODE) {
            const [existing] = await db.select().from(tgUsers).where(eq(tgUsers.role, "owner"));
            if (existing && existing.chatId !== chatId) {
              await sendMessage(chatId, "Владелец уже назначен.");
              return;
            }
            await db.update(tgUsers).set({ role: "owner", updatedAt: new Date() }).where(eq(tgUsers.chatId, chatId));
            await sendMessage(
              chatId,
              "👑 Вы — <b>владелец</b>. Всё в ваших руках:\n\n" +
                "📊 /today /week — выручка и топ\n📅 /bookings — брони\n⛔ /stops — стоп-лист\n🍽 /tables — открытые столы\n" +
                "👥 /team — команда\n➕ /invite_staff /invite_admin — приглашения\n➖ /remove &lt;id&gt; — убрать из команды"
            );
            return;
          }
        }
        await clearDialog(chatId);
        await sendWelcome(chatId);
        return;
      }
      case "/menu": {
        const menu = await getMenuFromDb();
        const scr = categoriesScreen(menu);
        await sendMessage(chatId, scr.text, { inline: scr.inline });
        return;
      }
      case "/book":
        await setDialog(chatId, "bk:name", {});
        await sendFsmReply(chatId, START_REPLY);
        return;
      case "/delivery": {
        const menu = await getMenuFromDb();
        const scr = deliveryHome(menu, await getCart(chatId));
        await sendMessage(chatId, scr.text, { inline: scr.inline });
        return;
      }
      case "/cancel":
      case "/отмена":
        await clearDialog(chatId);
        await sendMessage(chatId, "Ок, отменил. /start — главное меню.", { removeKeyboard: true });
        return;

      // ── staff+ ──
      case "/stops":
        if (role === "guest") break;
        await sendMessage(chatId, await reportStops());
        return;
      case "/tables":
        if (role === "guest") break;
        await sendMessage(chatId, await reportTables());
        return;
      case "/bookings":
        if (role === "guest") break;
        await sendMessage(chatId, await reportBookings());
        return;

      // ── admin+ ──
      case "/today":
        if (role !== "admin" && role !== "owner") break;
        await sendMessage(chatId, await reportToday());
        return;
      case "/week":
        if (role !== "admin" && role !== "owner") break;
        await sendMessage(chatId, await reportWeek());
        return;
      case "/team":
        if (role !== "admin" && role !== "owner") break;
        await sendMessage(chatId, await reportTeam());
        return;
      case "/invite_staff":
        if (role !== "admin" && role !== "owner") break;
        await sendMessage(chatId, await makeInvite("staff", chatId));
        return;

      // ── owner ──
      case "/invite_admin":
        if (role !== "owner") break;
        await sendMessage(chatId, await makeInvite("admin", chatId));
        return;
      case "/remove": {
        if (role !== "owner") break;
        const target = arg.trim();
        if (!target) {
          await sendMessage(chatId, "Кого убрать? /remove &lt;id из /team&gt;");
          return;
        }
        if (target === chatId) {
          await sendMessage(chatId, "Себя убрать нельзя 🙂");
          return;
        }
        const [gone] = await db
          .update(tgUsers)
          .set({ role: "guest", updatedAt: new Date() })
          .where(and(eq(tgUsers.chatId, target), ne(tgUsers.role, "owner")))
          .returning({ name: tgUsers.name });
        await sendMessage(chatId, gone ? `Готово: ${gone.name || target} теперь гость.` : "Не нашёл такого id в команде.");
        return;
      }
    }
    // неизвестная команда / нет прав → главное меню
    await sendWelcome(chatId);
    return;
  }

  // обычный текст → в активный диалог
  await routeInput(chatId, { kind: "text", text });
}

// ── Меню-браузер ────────────────────────────────────────────────

async function handleMenuNav(
  chatId: string,
  messageId: number | undefined,
  data: string
): Promise<void> {
  if (data === "go_home") {
    if (messageId) await clearInlineKeyboard(chatId, messageId);
    await sendWelcome(chatId);
    return;
  }

  const menu = await getMenuFromDb();

  if (data.startsWith("mdish_")) {
    const card = dishCard(menu, data.slice(6), SITE());
    if (card) {
      await sendPhoto(chatId, card.photo, card.caption, card.inline);
    }
    return;
  }

  const screen = data.startsWith("mcat_")
    ? (categoryScreen(menu, data.slice(5)) ?? categoriesScreen(menu))
    : categoriesScreen(menu);

  // Пытаемся отредактировать текущее сообщение; из фото-приветствия
  // текст не редактируется — шлём новое
  const edited = messageId
    ? await editMessageText(chatId, messageId, screen.text, screen.inline)
    : false;
  if (!edited) await sendMessage(chatId, screen.text, { inline: screen.inline });
}

// ── Меню доставки с корзиной ────────────────────────────────────

async function showDeliveryScreen(
  chatId: string,
  messageId: number | undefined,
  screen: { text: string; inline: InlineButton[][] }
) {
  const edited = messageId
    ? await editMessageText(chatId, messageId, screen.text, screen.inline)
    : false;
  if (!edited) await sendMessage(chatId, screen.text, { inline: screen.inline });
}

async function handleDeliveryNav(
  chatId: string,
  messageId: number | undefined,
  data: string
): Promise<void> {
  const menu = await getMenuFromDb();
  let cart = await getCart(chatId);

  if (data === "dmenu") {
    await showDeliveryScreen(chatId, messageId, deliveryHome(menu, cart));
    return;
  }
  if (data.startsWith("dcat_")) {
    const scr = deliveryCategory(menu, data.slice(5), cart) ?? deliveryHome(menu, cart);
    await showDeliveryScreen(chatId, messageId, scr);
    return;
  }
  if (data.startsWith("dvar_")) {
    const scr = deliveryVariants(menu, data.slice(5), cart);
    await showDeliveryScreen(chatId, messageId, scr ?? deliveryHome(menu, cart));
    return;
  }
  if (data.startsWith("dadd_")) {
    // dadd_<slug> или dadd_<slug>_<i>
    const m = data.slice(5).match(/^(.+?)(?:_(\d+))?$/);
    const found = m ? resolveCartItem(menu, m[1], m[2] ? Number(m[2]) : undefined) : null;
    if (found) {
      cart = cartAdd(cart, found.item);
      await saveCart(chatId, cart);
      // остаёмся в разделе — счётчик корзины обновится в кнопках
      const scr = deliveryCategory(menu, found.catId, cart) ?? deliveryHome(menu, cart);
      await showDeliveryScreen(chatId, messageId, scr);
    }
    return;
  }
  if (data === "dcart") {
    await showDeliveryScreen(chatId, messageId, deliveryCart(cart));
    return;
  }
  if (data.startsWith("dinc_") || data.startsWith("ddec_")) {
    const idx = Number(data.slice(5));
    if (Number.isInteger(idx)) {
      cart = cartBump(cart, idx, data.startsWith("dinc_") ? 1 : -1);
      await saveCart(chatId, cart);
    }
    await showDeliveryScreen(chatId, messageId, deliveryCart(cart));
    return;
  }
  if (data === "dclr") {
    await saveCart(chatId, []);
    await showDeliveryScreen(chatId, messageId, deliveryCart([]));
    return;
  }
  if (data === "dchk") {
    if (!cart.length) {
      await showDeliveryScreen(chatId, messageId, deliveryCart([]));
      return;
    }
    // корзина → диалог: телефон → адрес → подтверждение
    const items = `🍽 <b>Заказ:</b>\n${cartText(cart)}\n${"─".repeat(14)}\nИтого: <b>${cartTotal(cart).toLocaleString("ru-RU")} сум</b>`;
    await setDialog(chatId, "dl:phone", { items });
    await sendFsmReply(chatId, DELIVERY_START);
    return;
  }
}

// ── Роутинг в диалоги ───────────────────────────────────────────

async function routeInput(
  chatId: string,
  input: FsmInput | { kind: "contact"; phone: string; name?: string }
): Promise<void> {
  // кнопки главного меню
  if (input.kind === "callback") {
    if (input.data === "go_book") {
      await setDialog(chatId, "bk:name", {});
      await sendFsmReply(chatId, START_REPLY);
      return;
    }
    if (input.data === "go_delivery") {
      const menu = await getMenuFromDb();
      const scr = deliveryHome(menu, await getCart(chatId));
      await sendMessage(chatId, scr.text, { inline: scr.inline });
      return;
    }
    if (input.data === "go_contacts") {
      let phone = "+998 92 001 78 78";
      let address = "Ташкент";
      let hours = "Ежедневно 10:00–23:00";
      let instagram = "";
      try {
        const r = await getRestaurantFromDb();
        if (r) {
          phone = r.phone || phone;
          address = r.address?.ru || address;
          hours = r.workingHours?.ru || hours;
          instagram = r.instagram ?? "";
        }
      } catch {
        /* дефолты выше */
      }
      const ig = instagram.replace(/^@/, "");
      await sendMessage(
        chatId,
        [
          "📞 <b>КОНТАКТЫ</b>",
          "──────────────",
          `☎️ <a href="tel:${phone.replace(/[^+\d]/g, "")}">${phone}</a>`,
          `📍 ${address}`,
          `⏰ ${hours}`,
          "",
          "Ждём вас в «Сазанчике»! 🐟",
        ].join("\n"),
        {
          inline: [
            [
              ...(ig ? [{ text: "📸 Instagram", url: `https://instagram.com/${ig}` }] : []),
              { text: "🌐 Сайт", url: SITE() },
            ],
            [{ text: "‹ В начало", callback_data: "go_home" }],
          ],
        }
      );
      return;
    }
  }

  const [dialog] = await db.select().from(tgDialogs).where(eq(tgDialogs.chatId, chatId));
  if (!dialog) {
    if (input.kind === "text") await sendWelcome(chatId);
    return;
  }

  // ── бронь ──
  if (dialog.state.startsWith("bk:")) {
    const res = bookingStep(
      dialog.state.slice(3) as BookingState,
      dialog.data as BookingData,
      input as FsmInput,
      todayTashkent()
    );
    if ("cancelled" in res) {
      await clearDialog(chatId);
      await sendFsmReply(chatId, res.reply);
      return;
    }
    if (res.done) {
      await clearDialog(chatId);
      const b = res.booking;
      const reservedAt = parseTashkentLocal(`${b.date}T${b.time}`);
      await db.insert(reservations).values({
        name: b.name,
        phone: b.phone,
        guests: b.guests,
        reservedAt,
        comment: "Бронь через Telegram-бот",
      });
      await notifyWorkChat(
        `📅 <b>Новая бронь (бот)</b>\n${b.name} · ${b.phone}\n${b.date.split("-").reverse().join(".")} в ${b.time} · ${b.guests} гост.`
      );
      await sendFsmReply(chatId, res.reply);
      return;
    }
    await setDialog(chatId, `bk:${res.state}`, res.data);
    await sendFsmReply(chatId, res.reply);
    return;
  }

  // ── доставка ──
  if (dialog.state.startsWith("dl:")) {
    const res = deliveryStep(
      dialog.state.slice(3) as DeliveryState,
      dialog.data as DeliveryData,
      input as FsmInput
    );
    if ("cancelled" in res) {
      await clearDialog(chatId);
      await sendFsmReply(chatId, res.reply);
      return;
    }
    if (res.done) {
      await clearDialog(chatId);
      const r = res.request;
      await db.insert(deliveryRequests).values({
        chatId,
        phone: r.phone,
        address: r.address,
        items: r.items,
      });
      await saveCart(chatId, []);
      await notifyWorkChat(
        `🚚 <b>ЗАЯВКА НА ДОСТАВКУ</b>\n📞 ${r.phone}\n📍 ${r.address}\n🍽 ${r.items}\n\nПерезвоните клиенту в течение 10 минут!`
      );
      await sendFsmReply(chatId, res.reply);
      return;
    }
    await setDialog(chatId, `dl:${res.state}`, res.data);
    await sendFsmReply(chatId, res.reply);
    return;
  }

  await clearDialog(chatId);
}
