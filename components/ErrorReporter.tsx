"use client";

import { useEffect } from "react";

// Browser noise that isn't an actionable app bug.
const IGNORE = [
  "ResizeObserver loop",
  "Script error",
  "Load failed",
  "NetworkError",
  "Failed to fetch",
  "AbortError",
  "cancelled",
];

/** Catches uncaught client errors and reports them (throttled server-side) so
 *  the owner sees real device issues in Telegram. Renders nothing. */
export function ErrorReporter() {
  useEffect(() => {
    const seen = new Set<string>();
    let sent = 0;

    const report = (message: string, stack?: string) => {
      if (!message) return;
      if (IGNORE.some((n) => message.includes(n))) return;
      const sig = message.slice(0, 80);
      if (seen.has(sig)) return; // once per signature per session
      seen.add(sig);
      if (sent >= 10) return; // hard session cap
      sent += 1;
      try {
        const payload = JSON.stringify({
          message,
          stack: stack?.slice(0, 1000),
          url: location.href,
          ua: navigator.userAgent,
        });
        const blob = new Blob([payload], { type: "application/json" });
        if (!navigator.sendBeacon?.("/api/client-error", blob)) {
          fetch("/api/client-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* never throw from the reporter */
      }
    };

    const onError = (e: ErrorEvent) =>
      report(e.message || String(e.error), e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      report(
        r instanceof Error ? r.message : String(r),
        r instanceof Error ? r.stack : undefined
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
