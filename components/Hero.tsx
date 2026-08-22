"use client";

import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { useContent } from "@/lib/content-context";
import { useTableNumber } from "@/lib/table";
import { guestTableLabel } from "@/lib/tables";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ReservationSheet } from "@/components/ReservationSheet";
import { SazanFish } from "@/components/icons/SazanFish";

/**
 * Flat, light "guest header": brand row + big «Меню» title + table pill +
 * working hours + reserve CTA — then the search / categories / dishes follow.
 * (Replaces the old full-screen cinematic hero.)
 */
export function Hero() {
  const { locale } = useLocale();
  const { restaurant } = useContent();
  const { table } = useTableNumber();

  return (
    <header className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-12 pb-1">
      {/* Brand + language */}
      <div className="flex items-center gap-2.5">
        <SazanFish className="h-6 w-auto text-foreground" />
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-[22px] font-semibold leading-none tracking-tight">
            {restaurant.name.replace(/\s*CITY$/i, "")}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gold">
            City
          </span>
        </div>
        <div className="flex-1" />
        <LanguageSwitcher />
      </div>

      {/* Title + table */}
      <div className="mt-7 flex items-end justify-between gap-3">
        <h1 className="font-heading text-[44px] font-semibold leading-[0.95]">
          {t(UI_STRINGS.menu, locale)}
        </h1>
        {table && (
          <span className="mb-1.5 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/[0.08] px-3.5 py-2 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-gold" />
            {guestTableLabel(table, t(UI_STRINGS.table, locale))}
          </span>
        )}
      </div>

      {/* Working hours + service */}
      <p className="mt-2.5 text-[12.5px] text-muted-foreground">
        {t(restaurant.workingHours, locale)}
      </p>

      {/* Reserve a table */}
      <div className="mt-4">
        <ReservationSheet />
      </div>
    </header>
  );
}
