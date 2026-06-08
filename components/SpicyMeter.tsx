"use client";

import { useLocale, t } from "@/lib/i18n";
import type { Localized } from "@/types/menu";

const LABELS: Record<1 | 2 | 3, Localized> = {
  1: { ru: "Лёгкая острота", uz: "Yengil achchiq", en: "Mild" },
  2: { ru: "Средняя острота", uz: "O'rta achchiq", en: "Medium" },
  3: { ru: "Очень острое", uz: "Juda achchiq", en: "Very hot" },
};

export function SpicyMeter({ level }: { level: 1 | 2 | 3 }) {
  const { locale } = useLocale();

  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={t(LABELS[level], locale)}
      aria-label={t(LABELS[level], locale)}
    >
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          viewBox="0 0 16 16"
          fill="none"
          className={`size-3 transition-colors ${
            i <= level ? "text-red-400" : "text-muted-foreground/30"
          }`}
        >
          <path
            d="M5 14 C 3 12, 4 8, 7 6 C 9 5, 11 5, 12 7 L 11 9 C 9 8, 7 9, 6 11 Z M 11 6 C 12 4, 13 3, 14 3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={i <= level ? "currentColor" : "none"}
            fillOpacity={i <= level ? 0.15 : 0}
          />
        </svg>
      ))}
    </span>
  );
}
