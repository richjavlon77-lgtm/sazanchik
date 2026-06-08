"use client";

import { useEffect } from "react";

/**
 * When arriving with a #dish-... hash, briefly highlight the target article
 * so the user can find it after auto-scroll.
 */
export function HashHighlighter() {
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const el = document.querySelector<HTMLElement>(hash);
      if (!el) return;

      el.classList.add("dish-highlight");
      // Defer scroll a tick so React has finished mounting
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      const t = setTimeout(() => el.classList.remove("dish-highlight"), 2400);
      return () => clearTimeout(t);
    };

    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return null;
}
