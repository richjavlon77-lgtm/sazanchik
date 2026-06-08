import type { DietTag, MenuItem, MenuCategory } from "@/types/menu";

// Infer a spicy level (1-3) if pattern matches
function inferSpicy(item: MenuItem, categoryId: string): 1 | 2 | 3 | undefined {
  const text =
    item.id +
    " " +
    Object.values(item.name).join(" ") +
    " " +
    (item.description ? Object.values(item.description).join(" ") : "");
  if (/arrabbiata|pepper steak|пеппер|очень острое|hot|chili/i.test(text))
    return 3;
  if (/острое|острая|острый|spicy|пряный|пряная/i.test(text)) return 2;
  if (/peppered|с перцем/i.test(text) && categoryId !== "fresh-drinks")
    return 1;
  return undefined;
}

// Categories that are entirely one diet type
const CATEGORY_DIET: Record<string, DietTag[]> = {
  fish: ["fish"],
  desserts: ["sweet"],
  waffles: ["sweet"],
};

// Heuristic ID/name patterns for fish dishes outside the "fish" category
const FISH_PATTERNS = /sazan|som|sudak|trout|salmon|sturgeon|baliq|форель|лосось|осётр|тунцом|tuna/i;

// Spicy / hot dishes — be conservative; do NOT match "pepper" alone
// since "bell pepper" / "перец" can be sweet.
const SPICY_PATTERNS = /arrabbiata|chili|spicy|pepper steak|peppered|пеппер-стейк|пеппер стейк|острый|острая|острое|achchiq/i;

// Items that are vegetarian (no meat/fish)
const VEG_NAME_PATTERNS = /pumpkin|тыкв|cheese|сыр|brynza|брынз|caprese|капрезе|hummus|хумус|burrata|буррат|tarvuz|свежее ассорти|fresh platter|fries|картофель фри|mashed|пюре|grilled veg|овощи на грил|fruit|мевал|орех|nutella|нутелла|chocolate|шокол/i;

const NON_VEG_PATTERNS = /go'sht|мясо|chicken|тов|курин|beef|мол|бар|lamb|qo'y|qazi|каз|tongue|язык|sausage|ham|liver|печ|fish|baliq|сазан|salm|лосос|tuna|тунец|trout|форел|stew/i;

function inferDiet(item: MenuItem, categoryId: string): DietTag[] {
  const tags = new Set<DietTag>(CATEGORY_DIET[categoryId] || []);

  const text =
    item.id +
    " " +
    Object.values(item.name).join(" ") +
    " " +
    (item.description ? Object.values(item.description).join(" ") : "");

  // Fish detection
  if (FISH_PATTERNS.test(text)) tags.add("fish");

  // Spicy detection
  if (SPICY_PATTERNS.test(text)) tags.add("spicy");

  // Vegetarian: no meat words, and matches at least one veg pattern OR
  // is in a known veg-friendly category
  if (!NON_VEG_PATTERNS.test(text)) {
    if (
      VEG_NAME_PATTERNS.test(text) ||
      ["sides", "bread", "tea", "coffee", "fresh-drinks", "cold-drinks", "waffles", "desserts"].includes(
        categoryId
      )
    ) {
      tags.add("veg");
    }
  }

  // Don't double-mark: if it's fish, it's not veg
  if (tags.has("fish")) tags.delete("veg");

  return Array.from(tags);
}

export function enrichMenuWithDiet(menu: MenuCategory[]): MenuCategory[] {
  return menu.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({
      ...item,
      diet: item.diet ?? inferDiet(item, cat.id),
      spicy: item.spicy ?? inferSpicy(item, cat.id),
    })),
  }));
}
