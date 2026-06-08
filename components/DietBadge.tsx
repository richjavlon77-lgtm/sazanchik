"use client";

import type { DietTag } from "@/types/menu";
import { useLocale, t } from "@/lib/i18n";
import type { Localized } from "@/types/menu";

const DIET_META: Record<
  DietTag,
  { icon: React.ReactNode; label: Localized; color: string }
> = {
  veg: {
    label: {
      ru: "Вегетарианское",
      uz: "Vegeterian",
      en: "Vegetarian",
    },
    color: "text-emerald-400",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="size-3">
        <path
          d="M8 14 C 3 14, 2 9, 2 6 C 2 3, 4 2, 8 4 C 12 2, 14 3, 14 6 C 14 9, 13 14, 8 14 Z M 8 4 L 8 14"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  fish: {
    label: { ru: "Рыба", uz: "Baliq", en: "Fish" },
    color: "text-sky-400",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="size-3">
        <path
          d="M2 8 C 4 4, 9 4, 12 5 L 14 3 L 13 8 L 14 13 L 12 11 C 9 12, 4 12, 2 8 Z"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <circle cx="5" cy="8" r="0.7" fill="currentColor" />
      </svg>
    ),
  },
  spicy: {
    label: { ru: "Острое", uz: "Achchiq", en: "Spicy" },
    color: "text-red-400",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="size-3">
        <path
          d="M5 14 C 3 12, 4 8, 7 6 C 9 5, 11 5, 12 7 L 11 9 C 9 8, 7 9, 6 11 Z M 11 6 C 12 4, 13 3, 14 3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  alcohol: {
    label: { ru: "Алкоголь", uz: "Spirtli", en: "Alcohol" },
    color: "text-amber-400",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="size-3">
        <path
          d="M4 2 L 12 2 L 11 8 C 10 10, 9 10, 8 10 C 7 10, 6 10, 5 8 Z M 8 10 L 8 14 M 5 14 L 11 14"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  sweet: {
    label: { ru: "Десерт", uz: "Shirinlik", en: "Sweet" },
    color: "text-pink-300",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="size-3">
        <path
          d="M3 9 L 13 9 L 12 14 L 4 14 Z M 8 9 C 8 6, 11 6, 11 4 C 11 2.5, 9.5 2, 8 3 C 6.5 2, 5 2.5, 5 4 C 5 6, 8 6, 8 9"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

export function DietBadge({ tag }: { tag: DietTag }) {
  const { locale } = useLocale();
  const meta = DIET_META[tag];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-current/30 bg-current/10 px-1.5 py-0.5 text-[10px] ${meta.color}`}
      title={t(meta.label, locale)}
    >
      <span className="opacity-90">{meta.icon}</span>
      <span className="font-medium opacity-90">{t(meta.label, locale)}</span>
    </span>
  );
}
