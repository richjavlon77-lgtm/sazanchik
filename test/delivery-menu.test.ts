import { describe, it, expect } from "vitest";
import {
  cartAdd,
  cartBump,
  cartTotal,
  cartCount,
  cartText,
  deliveryHome,
  deliveryCategory,
  deliveryCart,
  resolveCartItem,
  type CartItem,
} from "@/lib/tg/delivery-menu";
import type { MenuCategory } from "@/types/menu";

const L = (ru: string) => ({ ru, uz: ru, en: ru });
const norm = (t: string) => t.replace(/ /g, " ");
const MENU = [
  {
    id: "hot",
    name: L("Горячее"),
    items: [
      { id: "plov", name: L("Плов"), price: 85000 },
      {
        id: "soup",
        name: L("Суп"),
        price: [
          { label: L("малая"), price: 35000 },
          { label: L("большая"), price: 50000 },
        ],
      },
      { id: "stopped", name: L("Стоп"), price: 10000, outOfStock: true },
    ],
  },
] as unknown as MenuCategory[];

describe("корзина: операции", () => {
  it("добавление склеивает одинаковые, варианты — раздельно", () => {
    let c: CartItem[] = [];
    c = cartAdd(c, resolveCartItem(MENU, "plov")!.item);
    c = cartAdd(c, resolveCartItem(MENU, "plov")!.item);
    c = cartAdd(c, resolveCartItem(MENU, "soup", 0)!.item);
    c = cartAdd(c, resolveCartItem(MENU, "soup", 1)!.item);
    expect(c).toHaveLength(3);
    expect(cartCount(c)).toBe(4);
    expect(cartTotal(c)).toBe(85000 * 2 + 35000 + 50000);
    expect(c[1].name).toBe("Суп (малая)");
  });

  it("минус до нуля удаляет строку", () => {
    let c: CartItem[] = [{ slug: "plov", name: "Плов", price: 85000, qty: 1 }];
    c = cartBump(c, 0, -1);
    expect(c).toHaveLength(0);
  });

  it("текст заявки с суммами строк", () => {
    const c: CartItem[] = [{ slug: "plov", name: "Плов", price: 85000, qty: 2 }];
    expect(norm(cartText(c))).toBe("Плов ×2 — 170 000 сум");
  });
});

describe("экраны доставки", () => {
  it("главный: разделы + корзина с суммой", () => {
    const s = deliveryHome(MENU, [{ slug: "plov", name: "Плов", price: 85000, qty: 2 }]);
    const flat = s.inline.flat();
    expect(flat.some((b) => b.callback_data === "dcat_hot")).toBe(true);
    expect(norm(flat.find((b) => b.callback_data === "dcart")!.text)).toContain("(2) · 170 000 сум");
  });

  it("раздел: ➕ кнопки, вариантные ведут в выбор порции, стоп-лист скрыт", () => {
    const s = deliveryCategory(MENU, "hot", [])!;
    const flat = s.inline.flat();
    expect(flat.some((b) => b.callback_data === "dadd_plov")).toBe(true);
    expect(flat.some((b) => b.callback_data === "dvar_soup")).toBe(true);
    expect(flat.some((b) => b.callback_data?.includes("stopped"))).toBe(false);
  });

  it("корзина: ± по позициям и оформление", () => {
    const s = deliveryCart([{ slug: "plov", name: "Плов", price: 85000, qty: 2 }]);
    const flat = s.inline.flat();
    expect(flat.some((b) => b.callback_data === "dinc_0")).toBe(true);
    expect(flat.some((b) => b.callback_data === "ddec_0")).toBe(true);
    expect(flat.some((b) => b.callback_data === "dchk")).toBe(true);
    expect(norm(s.text)).toContain("Итого: <b>170 000 сум</b>");
  });

  it("пустая корзина зовёт в меню", () => {
    const s = deliveryCart([]);
    expect(s.inline.flat().some((b) => b.callback_data === "dmenu")).toBe(true);
  });
});
