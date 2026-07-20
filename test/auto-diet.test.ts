import { describe, it, expect } from "vitest";
import { enrichMenuWithDiet } from "@/lib/auto-diet";
import type { MenuCategory, MenuItem } from "@/types/menu";

function item(overrides: Partial<MenuItem> & { id: string; name: { ru: string; uz: string; en: string } }): MenuItem {
  return {
    description: undefined,
    price: 50000,
    image: undefined,
    tags: undefined,
    diet: undefined,
    spicy: undefined,
    weight: undefined,
    calories: undefined,
    allergens: undefined,
    outOfStock: false,
    ...overrides,
  };
}

function cat(
  id: string,
  name: { ru: string; uz: string; en: string },
  items: MenuItem[]
): MenuCategory {
  return { id, name, items };
}

describe("enrichMenuWithDiet", () => {
  it("preserves manually set diet tags (does not override)", () => {
    const menu = [
      cat("plov", { ru: "Плов", uz: "Palov", en: "Plov" }, [
        item({
          id: "plov-classic",
          name: { ru: "Классический плов", uz: "An'anaviy palov", en: "Classic plov" },
          diet: ["veg", "sweet"],
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].diet).toEqual(["veg", "sweet"]);
  });

  it("infers fish tag from fish category", () => {
    const menu = [
      cat("fish", { ru: "Рыба", uz: "Baliq", en: "Fish" }, [
        item({
          id: "sazan",
          name: { ru: "Сазан", uz: "Sazan", en: "Carp" },
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].diet).toContain("fish");
  });

  it("infers fish tag from name patterns", () => {
    const menu = [
      cat("hot-mains", { ru: "Горячее", uz: "Issiq", en: "Hot mains" }, [
        item({
          id: "salmon-steak",
          name: { ru: "Стейк из лосося", uz: "Losos steyk", en: "Salmon steak" },
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].diet).toContain("fish");
  });

  it("infers sweet tag from waffles category", () => {
    const menu = [
      cat("waffles", { ru: "Вафли", uz: "Vafli", en: "Waffles" }, [
        item({
          id: "belgian-waffle",
          name: { ru: "Бельгийская вафля", uz: "Belgiya vaflisi", en: "Belgian waffle" },
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].diet).toContain("sweet");
  });

  it("infers spicy from name keywords (острый)", () => {
    const menu = [
      cat("soups", { ru: "Супы", uz: "Sho'rva", en: "Soups" }, [
        item({
          id: "spicy-soup",
          name: { ru: "Острый суп", uz: "Achchiq sho'rva", en: "Spicy soup" },
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].diet).toContain("spicy");
    expect(enriched[0].items[0].spicy).toBe(2);
  });

  it("infers vegetarian for veg-friendly categories", () => {
    const menu = [
      cat("sides", { ru: "Гарниры", uz: "Garnirlar", en: "Sides" }, [
        item({
          id: "fries",
          name: { ru: "Картофель фри", uz: "Fry kartoshka", en: "French fries" },
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].diet).toContain("veg");
  });

  it("does not mark meat dishes as vegetarian", () => {
    const menu = [
      cat("grill", { ru: "Гриль", uz: "Grill", en: "Grill" }, [
        item({
          id: "lamb-kebab",
          name: { ru: "Люля-кебаб из баранины", uz: "Qo'y go'shtli lyulya", en: "Lamb kebab" },
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].diet).not.toContain("veg");
  });

  it("handles empty menu gracefully", () => {
    const enriched = enrichMenuWithDiet([]);
    expect(enriched).toEqual([]);
  });

  it("infers spicy level 3 on very hot keywords", () => {
    const menu = [
      cat("pasta", { ru: "Паста", uz: "Pasta", en: "Pasta" }, [
        item({
          id: "arrabbiata",
          name: { ru: "Паста Appaбьята", uz: "Arrabbiata", en: "Pasta arrabbiata" },
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].spicy).toBe(3);
  });

  it("does not override existing spicy level", () => {
    const menu = [
      cat("soups", { ru: "Супы", uz: "Sho'rva", en: "Soups" }, [
        item({
          id: "spicy-soup",
          name: { ru: "Острый суп", uz: "Achchiq sho'rva", en: "Spicy soup" },
          spicy: 1,
        }),
      ]),
    ];
    const enriched = enrichMenuWithDiet(menu);
    expect(enriched[0].items[0].spicy).toBe(1);
  });
});
