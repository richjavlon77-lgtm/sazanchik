"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Telegram?: { WebApp?: { ready: () => void; expand: () => void } };
  }
}

/**
 * Интеграция Telegram-мини-аппа. Когда сайт открыт из бота
 * (в URL приходит #tgWebAppData=...), подгружаем официальный скрипт
 * Telegram и разворачиваем окно на весь экран. В обычном браузере —
 * ничего не делает и ничего не грузит.
 */
export function TelegramMiniApp() {
  useEffect(() => {
    if (!window.location.hash.includes("tgWebAppData")) return;
    if (document.getElementById("tg-webapp-js")) return;

    const s = document.createElement("script");
    s.id = "tg-webapp-js";
    s.src = "https://telegram.org/js/telegram-web-app.js";
    s.async = true;
    s.onload = () => {
      try {
        window.Telegram?.WebApp?.ready();
        window.Telegram?.WebApp?.expand();
      } catch {
        /* не критично — сайт работает и без нативных фич */
      }
    };
    document.head.appendChild(s);
  }, []);

  return null;
}
