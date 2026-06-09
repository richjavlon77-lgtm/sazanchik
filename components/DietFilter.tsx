"use client";

import { useMenu } from "@/lib/menu-context";
import { useLocale, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FILTERS: {
  tag: string;
  icon: string;
  label: { ru: string; uz: string; en: string };
}[] = [
  { tag: "veg", icon: "🌱", label: { ru: "Вег", uz: "Veg", en: "Veg" } },
  { tag: "fish", icon: "🐟", label: { ru: "Рыба", uz: "Baliq", en: "Fish" } },
  { tag: "spicy", icon: "🌶", label: { ru: "Острое", uz: "Achchiq", en: "Spicy" } },
  { tag: "sweet", icon: "🍰", label: { ru: "Сладкое", uz: "Shirin", en: "Sweet" } },
];

export function DietFilter() {
  const { activeDiets, toggleDiet, isFiltering } = useMenu();
  const { locale } = useLocale();

  // Hide while text-searching to keep the bar clean
  if (isFiltering && activeDiets.length === 0) return null;

  return (
    <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
      {FILTERS.map((f) => {
        const on = activeDiets.includes(f.tag);
        return (
          <button
            key={f.tag}
            onClick={() => toggleDiet(f.tag)}
            aria-pressed={on}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              on
                ? "border-gold bg-gold/15 text-gold"
                : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground"
            )}
          >
            <span aria-hidden>{f.icon}</span>
            {t(f.label, locale)}
          </button>
        );
      })}
    </div>
  );
}
