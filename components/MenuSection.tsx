"use client";

import { useLocale, t } from "@/lib/i18n";
import type { MenuCategory } from "@/types/menu";
import { MenuItemCard } from "@/components/MenuItemCard";
import { Reveal } from "@/components/Reveal";

export function MenuSection({
  category,
  index,
}: {
  category: MenuCategory;
  index?: number;
}) {
  const { locale } = useLocale();

  return (
    <section id={category.id} className="scroll-mt-24 pt-16 md:pt-24">
      <Reveal>
        <header>
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-3 md:gap-4">
              {index != null && (
                <span className="font-heading text-base tabular-nums text-gold/60 md:text-xl">
                  {String(index).padStart(2, "0")}
                </span>
              )}
              <h2 className="font-heading text-[32px] font-medium leading-[0.95] md:text-[48px]">
                {t(category.name, locale)}
              </h2>
            </div>
            <span className="shrink-0 tabular-nums text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {String(category.items.length).padStart(2, "0")}
            </span>
          </div>
          <div className="divider-gold mt-4 w-full opacity-60" />
        </header>
        {category.intro && (
          <p className="intro-prose mb-6 mt-5 max-w-xl text-[13px] leading-relaxed text-muted-foreground/90 italic md:text-sm [&::first-letter]:float-left [&::first-letter]:mr-2 [&::first-letter]:font-heading [&::first-letter]:text-[2.6em] [&::first-letter]:not-italic [&::first-letter]:leading-[0.8] [&::first-letter]:text-gold">
            {t(category.intro, locale)}
          </p>
        )}
        {!category.intro && <div className="mb-6" />}
      </Reveal>

      <div>
        {category.items.map((item, i) => (
          <Reveal key={item.id} delay={Math.min(i * 35, 280)}>
            <MenuItemCard item={item} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
