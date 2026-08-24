import { MENU as STATIC_MENU } from "@/data/menu";
import { applyIntros } from "@/data/category-intros";
import { enrichMenuWithDiet } from "@/lib/auto-diet";
import { getMenuFromDb } from "@/lib/menu-from-db";
import { DeliveryApp } from "@/components/delivery/DeliveryApp";
import { TelegramMiniApp } from "@/components/TelegramMiniApp";
import type { MenuCategory } from "@/types/menu";

export const metadata = {
  title: "Доставка — Сазанчик CITY",
  description: "Закажите любимые блюда с доставкой на дом",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

/**
 * Мини-апп доставки: открывается из Telegram-бота (синяя кнопка «Меню»).
 * Отдельный контур — без вызова официанта, столов и счёта зала:
 * только выбор блюд, корзина и заявка на доставку.
 */
export default async function DeliveryPage() {
  let menu: MenuCategory[];
  try {
    const dbMenu = await getMenuFromDb();
    menu = dbMenu.length > 0 ? dbMenu : applyIntros(enrichMenuWithDiet(STATIC_MENU));
  } catch {
    menu = applyIntros(enrichMenuWithDiet(STATIC_MENU));
  }
  // В доставке нет стоп-листа и пустых разделов
  const forDelivery = menu
    .map((c) => ({ ...c, items: c.items.filter((i) => !i.outOfStock) }))
    .filter((c) => c.items.length > 0);

  return (
    <>
      <TelegramMiniApp />
      <DeliveryApp menu={forDelivery} />
    </>
  );
}
