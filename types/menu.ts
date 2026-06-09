export type Locale = "ru" | "uz" | "en";

export type Localized = Record<Locale, string>;

export type Price = number | { label: Localized; price: number }[];

export type DietTag = "veg" | "fish" | "spicy" | "alcohol" | "sweet";

export type MenuItem = {
  id: string;
  name: Localized;
  description?: Localized;
  price: Price;
  image?: string;
  tags?: Localized[];
  diet?: DietTag[];
  /** 1 = mild, 2 = medium, 3 = very hot */
  spicy?: 1 | 2 | 3;
  weight?: string;
  calories?: number;
  allergens?: string[];
};

export type MenuCategory = {
  id: string;
  name: Localized;
  /** Editorial intro shown above items — short story from the chef */
  intro?: Localized;
  items: MenuItem[];
};

export type RestaurantInfo = {
  name: string;
  tagline: Localized;
  address: Localized;
  phone: string;
  workingHours: Localized;
  instagram: string;
};
