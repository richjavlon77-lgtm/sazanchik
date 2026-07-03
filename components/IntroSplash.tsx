"use client";

import { useEffect, useState } from "react";
import { SazanFish } from "@/components/icons/SazanFish";
import { useLocale, t, UI_STRINGS } from "@/lib/i18n";

const STORAGE_KEY = "sazanchik:intro-seen";
const INTRO_DURATION = 2200; // ms

export function IntroSplash() {
  const { locale } = useLocale();
  const [shown, setShown] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Only on first visit. Skip if user prefers reduced motion.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    sessionStorage.setItem(STORAGE_KEY, "1");

    // All state changes are scheduled (rAF / timeouts), never sync in the
    // effect body — splash appears on the next frame.
    const raf = requestAnimationFrame(() => setShown(true));
    const fadeT = setTimeout(() => setFadingOut(true), INTRO_DURATION - 500);
    const hideT = setTimeout(() => setShown(false), INTRO_DURATION);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fadeT);
      clearTimeout(hideT);
    };
  }, []);

  if (!shown) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      {/* Soft gold glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(212,178,106,0.18), transparent 60%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6 splash-rise">
        {/* The fish swimming in */}
        <div className="overflow-hidden">
          <SazanFish className="h-16 w-auto text-gold splash-fish" />
        </div>

        {/* Title */}
        <div className="text-center">
          <div className="mb-2 text-[10px] uppercase tracking-[0.5em] text-gold/80 splash-eyebrow">
            Restaurant
          </div>
          <h1 className="font-heading text-5xl md:text-6xl tracking-tight splash-title">
            <span className="italic text-gold">С</span>азанчик
          </h1>
          <div className="mt-1 text-[10px] uppercase tracking-[0.6em] text-gold/70 splash-eyebrow">
            — City —
          </div>
        </div>

        {/* Tiny progress / loading hint */}
        <div className="mt-4 h-px w-20 overflow-hidden bg-border">
          <div className="h-full w-full bg-gold splash-progress" />
        </div>

        <span className="sr-only">{t(UI_STRINGS.menu, locale)}</span>
      </div>

      <style jsx>{`
        .splash-rise {
          animation: rise 800ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .splash-fish {
          animation: swim 1.4s cubic-bezier(0.6, 0, 0.3, 1) 100ms both;
        }
        @keyframes swim {
          from {
            transform: translateX(-120%);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .splash-eyebrow {
          animation: fade 500ms ease-out 500ms both;
        }
        .splash-title {
          animation: fade 700ms ease-out 600ms both;
        }
        @keyframes fade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .splash-progress {
          animation: progress ${INTRO_DURATION - 300}ms linear 300ms both;
          transform-origin: left center;
        }
        @keyframes progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
