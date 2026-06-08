"use client";

/**
 * Client-side i18n exports — React context and hook.
 * Re-exports pure helpers from i18n-core for ergonomics.
 */
import { createContext, useContext } from "react";
import type { Locale } from "@/types/menu";
import { DEFAULT_LOCALE } from "@/lib/i18n-core";

export {
  LOCALES,
  DEFAULT_LOCALE,
  UI_STRINGS,
  t,
  formatPrice,
} from "@/lib/i18n-core";

export type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

export const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function useLocale() {
  return useContext(I18nContext);
}
