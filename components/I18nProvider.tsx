"use client";

import { I18nContext, DEFAULT_LOCALE } from "@/lib/i18n";
import { useHydrated, useLocalString, writeLocal } from "@/lib/local-store";
import type { Locale } from "@/types/menu";

const STORAGE_KEY = "sazanchik:locale";

function isLocale(v: string | null): v is Locale {
  return v === "ru" || v === "uz" || v === "en" || v === "tr";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const mounted = useHydrated();
  const saved = useLocalString(STORAGE_KEY);
  const locale: Locale = isLocale(saved) ? saved : DEFAULT_LOCALE;

  const setLocale = (l: Locale) => {
    const apply = () => {
      writeLocal(STORAGE_KEY, l);
      document.documentElement.lang = l;
    };

    // Use View Transitions API where available (Chrome/Edge/Safari 18+)
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    if (doc.startViewTransition) {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}
