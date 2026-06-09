"use client";

import { useEffect, useRef } from "react";
import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { useContent } from "@/lib/content-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OrnamentDivider } from "@/components/Ornament";
import { Reveal } from "@/components/Reveal";
import { StoryButton } from "@/components/StoryButton";
import { ReservationSheet } from "@/components/ReservationSheet";
import { SazanFish } from "@/components/icons/SazanFish";

export function Hero() {
  const { locale } = useLocale();
  const { restaurant } = useContent();
  const RESTAURANT = restaurant;
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Parallax: photo drifts slower than the page for depth
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2 && parallaxRef.current) {
          parallaxRef.current.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0d0b08] text-white">
      {/* Parallax layer */}
      <div
        ref={parallaxRef}
        className="absolute inset-x-0 -top-[25%] h-[150%] will-change-transform"
      >
        {/* Full-bleed Khiva sunset — cinematic, always present */}
        <div
          className="kenburns absolute inset-0 bg-cover bg-center will-change-transform motion-reduce:animate-none"
          style={{ backgroundImage: "url(/images/khiva.jpg)" }}
        />
      </div>
      {/* Dramatic darkening + fade into the page background at the bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(13,11,8,0.55) 0%, rgba(13,11,8,0.32) 38%, rgba(13,11,8,0.72) 80%, var(--background) 100%)",
        }}
      />
      {/* Center vignette so the logo always reads */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 44%, rgba(6,5,3,0.55), transparent 62%)",
        }}
      />

      {/* Top utility bar */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 pt-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/55">
          Restaurant · Tashkent
        </span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Centered hero content */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 text-center">
        <Reveal delay={50}>
          <div className="mb-7 inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.5em] text-gold">
            <span className="h-px w-7 bg-gold/50" />
            {t(UI_STRINGS.menu, locale)}
            <span className="h-px w-7 bg-gold/50" />
          </div>
        </Reveal>

        <Reveal delay={150}>
          <h1
            className="font-heading font-medium leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.55)]"
            style={{ fontSize: "clamp(60px, 12vw, 104px)" }}
          >
            <span className="italic text-gold">С</span>азанчик
          </h1>
        </Reveal>

        <Reveal delay={320} className="mt-5 flex items-center gap-4">
          <span className="h-px w-10 bg-white/30" />
          <SazanFish className="h-6 w-auto text-gold" />
          <span className="text-[11px] uppercase tracking-[0.6em] text-gold/90">
            City
          </span>
          <SazanFish className="h-6 w-auto -scale-x-100 text-gold" />
          <span className="h-px w-10 bg-white/30" />
        </Reveal>

        <Reveal delay={400} className="mt-7">
          <OrnamentDivider />
        </Reveal>

        <Reveal delay={520}>
          <p className="mx-auto mt-6 max-w-md text-pretty text-[13px] leading-relaxed text-white/75 md:max-w-lg md:text-[15px] md:leading-relaxed">
            {t(RESTAURANT.tagline, locale)}
          </p>
        </Reveal>

        <Reveal delay={680} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <StoryButton />
          <ReservationSheet />
        </Reveal>
      </div>

      {/* Scroll cue pinned to the bottom */}
      <Reveal delay={900} className="relative z-10 mx-auto mb-8 flex justify-center">
        <span className="scroll-cue inline-flex flex-col items-center gap-1.5 text-gold/70 motion-reduce:animate-none">
          <span className="text-[9px] uppercase tracking-[0.4em] text-white/50">
            {t(UI_STRINGS.menu, locale)}
          </span>
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
    </header>
  );
}
