"use client";

import { LOCALES, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-card/60 p-1 backdrop-blur",
        className
      )}
    >
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={cn(
            "relative h-7 min-w-9 rounded-full px-3 text-[11px] font-medium uppercase tracking-wider transition-all duration-300",
            locale === code
              ? "bg-gold text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={locale === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
