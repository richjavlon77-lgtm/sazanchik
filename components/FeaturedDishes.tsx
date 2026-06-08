"use client";

import { useMemo } from "react";
import { useMenu } from "@/lib/menu-context";
import { useLocale, t, formatPrice } from "@/lib/i18n";
import { useCart } from "@/lib/cart-context";
import { Reveal } from "@/components/Reveal";
import type { MenuItem, MenuCategory } from "@/types/menu";

const TITLE = { ru: "Выбор шефа", uz: "Oshpaz tanlovi", en: "Chef's choice" };
const SUB = {
  ru: "Фирменные блюда, которыми мы гордимся",
  uz: "Biz faxrlanadigan maxsus taomlar",
  en: "Signature dishes we're proud of",
};

function priceOf(item: MenuItem): number {
  if (Array.isArray(item.price)) {
    return Math.max(...item.price.map((v) => v.price));
  }
  return item.price as number;
}

function displayPrice(item: MenuItem, locale: Parameters<typeof formatPrice>[1]) {
  if (Array.isArray(item.price)) {
    const min = Math.min(...item.price.map((v) => v.price));
    return `${formatPrice(min, locale)}`;
  }
  return formatPrice(item.price as number, locale);
}

export function FeaturedDishes() {
  const { menu, isFiltering } = useMenu();
  const { locale } = useLocale();
  const { add } = useCart();

  const featured = useMemo(() => {
    const all: { item: MenuItem; cat: MenuCategory }[] = [];
    for (const cat of menu) {
      for (const item of cat.items) all.push({ item, cat });
    }
    return all.sort((a, b) => priceOf(b.item) - priceOf(a.item)).slice(0, 8);
  }, [menu]);

  if (isFiltering || featured.length < 4) return null;

  return (
    <section className="pt-14 md:pt-20">
      <Reveal>
        <div className="mb-1 flex items-center gap-2.5 text-[10px] uppercase tracking-[0.4em] text-gold">
          <span className="h-px w-7 bg-gold/50" />
          {t(TITLE, locale)}
        </div>
        <p className="mb-5 text-[13px] text-muted-foreground italic">
          {t(SUB, locale)}
        </p>
      </Reveal>

      <Reveal>
        <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2">
          {featured.map(({ item, cat }) => (
            <article
              key={item.id}
              className="group flex w-[230px] shrink-0 snap-start flex-col rounded-2xl border border-gold/20 bg-card/40 p-5 backdrop-blur-sm transition-all duration-500 hover:border-gold/45 hover:bg-card/70"
            >
              <span className="text-[9px] uppercase tracking-[0.25em] text-gold/70">
                {t(cat.name, locale)}
              </span>
              <h3 className="mt-2 font-heading text-xl leading-tight">
                <a
                  href={`#dish-${item.id}`}
                  className="transition-colors hover:text-gold"
                >
                  {t(item.name, locale)}
                </a>
              </h3>
              {item.description && (
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                  {t(item.description, locale)}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="font-heading tabular-nums text-gold">
                  {displayPrice(item, locale)}
                </span>
                {!Array.isArray(item.price) && (
                  <button
                    onClick={() =>
                      add({
                        id: item.id,
                        price: item.price as number,
                        name: item.name,
                      })
                    }
                    aria-label="+"
                    className="flex size-8 items-center justify-center rounded-full border border-gold/30 text-gold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-primary-foreground hover:shadow-[0_2px_18px_-4px_var(--gold)] active:scale-90"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="size-4"
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
