"use client";

import { useMenu } from "@/lib/menu-context";
import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { MenuSection } from "@/components/MenuSection";
import { OrnamentDivider } from "@/components/Ornament";

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
      {filteredMenu.map((category, i) => (
        <MenuSection key={category.id} category={category} index={i + 1} />
      ))}
    </div>
  );
}
