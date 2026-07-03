"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, t, formatPrice, UI_STRINGS } from "@/lib/i18n";
import type { MenuItem } from "@/types/menu";
import { DietBadge } from "@/components/DietBadge";
import { useCart } from "@/lib/cart-context";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { SpicyMeter } from "@/components/SpicyMeter";
import { cn } from "@/lib/utils";

/** Add "+" (gold, idle) → forest "− n +" stepper once the dish is in the cart. */
function QtyControl({
  qty,
  pulse,
  onAdd,
  onInc,
  onDec,
}: {
  qty: number;
  pulse: boolean;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-primary-foreground hover:shadow-[0_2px_18px_-4px_var(--gold)] active:scale-90",
          pulse && "scale-125 bg-gold text-primary-foreground"
        )}
        aria-label="Добавить"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    );
  }
  return (
    <div className="flex h-7 shrink-0 items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_-10px_var(--primary)]">
      <button
        onClick={onDec}
        className="grid size-7 place-items-center rounded-full transition-transform active:scale-90"
        aria-label="Убрать одну"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5">
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
      <span className="w-5 text-center text-[13px] font-semibold tabular-nums">{qty}</span>
      <button
        onClick={onInc}
        className="grid size-7 place-items-center rounded-full transition-transform active:scale-90"
        aria-label="Добавить одну"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { locale } = useLocale();
  const { add, lines, inc, dec } = useCart();
  const isVariants = Array.isArray(item.price);
  const stop = item.outOfStock === true;
  const [pulseKey, setPulseKey] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Current quantity of this dish (or a specific variant) already in the cart.
  const qtyOf = (variantKey?: string) =>
    lines.find((l) => l.id === item.id && l.variantKey === variantKey)?.qty ?? 0;

  const handleAdd = (
    price: number,
    variantKey?: string,
    variantLabel?: typeof item.name
  ) => {
    if (stop) return;
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
    <article
      id={`dish-${item.id}`}
      className={cn(
        "group relative -mx-3 rounded-2xl border-b border-border px-3 py-5 transition-colors duration-300 last:border-b-0 hover:bg-gold/[0.02] md:py-6",
        stop && "opacity-55"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Dish image */}
        {item.image && !imgError && (
          <div className="relative shrink-0 overflow-hidden rounded-2xl bg-muted shadow-[0_10px_30px_-14px_rgba(23,21,15,0.35)] ring-1 ring-black/[0.06]">
            <Image
              src={item.image}
              alt={t(item.name, locale)}
              width={112}
              height={112}
              unoptimized
              className="size-24 object-cover md:size-28 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
              onError={() => setImgError(true)}
            />
            {/* Subtle gold sheen on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(135deg, rgba(212,178,106,0.12), transparent 55%)",
              }}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
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

            {stop && (
              <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] text-destructive">
                {t({ ru: "Стоп", uz: "Tugadi", en: "Out", tr: "Tükendi" }, locale)}
              </span>
            )}

            <span
              aria-hidden
              className="flex-1 mb-1 border-b border-dotted border-border/60"
            />

            {!isVariants && (
              <>
                <span className="font-heading tabular-nums text-base text-gold shrink-0 md:text-lg">
                  {formatPrice(item.price as number, locale)}
                </span>
                {!stop && (
                  <div className="ml-1">
                    <QtyControl
                      qty={qtyOf()}
                      pulse={pulseKey === "main"}
                      onAdd={() => handleAdd(item.price as number)}
                      onInc={() => inc(item.id)}
                      onDec={() => dec(item.id)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Description + weight + calories + tags */}
          {(item.description || item.weight || item.calories || item.tags) && (
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
              <span className="ml-auto flex shrink-0 items-baseline gap-2 text-[11px] tabular-nums text-muted-foreground/70">
                {item.calories ? (
                  <span>
                    {item.calories}{" "}
                    {t({ ru: "ккал", uz: "kkal", en: "kcal", tr: "kcal" }, locale)}
                  </span>
                ) : null}
                {item.weight && !isVariants ? (
                  <span>
                    {item.weight} {t(UI_STRINGS.weight, locale)}
                  </span>
                ) : null}
              </span>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              {t({ ru: "Содержит", uz: "Tarkibida", en: "Contains", tr: "İçerir" }, locale)}: {item.allergens.join(", ")}
            </p>
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
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-sm transition-colors duration-300 hover:border-gold/25 hover:bg-background/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t(v.label, locale)}
                      </span>
                      <span className="font-heading tabular-nums text-gold">
                        {formatPrice(v.price, locale)}
                      </span>
                    </div>
                    <QtyControl
                      qty={qtyOf(key)}
                      pulse={pulseKey === key}
                      onAdd={() => handleAdd(v.price, key, v.label)}
                      onInc={() => inc(item.id, key)}
                      onDec={() => dec(item.id, key)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
