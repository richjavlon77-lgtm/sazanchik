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
      // Только наши якоря вида #dish-plov. Сторонние хэши — например
      // #tgWebAppData=... от Telegram-мини-аппа — невалидны как CSS-селектор
      // и роняли querySelector (SyntaxError) вместе со всей страницей.
      if (!hash || !/^#[A-Za-z][\w-]*$/.test(hash)) return;
      let el: HTMLElement | null = null;
      try {
        el = document.querySelector<HTMLElement>(hash);
      } catch {
        return;
      }
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
