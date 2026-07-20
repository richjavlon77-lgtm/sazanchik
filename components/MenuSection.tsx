"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, t } from "@/lib/i18n";
import type { MenuCategory } from "@/types/menu";
import { MenuItemCard } from "@/components/MenuItemCard";
import { cn } from "@/lib/utils";

export function MenuSection({
  category,
  index,
}: {
  category: MenuCategory;
  index?: number;
}) {
  const { locale } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
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

  /* Replay entrance when navigating to this section via nav click */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const handler = () => {
      if (document.getElementById(category.id) === el) {
        setNavKey((k) => k + 1);
      }
    };

    window.addEventListener("section-navigate", handler);
    return () => window.removeEventListener("section-navigate", handler);
  }, [category.id]);

  return (
    <section
      id={category.id}
      ref={sectionRef}
      className={cn(
        "relative scroll-mt-24 pt-10 md:pt-16",
        entered && "section-enter"
      )}
    >
      {/* Ghosted index watermark */}
      {index != null && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 -top-1 select-none font-heading leading-[0.8] text-gold/[0.07] text-[96px] md:text-[150px]"
        >
          {String(index).padStart(2, "0")}
        </span>
      )}

      <header
        key={navKey}
        className={cn(
          "relative",
          navKey > 0 && "section-nav-in"
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
        <p className="intro-prose mb-5 mt-4 max-w-xl text-[13px] leading-relaxed text-muted-foreground/90 italic md:text-sm [&::first-letter]:float-left [&::first-letter]:mr-2 [&::first-letter]:font-heading [&::first-letter]:text-[2.6em] [&::first-letter]:not-italic [&::first-letter]:leading-[0.8] [&::first-letter]:text-gold">
          {t(category.intro, locale)}
        </p>
      )}
      {!category.intro && <div className="mb-4" />}

      <div
        key={`items-${navKey}`}
        className={cn(navKey > 0 && "item-stagger")}
      >
        {category.items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
