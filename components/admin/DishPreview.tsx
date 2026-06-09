"use client";

import { formatPrice } from "@/lib/i18n-core";
import type { DishFormInput } from "@/lib/admin-actions";

const DIET_EMOJI: Record<string, string> = {
  veg: "🌱",
  fish: "🐟",
  sweet: "🍰",
  alcohol: "🥂",
};

export function DishPreview({ form }: { form: DishFormInput }) {
  const variants = form.variants ?? [];
  const useVariants = variants.length > 0;

  return (
    <div className="rounded-2xl border border-gold/20 bg-background/60 p-5">
      <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-gold/70">
        Превью в меню
      </div>

      <article className="rounded-xl bg-card/40 px-4 py-4">
        <div className="flex items-baseline gap-3">
          <h3 className="font-heading text-[17px] leading-tight">
            {form.nameRu || "Название блюда"}
          </h3>
          <span className="mb-1 flex-1 border-b border-dotted border-border/60" />
          {!useVariants && (
            <span className="font-heading tabular-nums text-gold">
              {form.price != null ? formatPrice(form.price, "ru") : "—"}
            </span>
          )}
        </div>

        {(form.descriptionRu || form.weight || form.calories) && (
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {form.descriptionRu && (
              <p className="min-w-[200px] flex-1 text-[13px] leading-relaxed text-muted-foreground">
                {form.descriptionRu}
              </p>
            )}
            <span className="ml-auto flex shrink-0 items-baseline gap-2 text-[11px] tabular-nums text-muted-foreground/70">
              {form.calories ? <span>{form.calories} ккал</span> : null}
              {form.weight && !useVariants ? <span>{form.weight}</span> : null}
            </span>
          </div>
        )}
        {form.allergens && form.allergens.length > 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            Содержит: {form.allergens.join(", ")}
          </p>
        )}

        {(form.diet.length > 0 || form.spicy) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {form.diet.map((d) => (
              <span
                key={d}
                className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px]"
              >
                {DIET_EMOJI[d] ?? d}
              </span>
            ))}
            {form.spicy ? (
              <span className="text-[11px]">{"🌶".repeat(form.spicy)}</span>
            ) : null}
          </div>
        )}

        {useVariants && (
          <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-x-4">
            {variants.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-sm"
              >
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {v.labelRu || `Вариант ${i + 1}`}
                </span>
                <span className="font-heading tabular-nums text-gold">
                  {formatPrice(v.price || 0, "ru")}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
