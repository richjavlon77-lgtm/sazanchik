"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Последний рубеж: упал корневой layout. Показываем гостю аккуратную
 * заглушку в стиле бренда и отправляем ошибку в Sentry (если включён).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#101613",
          color: "#f7f2e8",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <p style={{ fontSize: 40, margin: 0, fontStyle: "italic" }}>
            Сазанчик
          </p>
          <p style={{ opacity: 0.7, margin: "12px 0 24px" }}>
            Что-то пошло не так. Мы уже знаем и чиним.
          </p>
          <button
            onClick={reset}
            style={{
              border: "1px solid #c5a35c",
              background: "transparent",
              color: "#c5a35c",
              padding: "10px 28px",
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 14,
              letterSpacing: "0.1em",
            }}
          >
            Обновить
          </button>
        </div>
      </body>
    </html>
  );
}
