"use client";

import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { useContent } from "@/lib/content-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { OrnamentDivider } from "@/components/Ornament";
import { Reveal } from "@/components/Reveal";
import { StoryButton } from "@/components/StoryButton";

export function Hero() {
  const { locale } = useLocale();
  const { restaurant } = useContent();
  const RESTAURANT = restaurant;

  return (
    <header className="relative overflow-hidden pt-7 pb-14 md:pt-12 md:pb-20">
      {/* Khiva sunset backdrop — cinematic, melts into the page (dark theme) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="kenburns absolute inset-0 bg-cover bg-top opacity-0 will-change-transform motion-reduce:animate-none dark:opacity-[0.32]"
          style={{ backgroundImage: "url(/images/khiva.jpg)" }}
        />
        {/* depth gradient — fade image into the page */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in oklab, var(--background) 25%, transparent) 0%, color-mix(in oklab, var(--background) 62%, transparent) 50%, var(--background) 90%)",
          }}
        />
        {/* side vignette for cinematic framing */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 18%, transparent 40%, color-mix(in oklab, var(--background) 80%, transparent) 100%)",
          }}
        />
      </div>

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
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
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
          <h1 className="sr-only">Сазанчик CITY</h1>
          <BrandLogo
            priority
            className="w-[min(78vw,340px)] md:w-[440px] drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]"
          />
        </Reveal>

        <Reveal delay={450}>
          <p className="mx-auto mt-8 max-w-lg text-pretty text-[13px] leading-relaxed text-muted-foreground md:text-base md:leading-relaxed">
            {t(RESTAURANT.tagline, locale)}
          </p>
        </Reveal>

        <Reveal delay={600} className="mt-8">
          <StoryButton />
        </Reveal>

        <Reveal delay={750} className="mt-6">
          <OrnamentDivider />
        </Reveal>

        <Reveal delay={900} className="mt-10">
          <span className="scroll-cue inline-flex flex-col items-center gap-1 text-gold/60 motion-reduce:animate-none">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-5"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Reveal>
      </div>
    </header>
  );
}
