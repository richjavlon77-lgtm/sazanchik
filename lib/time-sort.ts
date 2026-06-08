import type { MenuCategory } from "@/types/menu";

/**
 * Returns a "time bucket" based on Tashkent local hour.
 */
export function getCurrentBucket(hour?: number): "morning" | "lunch" | "evening" | "night" {
  const h = hour ?? new Date().getHours();
  if (h >= 6 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 22) return "evening";
  return "night";
}

/**
 * Priority maps — higher score means more relevant at this time of day.
 * Categories not listed get 0.
 */
const PRIORITY: Record<string, Record<string, number>> = {
  morning: {
    coffee: 100,
    tea: 90,
    "fresh-drinks": 85,
    waffles: 80,
    flatbread: 60,
    bread: 50,
    "cold-starters": 30,
  },
  lunch: {
    soups: 100,
    "hot-mains": 90,
    "dough-dishes": 85,
    salads: 80,
    flatbread: 75,
    "caucasian-grill": 70,
    sides: 60,
    bread: 55,
    fish: 50,
    pasta: 45,
    tea: 30,
  },
  evening: {
    steaks: 100,
    "hot-mains": 95,
    "caucasian-grill": 95,
    fish: 90,
    salads: 80,
    "hot-starters": 75,
    "cold-starters": 70,
    pasta: 65,
    sides: 60,
    desserts: 50,
    tea: 30,
  },
  night: {
    desserts: 100,
    tea: 90,
    coffee: 80,
    "cold-drinks": 70,
    waffles: 60,
  },
};

export function sortMenuByTimeOfDay(
  menu: MenuCategory[],
  hour?: number
): MenuCategory[] {
  const bucket = getCurrentBucket(hour);
  const priorities = PRIORITY[bucket];
  const originalOrder = new Map(menu.map((c, i) => [c.id, i]));

  return [...menu].sort((a, b) => {
    const pa = priorities[a.id] ?? 0;
    const pb = priorities[b.id] ?? 0;
    if (pb !== pa) return pb - pa;
    // Stable tie-break by original order
    return (originalOrder.get(a.id) ?? 0) - (originalOrder.get(b.id) ?? 0);
  });
}
