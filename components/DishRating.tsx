"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocale } from "@/lib/i18n";
import { readLocal, writeLocal, useLocalString } from "@/lib/local-store";
import { cn } from "@/lib/utils";

/**
 * Оценка блюда прямо в карточке: «★ 4,8 · 12» + звёзды в один тап.
 * Один fetch агрегатов на страницу (провайдер), своя оценка помнится
 * в localStorage — второй раз то же блюдо не оценить.
 */

type Ratings = Record<string, { avg: number; count: number }>;
const RatingsContext = createContext<Ratings>({});

export function DishRatingsProvider({ children }: { children: React.ReactNode }) {
  const [ratings, setRatings] = useState<Ratings>({});
  useEffect(() => {
    let cancelled = false;
    fetch("/api/dish-ratings")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!cancelled) setRatings(data as Ratings);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return <RatingsContext.Provider value={ratings}>{children}</RatingsContext.Provider>;
}

const T = {
  rate: { ru: "Оценить", uz: "Baholash", en: "Rate", tr: "Değerlendir" },
  thanks: { ru: "Спасибо!", uz: "Rahmat!", en: "Thanks!", tr: "Teşekkürler!" },
} as const;

const RATED_KEY = "sazanchik:rated";

function readRated(): Record<string, number> {
  try {
    return JSON.parse(readLocal(RATED_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

export function DishRating({ slug, name }: { slug: string; name: string }) {
  const { locale } = useLocale();
  const stats = useContext(RatingsContext)[slug];
  const [open, setOpen] = useState(false);
  const [justRated, setJustRated] = useState(false);

  // Своя оценка — из localStorage через store-подписку (без setState в эффекте)
  const ratedRaw = useLocalString(RATED_KEY);
  let myRating = 0;
  try {
    myRating = ratedRaw ? ((JSON.parse(ratedRaw) as Record<string, number>)[slug] ?? 0) : 0;
  } catch {
    myRating = 0;
  }

  const rate = useCallback(
    async (n: number) => {
      setJustRated(true);
      setOpen(false);
      writeLocal(RATED_KEY, JSON.stringify({ ...readRated(), [slug]: n }));
      try {
        await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: n, comment: "", dishSlug: slug, dishName: name }),
        });
      } catch {
        /* оценка останется локально — не мешаем гостю */
      }
      setTimeout(() => setJustRated(false), 1800);
    },
    [slug, name]
  );

  return (
    <span className="mt-1 flex min-h-5 items-center gap-2 text-[11px] leading-none">
      {stats && (
        <span className="text-gold/90">
          ★ {stats.avg.toFixed(1).replace(".", ",")}
          <span className="text-muted-foreground/60"> · {stats.count}</span>
        </span>
      )}

      {justRated ? (
        <span className="text-gold">{T.thanks[locale] ?? T.thanks.ru}</span>
      ) : myRating ? (
        <span className="text-muted-foreground/60" title={`Ваша оценка: ${myRating}`}>
          {"★".repeat(myRating)}
        </span>
      ) : open ? (
        <span className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} ★`}
              onClick={() => rate(n)}
              className="px-0.5 text-[15px] leading-none text-gold/40 transition-colors hover:text-gold active:scale-90"
            >
              ★
            </button>
          ))}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "text-muted-foreground/50 underline decoration-dotted underline-offset-2 transition-colors hover:text-gold"
          )}
        >
          {T.rate[locale] ?? T.rate.ru} ★
        </button>
      )}
    </span>
  );
}
