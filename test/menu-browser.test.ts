import { describe, it, expect } from "vitest";
import { categoriesScreen, categoryScreen, dishCard, priceLine } from "@/lib/tg/menu-browser";
import type { MenuCategory } from "@/types/menu";

const L = (ru: string) => ({ ru, uz: ru, en: ru });
/** toLocaleString("ru-RU") разделяет тысячи неразрывным пробелом */
const norm = (t: string) => t.replace(/\u00a0/g, " ");
const MENU: MenuCategory[] = [
  {
    id: "hot",
    name: L("Горячее"),
    intro: L("Наша гордость"),
    items: [
      { id: "plov", name: L("Плов"), description: L("Чайханский"), price: 85000, image: "/images/plov.jpg" },
      {
        id: "soup",
        name: L("Суп"),
        price: [
          { label: L("малая"), price: 35000 },
          { label: L("большая"), price: 50000 },
        ],
      },
    ],
  },
  { id: "salads", name: L("Салаты"), items: [{ id: "achichuk", name: L("Ачичук"), price: 25000 }] },
] as unknown as MenuCategory[];

describe("menu-browser", () => {
  it("цены: одиночная и варианты", () => {
    expect(norm(priceLine(MENU[0].items[0]))).toBe("85 000 сум");
    expect(norm(priceLine(MENU[0].items[1]))).toContain("малая — 35 000 сум");
  });

  it("экран разделов: кнопка на каждый + возврат", () => {
    const s = categoriesScreen(MENU);
    const flat = s.inline.flat();
    expect(flat.find((b) => b.callback_data === "mcat_hot")?.text).toBe("Горячее");
    expect(flat.some((b) => b.callback_data === "go_home")).toBe(true);
  });

  it("экран раздела: блюда с ценами, карточка только у блюда с фото", () => {
    const s = categoryScreen(MENU, "hot")!;
    expect(s.text).toContain("Плов");
    expect(norm(s.text)).toContain("85 000 сум");
    const flat = s.inline.flat();
    expect(flat.some((b) => b.callback_data === "mdish_plov")).toBe(true);
    expect(flat.some((b) => b.callback_data === "mdish_soup")).toBe(false);
    expect(flat.some((b) => b.callback_data === "mc")).toBe(true);
  });

  it("неизвестный раздел → null", () => {
    expect(categoryScreen(MENU, "nope")).toBeNull();
  });

  it("карточка блюда: абсолютный URL фото и кнопка назад в раздел", () => {
    const c = dishCard(MENU, "plov", "https://site.uz")!;
    expect(c.photo).toBe("https://site.uz/images/plov.jpg");
    expect(c.caption).toContain("Плов");
    expect(c.inline[0][0].callback_data).toBe("mcat_hot");
  });

  it("блюдо без фото → null", () => {
    expect(dishCard(MENU, "soup", "https://site.uz")).toBeNull();
  });
});
