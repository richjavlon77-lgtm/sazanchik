/** Prep-station contours that handle a subset of an order and mark it ready.
 *  Each order item carries a `station` tag computed from its dish category. */
export type StationKey = "bar" | "hookah" | "cold" | "meat" | "kitchen";

export type StationConfig = {
  /** staff role that owns this station */
  role: "bartender" | "hookah" | "cold" | "meat" | "cook";
  loginPath: string;
  homePath: string;
  title: string;
  nameWord: string;
  icon: string;
  listLabel: string;
  readyLabel: string;
  readyToast: string;
  headerSub: string;
  emptyText: string;
};

export const STATIONS: Record<StationKey, StationConfig> = {
  bar: {
    role: "bartender",
    loginPath: "/bar/login",
    homePath: "/bar",
    title: "Бар",
    nameWord: "бармен",
    icon: "🥤",
    listLabel: "Напитки в работе",
    readyLabel: "Напитки готовы",
    readyToast: "Напитки отмечены готовыми",
    headerSub: "Живая доска напитков",
    emptyText: "Заказов на напитки нет. Доска обновляется сама.",
  },
  hookah: {
    role: "hookah",
    loginPath: "/hookah/login",
    homePath: "/hookah",
    title: "Кальянная",
    nameWord: "кальянщик",
    icon: "💨",
    listLabel: "Кальяны в работе",
    readyLabel: "Кальян готов",
    readyToast: "Кальян отмечен готовым",
    headerSub: "Живая доска кальянов",
    emptyText: "Заказов на кальян нет. Доска обновляется сама.",
  },
  cold: {
    role: "cold",
    loginPath: "/cold/login",
    homePath: "/cold",
    title: "Холодный цех",
    nameWord: "повар холодного цеха",
    icon: "🥗",
    listLabel: "Холодные в работе",
    readyLabel: "Готово",
    readyToast: "Холодные отмечены готовыми",
    headerSub: "Живая доска холодного цеха",
    emptyText: "Заказов в холодный цех нет. Доска обновляется сама.",
  },
  meat: {
    role: "meat",
    loginPath: "/meat/login",
    homePath: "/meat",
    title: "Мясной цех",
    nameWord: "повар мясного цеха",
    icon: "🥩",
    listLabel: "Мясные в работе",
    readyLabel: "Готово",
    readyToast: "Мясные отмечены готовыми",
    headerSub: "Живая доска мясного цеха",
    emptyText: "Заказов в мясной цех нет. Доска обновляется сама.",
  },
  kitchen: {
    role: "cook",
    loginPath: "/kitchen/login",
    homePath: "/kitchen",
    title: "Кухня",
    nameWord: "повар",
    icon: "🍽",
    listLabel: "Блюда в работе",
    readyLabel: "Блюдо готово",
    readyToast: "Блюдо отмечено готовым",
    headerSub: "Живая доска кухни",
    emptyText: "Заказов на кухню нет. Доска обновляется сама.",
  },
};

/** Which order column tracks "ready" for each station. */
export const STATION_READY_COLUMN: Record<
  StationKey,
  "drinksReady" | "hookahReady" | "coldReady" | "meatReady" | "foodReady"
> = {
  bar: "drinksReady",
  hookah: "hookahReady",
  cold: "coldReady",
  meat: "meatReady",
  kitchen: "foodReady",
};

/** Category slug → station. Anything unmapped falls to the kitchen. */
const CATEGORY_STATION: Record<string, StationKey> = {
  // bar
  coffee: "bar",
  tea: "bar",
  "fresh-drinks": "bar",
  "cold-drinks": "bar",
  // hookah
  hookah: "hookah",
  // cold station — cold apps & salads
  "cold-starters": "cold",
  salads: "cold",
  // meat station — all hot proteins
  "hot-starters": "meat",
  "caucasian-grill": "meat",
  steaks: "meat",
  fish: "meat",
  "hot-mains": "meat",
  // kitchen (rest) — soups, dough, sides, bread, waffles → default
};

export function stationForCategory(categorySlug: string): StationKey {
  return CATEGORY_STATION[categorySlug] ?? "kitchen";
}

/** Station of an order item — uses its stored tag, with a legacy fallback
 *  for orders created before station tagging existed. */
export function itemStation(it: {
  station?: StationKey;
  isDrink?: boolean;
  isHookah?: boolean;
}): StationKey {
  if (it.station) return it.station;
  if (it.isDrink) return "bar";
  if (it.isHookah) return "hookah";
  return "kitchen";
}
