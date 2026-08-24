/**
 * Меню ДОСТАВКИ в боте — собственный интерфейс заказа, не сайт.
 * Гость листает разделы, жмёт ➕ у блюд, собирает корзину и оформляет
 * доставку не выходя из чата. Чистые функции: меню/корзина → экраны.
 *
 * callback_data: dmenu — разделы · dcat_<slug> — раздел ·
 * dadd_<slug>[_<i>] — добавить (вариант i) · dvar_<slug> — выбор порции ·
 * dcart — корзина · dinc_<n>/ddec_<n> — ± позиция n · dclr — очистить ·
 * dchk — оформить.
 */
import type { MenuCategory, Localized } from "@/types/menu";

export type CartItem = { slug: string; name: string; price: number; qty: number };
type Btn = { text: string; callback_data?: string; url?: string };
type Screen = { text: string; inline: Btn[][] };

const ru = (v: Localized | undefined) => v?.ru ?? "";
const money = (n: number) => `${n.toLocaleString("ru-RU")} сум`;
const HR = "──────────────";

// ── Корзина: чистые операции ────────────────────────────────────

export const cartTotal = (cart: CartItem[]) =>
  cart.reduce((s, i) => s + i.price * i.qty, 0);

export const cartCount = (cart: CartItem[]) =>
  cart.reduce((s, i) => s + i.qty, 0);

/** +1 позиции (склеивает одинаковые slug+price — «большая» и «малая» раздельно) */
export function cartAdd(cart: CartItem[], item: CartItem): CartItem[] {
  const i = cart.findIndex((c) => c.slug === item.slug && c.price === item.price);
  if (i === -1) return [...cart, { ...item, qty: 1 }];
  return cart.map((c, idx) => (idx === i ? { ...c, qty: c.qty + 1 } : c));
}

/** ±1 по индексу строки; qty 0 → строка удаляется */
export function cartBump(cart: CartItem[], index: number, delta: 1 | -1): CartItem[] {
  return cart
    .map((c, i) => (i === index ? { ...c, qty: c.qty + delta } : c))
    .filter((c) => c.qty > 0);
}

/** Текст заявки для менеджера и подтверждения */
export function cartText(cart: CartItem[]): string {
  return cart.map((c) => `${c.name} ×${c.qty} — ${money(c.price * c.qty)}`).join("\n");
}

// ── Кнопка корзины (общая для экранов) ──────────────────────────

const cartBtn = (cart: CartItem[]): Btn => ({
  text: cartCount(cart)
    ? `🛒 Корзина (${cartCount(cart)}) · ${money(cartTotal(cart))}`
    : "🛒 Корзина пуста",
  callback_data: "dcart",
});

// ── Экраны ──────────────────────────────────────────────────────

/** Разделы меню доставки */
export function deliveryHome(menu: MenuCategory[], cart: CartItem[]): Screen {
  const rows: Btn[][] = [];
  for (let i = 0; i < menu.length; i += 2) {
    rows.push(
      menu.slice(i, i + 2).map((c) => ({ text: ru(c.name), callback_data: `dcat_${c.id}` }))
    );
  }
  rows.push([cartBtn(cart)]);
  rows.push([{ text: "‹ В начало", callback_data: "go_home" }]);
  return {
    text: [
      "🚚 <b>ЗАКАЗ НА ДОСТАВКУ</b>",
      HR,
      "Выбирайте блюда — соберём и привезём горячим.",
      "Жмите раздел:",
    ].join("\n"),
    inline: rows,
  };
}

