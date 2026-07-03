/* Sazanchik service worker — offline resilience for the guest menu.
   - Static assets (content-hashed) → cache-first (safe: new build = new names).
   - Pages → network-first, fall back to cache, then to the cached home page.
   - API requests are never cached. */
const CACHE = "sazanchik-v1";
const STATIC = /\/(_next\/static|images|fonts|favicon|icon)/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.includes("/api/") ||
    url.pathname.endsWith("/stream")
  )
    return;

  // Static, content-hashed assets → cache-first
  if (STATIC.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Page navigations → network-first, cache fallback, home fallback
  const accept = req.headers.get("accept") || "";
  if (req.mode === "navigate" || accept.includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
          return res;
        } catch {
          return (
            (await caches.match(req)) ||
            (await caches.match("/")) ||
            Response.error()
          );
        }
      })()
    );
  }
});
