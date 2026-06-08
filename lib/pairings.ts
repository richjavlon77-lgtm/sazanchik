/**
 * Hand-curated pairings: when cart contains items from categories on the left,
 * suggest items from categories or specific dishes on the right.
 * Suggestions are ordered by relevance and de-duplicated against the cart.
 */
import type { MenuCategory } from "@/types/menu";

type PairingRule = {
  // Trigger: at least one cart item matches this category id OR specific item id
  whenCategory?: string[];
  whenItem?: string[];
  // Suggest these item ids (in priority order)
  suggest: string[];
};

export const PAIRING_RULES: PairingRule[] = [
  // Fish dishes → ayran, tea, fresh salads
  {
    whenCategory: ["fish"],
    suggest: ["salad-achichuk", "ayran", "tea-green", "fresh-orange", "katlama-patyr"],
  },
  // Steaks → red wine companions, sides, grill veg
  {
    whenCategory: ["steaks"],
    suggest: ["potato-rustic", "grilled-veg", "salad-caesar", "katlama-patyr"],
  },
  // Soups → bread, ayran
  {
    whenCategory: ["soups"],
    suggest: ["katlama-patyr", "kizil-non", "khorezm-non"],
  },
  // Manty / dough → ayran, tea
  {
    whenCategory: ["dough-dishes"],
    suggest: ["tea-assam", "salad-achichuk"],
  },
  // Grill → fresh salad, beer suggestion (cold drinks), bread
  {
    whenCategory: ["caucasian-grill"],
    suggest: ["salad-achichuk", "pushli-patyr", "drink-tassay"],
  },
  // Hot mains → side, salad, drink
  {
    whenCategory: ["hot-mains"],
    suggest: ["salad-caesar", "grilled-veg", "fresh-apple"],
  },
  // Coffee → dessert
  {
    whenCategory: ["coffee"],
    suggest: ["waffle-classic", "chak-chak", "halva"],
  },
  // Tea → dessert
  {
    whenCategory: ["tea"],
    suggest: ["waffle-classic", "chak-chak"],
  },
];

export function getRecommendations(
  menu: MenuCategory[],
  cartItemIds: Set<string>,
  cartCategoryIds: Set<string>,
  limit = 3
): { id: string; name: import("@/types/menu").Localized; price: number; categoryName: import("@/types/menu").Localized }[] {
  const flatItems = menu.flatMap((cat) =>
    cat.items.map((item) => ({ item, categoryName: cat.name }))
  );

  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const rule of PAIRING_RULES) {
    const matchesCat = rule.whenCategory?.some((c) => cartCategoryIds.has(c));
    const matchesItem = rule.whenItem?.some((i) => cartItemIds.has(i));
    if (!matchesCat && !matchesItem) continue;
    for (const id of rule.suggest) {
      if (cartItemIds.has(id) || seen.has(id)) continue;
      seen.add(id);
      suggestions.push(id);
      if (suggestions.length >= limit * 2) break;
    }
  }

  return suggestions
    .map((id) => {
      const found = flatItems.find((f) => f.item.id === id);
      if (!found) return null;
      const price =
        typeof found.item.price === "number"
          ? found.item.price
          : found.item.price[0]?.price ?? 0;
      return {
        id: found.item.id,
        name: found.item.name,
        price,
        categoryName: found.categoryName,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .slice(0, limit);
}
