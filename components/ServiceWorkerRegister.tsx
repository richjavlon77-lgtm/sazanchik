"use client";

import { useEffect } from "react";

/** Registers the offline service worker in production. Renders nothing. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const t = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1500); // after first paint, don't compete with initial load
    return () => clearTimeout(t);
  }, []);
  return null;
}
