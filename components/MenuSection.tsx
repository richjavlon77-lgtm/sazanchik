"use client";

import { useLocale, t } from "@/lib/i18n";
import type { MenuCategory } from "@/types/menu";
import { MenuItemCard } from "@/components/MenuItemCard";
import { Reveal } from "@/components/Reveal";

export function MenuSection({ category }: { category: MenuCategory }) {
  const { locale } = useLocale();

  return (
    <section id={category.id} className="scroll-mt-24 pt-14 md:pt-20">
      <Reveal>
        <header className="mb-3 flex items-end justify-between gap-4">
          <h2 className="font-heading text-3xl font-medium leading-none md:text-[40px]">
            {t(category.name, locale)}
          </h2>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground tabular-nums">
            {String(category.items.length).padStart(2, "0")} ·
          </span>
        </header>
        <div className="divider-gold mb-4 w-16" />
        {category.intro && (
          <p className="mb-6 max-w-xl text-[13px] leading-relaxed text-muted-foreground/90 italic md:text-sm">
            {t(category.intro, locale)}
          </p>
        )}
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
