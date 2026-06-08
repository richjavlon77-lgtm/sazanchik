"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, t } from "@/lib/i18n";
import { useMenu } from "@/lib/menu-context";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";

export function CategoryNav() {
  const { locale } = useLocale();
  const { filteredMenu, isFiltering } = useMenu();
  const [active, setActive] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Keep the active chip in view as you scroll through the menu
  useEffect(() => {
    if (!active || !navRef.current) return;
    const btn = navRef.current.querySelector<HTMLElement>(
      `[data-cat="${active}"]`
    );
    btn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (isFiltering) return;
    if (!filteredMenu.length) return;
    setActive(filteredMenu[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 0.1, 0.5, 1],
      }
    );

    filteredMenu.forEach((cat) => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredMenu, isFiltering]);

  const handleClick = (id: string) => {
    setActive(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-0 z-40 -mx-6 border-b border-border bg-background/85 px-6 backdrop-blur-md">
      <div className="mx-auto max-w-3xl py-3">
        <SearchBar />

        {!isFiltering && (
          <nav
            ref={navRef}
            className="no-scrollbar -mx-2 flex gap-1 overflow-x-auto px-2"
          >
            {filteredMenu.map((cat) => (
              <button
                key={cat.id}
                data-cat={cat.id}
                onClick={() => handleClick(cat.id)}
                className={cn(
                  "relative shrink-0 px-3 py-1.5 text-[13px] transition-all duration-300",
                  active === cat.id
                    ? "text-gold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(cat.name, locale)}
                {active === cat.id && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gold" />
                )}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
