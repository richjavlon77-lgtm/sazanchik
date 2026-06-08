"use client";

import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { useContent } from "@/lib/content-context";

export function Footer() {
  const { locale } = useLocale();
  const { restaurant: RESTAURANT } = useContent();

  return (
    <footer className="mt-20 border-t border-border pt-12 pb-10">
      <div className="mx-auto max-w-3xl px-1">
        <div className="text-center">
          <div className="font-heading text-3xl text-gold">
            <span className="italic">С</span>азанчик
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(RESTAURANT.tagline, locale)}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold">
              {t(UI_STRINGS.address, locale)}
            </div>
            <p className="text-muted-foreground">{t(RESTAURANT.address, locale)}</p>
          </div>
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold">
              {t(UI_STRINGS.hours, locale)}
            </div>
            <p className="text-muted-foreground">
              {t(RESTAURANT.workingHours, locale)}
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold">
              {t(UI_STRINGS.contacts, locale)}
            </div>
            <a
              href={`tel:${RESTAURANT.phone.replace(/\s/g, "")}`}
              className="block text-muted-foreground hover:text-gold transition-colors"
            >
              {RESTAURANT.phone}
            </a>
            <a
              href={`https://instagram.com/${RESTAURANT.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="block text-muted-foreground hover:text-gold transition-colors"
            >
              {RESTAURANT.instagram}
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-px w-12 bg-border" />
          <span>© {new Date().getFullYear()} Sazanchik</span>
        </div>
      </div>
    </footer>
  );
}
