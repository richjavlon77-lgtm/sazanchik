"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { readLocal, useLocalString, writeLocal } from "@/lib/local-store";

type FavoritesContextValue = {
  favorites: Set<string>;
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
  count: number;
};

const STORAGE_KEY = "sazanchik:favorites";

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function parseFavorites(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const v = JSON.parse(raw);
    return new Set(Array.isArray(v) ? (v as string[]) : []);
  } catch {
    return new Set();
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  // Favorites live in localStorage, read via useSyncExternalStore (SSR-safe,
  // synced across tabs).
  const raw = useLocalString(STORAGE_KEY);
  const favorites = useMemo(() => parseFavorites(raw), [raw]);

  const toggle = useCallback((id: string) => {
    const next = parseFavorites(readLocal(STORAGE_KEY));
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeLocal(STORAGE_KEY, JSON.stringify(Array.from(next)));
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggle, isFavorite, count: favorites.size }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}
