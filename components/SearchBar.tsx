"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { useMenu } from "@/lib/menu-context";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const { locale } = useLocale();
  const { query, setQuery, totalShown, totalAll, isFiltering } = useMenu();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setQuery]);

  return (
    <div className="relative mb-2">
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-full border bg-card/60 px-4 py-2.5 backdrop-blur transition-all duration-300",
          focused || isFiltering
            ? "border-gold/40 bg-card shadow-[0_0_0_4px_rgba(212,178,106,0.08)]"
            : "border-border hover:border-border/80"
        )}
      >
        {/* Search icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={cn(
            "size-4 shrink-0 transition-colors",
            focused || isFiltering ? "text-gold" : "text-muted-foreground"
          )}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t(UI_STRINGS.search_placeholder, locale)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          aria-label={t(UI_STRINGS.search_placeholder, locale)}
        />

        {isFiltering ? (
          <button
            onClick={() => setQuery("")}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t(UI_STRINGS.search_clear, locale)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-3.5"
            >
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          <kbd className="hidden rounded border border-border bg-background/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground md:inline">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Results indicator */}
      {isFiltering && (
        <div className="mt-2 px-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {t(UI_STRINGS.search_results, locale)}:{" "}
          <span className="text-gold tabular-nums">{totalShown}</span> / {totalAll}
        </div>
      )}
    </div>
  );
}
