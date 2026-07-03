"use client";

import { Fragment } from "react";
import { useMenu } from "@/lib/menu-context";
import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { MenuSection } from "@/components/MenuSection";
import { PhotoBand } from "@/components/PhotoBand";
import { OrnamentDivider } from "@/components/Ornament";

// Khiva photo strips woven through the menu (one after every 3rd category).
const BANDS = [
  { src: "/images/khiva-1.jpg", caption: "Хива · Ичан-Кала" },
  { src: "/images/khiva-2.jpg", caption: "Хива · Кальта-Минор" },
  { src: "/images/khiva-3.jpg", caption: "Узбекская резьба" },
  { src: "/images/khiva-4.jpg", caption: "Изразцы · Хорезм" },
  { src: "/images/khiva-5.jpg", caption: "Хива · Старый город" },
];

export function MenuList() {
  const { filteredMenu, isFiltering, query, setQuery } = useMenu();
  const { locale } = useLocale();

  if (isFiltering && filteredMenu.length === 0) {
    return (
      <div className="py-24 text-center">
        <OrnamentDivider className="mx-auto mb-6 opacity-50" />
        <p className="font-heading text-2xl">
          {t(UI_STRINGS.search_no_results, locale)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          «{query}» — {t(UI_STRINGS.search_no_results_hint, locale)}
        </p>
        <button
          onClick={() => setQuery("")}
          className="mt-6 rounded-full border border-gold/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
        >
          {t(UI_STRINGS.search_clear, locale)}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {filteredMenu.map((category, i) => {
        // a photo band after every 3rd category (skipped while searching)
        const bandIdx = (i + 1) % 3 === 0 ? (i + 1) / 3 - 1 : -1;
        const band = !isFiltering && bandIdx >= 0 ? BANDS[bandIdx] : null;
        return (
          <Fragment key={category.id}>
            <MenuSection category={category} index={i + 1} />
            {band && <PhotoBand src={band.src} caption={band.caption} />}
          </Fragment>
        );
      })}
    </div>
  );
}
