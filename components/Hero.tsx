"use client";

import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { useContent } from "@/lib/content-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SazanFish } from "@/components/icons/SazanFish";
import { OrnamentDivider } from "@/components/Ornament";
import { Reveal } from "@/components/Reveal";
import { StoryButton } from "@/components/StoryButton";

export function Hero() {
  const { locale } = useLocale();
  const { restaurant } = useContent();
  const RESTAURANT = restaurant;

  return (
    <header className="relative overflow-hidden pt-7 pb-14 md:pt-12 md:pb-20">
      {/* Soft gold radial glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(212, 178, 106, 0.22), transparent 65%)",
        }}
      />

      {/* Top utility bar */}
      <div className="relative z-10 mx-auto flex max-w-3xl items-center justify-between gap-4 px-1">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Restaurant · Tashkent
        </span>
        <LanguageSwitcher />
      </div>

      {/* Title block */}
      <div className="relative z-10 mx-auto mt-10 flex max-w-3xl flex-col items-center px-1 text-center md:mt-14">
        <Reveal delay={50}>
          <div className="mb-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-gold">
            <span className="h-px w-6 bg-gold/60" />
            {t(UI_STRINGS.menu, locale)}
            <span className="h-px w-6 bg-gold/60" />
          </div>
        </Reveal>

        <Reveal delay={150}>
          <h1 className="font-heading text-[64px] font-medium leading-[0.95] tracking-tight md:text-[112px]">
            <span className="italic text-gold">С</span>азанчик
          </h1>
        </Reveal>

        <Reveal delay={300} className="mt-6 flex items-center gap-4">
          <span className="h-px w-12 bg-border" />
          <SazanFish className="h-7 w-auto text-gold" />
          <span className="text-[11px] uppercase tracking-[0.6em] text-gold/90">
            City
          </span>
          <SazanFish className="h-7 w-auto -scale-x-100 text-gold" />
          <span className="h-px w-12 bg-border" />
        </Reveal>

        <Reveal delay={450}>
          <p className="mx-auto mt-8 max-w-lg text-[13px] leading-relaxed text-muted-foreground md:text-base md:leading-relaxed">
            {t(RESTAURANT.tagline, locale)}
          </p>
        </Reveal>

        <Reveal delay={600} className="mt-8">
          <StoryButton />
        </Reveal>

        <Reveal delay={750} className="mt-6">
          <OrnamentDivider />
        </Reveal>
      </div>
    </header>
  );
}
