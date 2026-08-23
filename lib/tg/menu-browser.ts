/**
 * Меню-браузер в чате: категории → раздел → карточка блюда.
 * Чистые функции: MenuCategory[] → текст + inline-кнопки. Навигация
 * редактирует одно сообщение (editMessageText) — без спама в чат.
 *
 * callback_data: "mc" — разделы, "mcat_<slug>" — раздел,
 * "mdish_<slug>" — карточка блюда (slug ≤ 34 байт, лимит TG — 64).
 */
import type { MenuCategory, MenuItem, Localized } from "@/types/menu";

type Btn = { text: string; callback_data?: string; url?: string };

const ru = (v: Localized | undefined) => v?.ru ?? "";
const money = (n: number) => `${n.toLocaleString("ru-RU")} сум`;

export function priceLine(item: MenuItem): string {
  if (Array.isArray(item.price)) {
    return item.price.map((v) => `${ru(v.label)} — ${money(v.price)}`).join(" · ");
  }
  return money(item.price as number);
}

/** Экран 1: разделы меню, кнопки по две в ряд. */
export function categoriesScreen(menu: MenuCategory[]): { text: string; inline: Btn[][] } {
  const rows: Btn[][] = [];
  for (let i = 0; i < menu.length; i += 2) {
    rows.push(
      menu.slice(i, i + 2).map((c) => ({
        text: ru(c.name),
        callback_data: `mcat_${c.id}`,
      }))
    );
  }
  rows.push([{ text: "‹ В начало", callback_data: "go_home" }]);
  return {
    text:
      "🍽 <b>МЕНЮ</b>\n" +
      "──────────────\n" +
      `${menu.length} разделов · выберите, что по душе:`,
    inline: rows,
  };
}

/** Экран 2: раздел — список блюд с ценами + карточки для блюд с фото. */
export function categoryScreen(
  menu: MenuCategory[],
  catId: string
): { text: string; inline: Btn[][] } | null {
  const cat = menu.find((c) => c.id === catId);
  if (!cat) return null;

  const lines: string[] = [`🍽 <b>${ru(cat.name).toUpperCase()}</b>`, "──────────────"];
  if (cat.intro) lines.push(`<i>${ru(cat.intro)}</i>`, "");
  for (const item of cat.items) {
    lines.push(`• <b>${ru(item.name)}</b> — ${priceLine(item)}`);
  }

  // Карточки с фото — до 6 кнопок, по 2 в ряд
  const withPhoto = cat.items.filter((i) => i.image).slice(0, 6);
  const rows: Btn[][] = [];
  for (let i = 0; i < withPhoto.length; i += 2) {
    rows.push(
      withPhoto.slice(i, i + 2).map((d) => ({
        text: `📷 ${ru(d.name).slice(0, 28)}`,
        callback_data: `mdish_${d.id}`,
      }))
    );
  }
  if (withPhoto.length) {
    lines.push("", "📷 — блюда с фото, жмите:");
  }
  rows.push([{ text: "‹ Разделы", callback_data: "mc" }]);

  return { text: lines.join("\n").slice(0, 4000), inline: rows };
}

/** Карточка блюда: фото + подпись (для sendPhoto). */
export function dishCard(
  menu: MenuCategory[],
  dishId: string,
  siteUrl: string
): { photo: string; caption: string; inline: Btn[][] } | null {
  for (const cat of menu) {
    const item = cat.items.find((i) => i.id === dishId);
    if (!item) continue;
    const photo = item.image?.startsWith("http")
      ? item.image
      : `${siteUrl}${item.image ?? ""}`;
    if (!item.image) return null;

    const parts = [
      `<b>${ru(item.name)}</b>`,
      item.description ? `<i>${ru(item.description)}</i>` : "",
      "",
      `💰 ${priceLine(item)}`,
    ].filter((s, i) => s !== "" || i === 2);
    return {
      photo,
      caption: parts.join("\n").slice(0, 1000),
      inline: [[{ text: `‹ ${ru(cat.name).slice(0, 24)}`, callback_data: `mcat_${cat.id}` }]],
    };
  }
  return null;
}
