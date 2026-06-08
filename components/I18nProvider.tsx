"use client";

import { useEffect, useState } from "react";
import { I18nContext, DEFAULT_LOCALE } from "@/lib/i18n";
import type { Locale } from "@/types/menu";

const STORAGE_KEY = "sazanchik:locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "ru" || saved === "uz" || saved === "en") {
      setLocaleState(saved);
    }
    setMounted(true);
  }, []);

  const setLocale = (l: Locale) => {
    const apply = () => {
      setLocaleState(l);
      localStorage.setItem(STORAGE_KEY, l);
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
