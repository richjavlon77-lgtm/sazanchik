"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n";

type MenuContextValue = {
  query: string;
  setQuery: (q: string) => void;
  activeDiets: string[];
  toggleDiet: (tag: string) => void;
  menu: MenuCategory[];
  filteredMenu: MenuCategory[];
  totalShown: number;
  totalAll: number;
  isFiltering: boolean;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({
  menu,
  children,
}: {
  menu: MenuCategory[];
  children: React.ReactNode;
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [activeDiets, setActiveDiets] = useState<string[]>([]);

  const toggleDiet = (tag: string) =>
    setActiveDiets((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const normalized = query.trim().toLowerCase();
  const isFiltering = normalized.length > 0 || activeDiets.length > 0;

  const filteredMenu = useMemo(() => {
    if (normalized.length === 0 && activeDiets.length === 0) return menu;

    const matchesDiet = (item: MenuItem) =>
      activeDiets.length === 0 ||
      activeDiets.some((tag) =>
        tag === "spicy" ? !!item.spicy : item.diet?.includes(tag as never)
      );

    const matches = (item: MenuItem) => {
      const haystack = [
        t(item.name, "ru"),
        t(item.name, "uz"),
        t(item.name, "en"),
        item.name.tr ?? "",
        item.description ? t(item.description, "ru") : "",
        item.description ? t(item.description, "uz") : "",
        item.description ? t(item.description, "en") : "",
        item.description?.tr ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    };

    return menu
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((it) => matches(it) && matchesDiet(it)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [menu, normalized, activeDiets]);

  const totalAll = useMemo(
    () => menu.reduce((acc, c) => acc + c.items.length, 0),
    [menu]
  );

  const totalShown = useMemo(
    () => filteredMenu.reduce((acc, c) => acc + c.items.length, 0),
    [filteredMenu]
  );

  // Reset query on locale change is intentionally NOT done — search persists
  void locale;

  return (
    <MenuContext.Provider
      value={{
        query,
        setQuery,
        activeDiets,
        toggleDiet,
        menu,
        filteredMenu,
        totalShown,
        totalAll,
        isFiltering,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used inside MenuProvider");
  return ctx;
}

/** Like useMenu(), but returns null instead of throwing outside a
 *  MenuProvider — for shared chrome (e.g. CartBar) mounted on pages
 *  (like /print) that never wrap their content in one. */
export function useMenuOptional() {
  return useContext(MenuContext);
}

// Helper hook to debounce input
export function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

// Helper to subscribe to query setter from outside
export function useSetQuery() {
  const ctx = useContext(MenuContext);
  return useCallback((q: string) => ctx?.setQuery(q), [ctx]);
}
