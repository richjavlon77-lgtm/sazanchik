import "server-only";

/**
 * Тонкая обёртка Telegram Bot API для @Sazanchik_city_bot.
 * Все вызовы best-effort: сбой Telegram не должен ронять webhook
 * (Telegram ретраит доставку сам, а мы всегда отвечаем 200).
 */

const API = () =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export type InlineButton = {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
};

async function call(method: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${API()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`tg ${method} failed:`, res.status, await res.text());
    }
    return res.ok;
  } catch (e) {
    console.error(`tg ${method} error:`, e);
    return false;
  }
}

export function sendMessage(
  chatId: string | number,
  text: string,
  opts?: {
    inline?: InlineButton[][];
    /** reply-клавиатура (кнопки под полем ввода) */
    keyboard?: { text: string; request_contact?: boolean }[][];
    removeKeyboard?: boolean;
  }
) {
  const reply_markup = opts?.inline
    ? { inline_keyboard: opts.inline }
    : opts?.keyboard
      ? { keyboard: opts.keyboard, resize_keyboard: true, one_time_keyboard: true }
      : opts?.removeKeyboard
        ? { remove_keyboard: true }
        : undefined;
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(reply_markup ? { reply_markup } : {}),
  });
}

export function answerCallback(callbackQueryId: string, text?: string) {
  return call("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

/** Отредактировать текст+кнопки сообщения (навигация меню без спама). */
export function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  inline?: InlineButton[][]
) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: inline ?? [] },
  });
}

/** Фото с подписью и кнопками (обложка, карточка блюда). */
export function sendPhoto(
  chatId: string | number,
  photoUrl: string,
  caption: string,
  inline?: InlineButton[][]
) {
  return call("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
    ...(inline ? { reply_markup: { inline_keyboard: inline } } : {}),
  });
}

/** Заменить инлайн-кнопки сообщения (текст не трогается). */
export function editMessageReplyMarkup(
  chatId: string | number,
  messageId: number,
  inline: InlineButton[][]
) {
  return call("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: inline },
  });
}

/** Убрать инлайн-кнопки у сообщения (после выбора), не трогая текст. */
export const clearInlineKeyboard = (chatId: string | number, messageId: number) =>
  editMessageReplyMarkup(chatId, messageId, []);
