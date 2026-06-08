"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground backdrop-blur transition-all duration-300 hover:border-gold/50 hover:text-gold",
        className
      )}
    >
      {/* Avoid hydration mismatch: render icon only after mount */}
      {mounted ? (
        <span className="relative block size-4">
          <Sun
            className={cn(
              "absolute inset-0 size-4 transition-all duration-500",
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0"
            )}
          />
          <Moon
            className={cn(
              "absolute inset-0 size-4 transition-all duration-500",
              isDark
                ? "rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            )}
          />
        </span>
      ) : (
        <span className="size-4" />
      )}
    </button>
  );
}