/** Раздел: блюда с ценами, ➕ добавляет в корзину */
export function deliveryCategory(
  menu: MenuCategory[],
  catId: string,
  cart: CartItem[]
): Screen | null {
  const cat = menu.find((c) => c.id === catId);
  if (!cat) return null;

  const items = cat.items.filter((i) => !i.outOfStock);
  const rows: Btn[][] = [];
  for (const item of items) {
    const isVar = Array.isArray(item.price);
    const label = isVar
      ? `➕ ${ru(item.name)} · порции`
      : `➕ ${ru(item.name)} — ${money(item.price as number)}`;
    rows.push([
      {
        text: label.slice(0, 60),
        callback_data: isVar ? `dvar_${item.id}` : `dadd_${item.id}`,
      },
    ]);
  }
  rows.push([{ text: "‹ Разделы", callback_data: "dmenu" }, cartBtn(cart)]);

  return {
    text: [
      `🚚 <b>${ru(cat.name).toUpperCase()}</b>`,
      HR,
      cat.intro ? `<i>${ru(cat.intro)}</i>\n` : "",
      "Жмите ➕ — блюдо ляжет в корзину:",
    ]
      .filter(Boolean)
      .join("\n"),
    inline: rows,
  };
}

/** Выбор порции вариантного блюда */
export function deliveryVariants(
  menu: MenuCategory[],
  dishId: string,
  cart: CartItem[]
): (Screen & { backTo: string }) | null {
  for (const cat of menu) {
    const item = cat.items.find((i) => i.id === dishId);
    if (!item || !Array.isArray(item.price)) continue;
    const rows: Btn[][] = item.price.map((v, i) => [
      {
        text: `➕ ${ru(v.label)} — ${money(v.price)}`,
        callback_data: `dadd_${item.id}_${i}`,
      },
    ]);
    rows.push([{ text: `‹ ${ru(cat.name).slice(0, 24)}`, callback_data: `dcat_${cat.id}` }, cartBtn(cart)]);
    return {
      text: [`<b>${ru(item.name)}</b>`, HR, "Какую порцию?"].join("\n"),
      inline: rows,
      backTo: cat.id,
    };
  }
  return null;
}

/** Найти блюдо и собрать CartItem (вариант по индексу) */
export function resolveCartItem(
  menu: MenuCategory[],
  dishId: string,
  variantIdx?: number
): { item: CartItem; catId: string } | null {
  for (const cat of menu) {
    const item = cat.items.find((i) => i.id === dishId);
    if (!item) continue;
    if (Array.isArray(item.price)) {
      const v = item.price[variantIdx ?? -1];
      if (!v) return null;
      return {
        item: { slug: item.id, name: `${ru(item.name)} (${ru(v.label)})`, price: v.price, qty: 1 },
        catId: cat.id,
      };
    }
    return {
      item: { slug: item.id, name: ru(item.name), price: item.price as number, qty: 1 },
      catId: cat.id,
    };
  }
  return null;
}

/** Корзина: позиции с ±, итог, оформление */
export function deliveryCart(cart: CartItem[]): Screen {
  if (!cart.length) {
    return {
      text: ["🛒 <b>КОРЗИНА</b>", HR, "Пока пусто. Загляните в меню — там вкусно 🐟"].join("\n"),
      inline: [[{ text: "🍽 К меню", callback_data: "dmenu" }]],
    };
  }
  const lines = ["🛒 <b>ВАША КОРЗИНА</b>", HR];
  cart.forEach((c, i) => lines.push(`${i + 1}. ${c.name} ×${c.qty} — ${money(c.price * c.qty)}`));
  lines.push(HR, `Итого: <b>${money(cartTotal(cart))}</b>`, "<i>Стоимость доставки уточнит менеджер</i>");

  const rows: Btn[][] = cart.map((c, i) => [
    { text: "➖", callback_data: `ddec_${i}` },
    { text: `${c.name.slice(0, 24)} ×${c.qty}`, callback_data: "dcart" },
    { text: "➕", callback_data: `dinc_${i}` },
  ]);
  rows.push([
    { text: "🚚 Оформить доставку", callback_data: "dchk" },
  ]);
  rows.push([
    { text: "🍽 Добавить ещё", callback_data: "dmenu" },
    { text: "🧹 Очистить", callback_data: "dclr" },
  ]);
  return { text: lines.join("\n"), inline: rows };
}
