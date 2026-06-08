"use client";

import { useState } from "react";
import { useLocale, t, formatPrice, UI_STRINGS } from "@/lib/i18n";
import type { MenuItem } from "@/types/menu";
import { DietBadge } from "@/components/DietBadge";
import { useCart } from "@/lib/cart-context";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { SpicyMeter } from "@/components/SpicyMeter";
import { cn } from "@/lib/utils";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { locale } = useLocale();
  const { add } = useCart();
  const isVariants = Array.isArray(item.price);
  const [pulseKey, setPulseKey] = useState<string | null>(null);

  const handleAdd = (
    price: number,
    variantKey?: string,
    variantLabel?: typeof item.name
  ) => {
    add({
      id: item.id,
      variantKey,
      price,
      name: item.name,
      variantLabel,
    });
    setPulseKey(variantKey ?? "main");
    setTimeout(() => setPulseKey(null), 400);
  };

  return (
    <article id={`dish-${item.id}`} className="group relative py-5 md:py-6 border-b border-border last:border-b-0">
      {/* Title row with leader dots and add button */}
      <div className="flex items-baseline gap-3">
        <h3 className="font-heading text-[17px] leading-tight md:text-lg shrink-0 max-w-[60%] flex items-center gap-1">
          {t(item.name, locale)}
          <FavoriteButton id={item.id} className="self-center -mt-0.5" />
          <ShareButton
            id={item.id}
            title={t(item.name, locale)}
            className="self-center -mt-0.5 opacity-40 hover:opacity-100"
          />
        </h3>

        <span
          aria-hidden
          className="flex-1 mb-1 border-b border-dotted border-border/60"
        />

        {!isVariants && (
          <>
            <span className="font-heading text-base tabular-nums text-gold shrink-0 md:text-lg">
              {formatPrice(item.price as number, locale)}
            </span>
            <button
              onClick={() => handleAdd(item.price as number)}
              className={cn(
                "ml-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold transition-all duration-300 hover:bg-gold hover:text-primary-foreground active:scale-90",
                pulseKey === "main" && "scale-125 bg-gold text-primary-foreground"
              )}
              aria-label="+"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Description + weight + tags */}
      {(item.description || item.weight || item.tags) && (
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {item.tags && item.tags.length > 0 && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
              {t(item.tags[0], locale)}
            </span>
          )}
          {item.description && (
            <p className="text-[13px] leading-relaxed text-muted-foreground flex-1 min-w-[200px]">
              {t(item.description, locale)}
            </p>
          )}
          {item.weight && !isVariants && (
            <span className="text-[11px] tabular-nums text-muted-foreground/70 ml-auto shrink-0">
              {item.weight} {t(UI_STRINGS.weight, locale)}
            </span>
          )}
        </div>
      )}

      {/* Diet badges + spicy meter */}
      {((item.diet && item.diet.length > 0) || item.spicy) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {item.diet?.filter((d) => d !== "spicy").map((d) => (
            <DietBadge key={d} tag={d} />
          ))}
          {item.spicy && <SpicyMeter level={item.spicy} />}
        </div>
      )}

      {/* Variant prices with add buttons */}
      {isVariants && (
        <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-x-4">
          {(item.price as { label: typeof item.name; price: number }[]).map((v, i) => {
            const key = `v${i}`;
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t(v.label, locale)}
                  </span>
                  <span className="font-heading tabular-nums text-gold">
                    {formatPrice(v.price, locale)}
                  </span>
                </div>
                <button
                  onClick={() => handleAdd(v.price, key, v.label)}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold transition-all duration-300 hover:bg-gold hover:text-primary-foreground active:scale-90",
                    pulseKey === key && "scale-125 bg-gold text-primary-foreground"
                  )}
                  aria-label="+"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
