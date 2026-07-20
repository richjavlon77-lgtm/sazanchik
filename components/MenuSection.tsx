"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, t } from "@/lib/i18n";
import type { MenuCategory } from "@/types/menu";
import { MenuItemCard } from "@/components/MenuItemCard";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

export function MenuSection({
  category,
  index,
}: {
  category: MenuCategory;
  index?: number;
}) {
  const { locale } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => setReplay((k) => k + 1);
    window.addEventListener("section-navigate", handler);
    return () => window.removeEventListener("section-navigate", handler);
  }, []);

  return (
    <section
      id={category.id}
      ref={ref}
      className={cn(
        "relative scroll-mt-16",
        entered && "section-enter"
      )}
    >
      {index != null && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 select-none font-heading leading-[0.8] text-gold/[0.07] text-[96px] md:text-[150px]"
        >
          {String(index).padStart(2, "0")}
        </span>
      )}

      <div key={replay}>
        <header
          className={cn(
            "relative",
            replay > 0 && "section-nav-in"
          )}
        >
          <h2 className="font-heading text-[32px] font-medium leading-[0.95] md:text-[48px]">
            {t(category.name, locale)}
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <div className="divider-gold w-12 shrink-0 opacity-70" />
            <span className="shrink-0 tabular-nums text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {String(category.items.length).padStart(2, "0")} ·{" "}
              {t(
                { ru: "блюд", uz: "taom", en: "dishes", tr: "yemek" },
                locale
              )}
            </span>
            <div className="divider-gold w-full opacity-30" />
          </div>
        </header>

        {category.intro && (
          <p className="intro-prose mb-4 mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground/90 italic md:text-sm [&::first-letter]:float-left [&::first-letter]:mr-2 [&::first-letter]:font-heading [&::first-letter]:text-[2.6em] [&::first-letter]:not-italic [&::first-letter]:leading-[0.8] [&::first-letter]:text-gold">
            {t(category.intro, locale)}
          </p>
        )}
      </div>

      <div
        key={`items-${replay}`}
        className={cn("mt-5", replay > 0 && "item-stagger")}
      >
        {category.items.map((item, i) => (
          <Reveal key={item.id} delay={Math.min(i * 35, 280)}>
            <MenuItemCard item={item} />
          </Reveal>
        ))}
      </div>

      <div className="h-8 md:h-12" />
    </section>
  );
}
