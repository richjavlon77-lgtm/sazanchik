"use client";

// Offline order queue: if a guest places an order without connection, we keep
// it locally and resend when the network is back. Each payload carries a stable
// idempotencyKey, so a resend can never create a duplicate on the server.

const KEY = "sazanchik:orderQueue";
const MAX = 20;

type Queued = { body: Record<string, unknown>; at: number };

function read(): Queued[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(q: Queued[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q.slice(-MAX)));
  } catch {
    /* storage full / unavailable */
  }
}

export function queueCount(): number {
  return read().length;
}

export function enqueueOrder(body: Record<string, unknown>) {
  const q = read();
  q.push({ body, at: Date.now() });
  write(q);
  window.dispatchEvent(new Event("sazanchik:queue-changed"));
}

/** Try to send all queued orders. `sent` actually reached the kitchen;
 *  `rejected` were permanently refused by the server (e.g. price/stock
 *  changed) and dropped — the guest must be told, not congratulated.
 *  5xx/429/offline items are kept for the next attempt. */
export async function flushOrderQueue(): Promise<{
  sent: number;
  rejected: number;
}> {
  const q = read();
  if (!q.length) return { sent: 0, rejected: 0 };

  const remaining: Queued[] = [];
  let sent = 0;
  let rejected = 0;

  for (let i = 0; i < q.length; i++) {
    const item = q[i];
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
        keepalive: true,
      });
      if (res.ok) {
        sent++; // 200 (dedup) or 201 — done
      } else if (res.status === 429 || res.status >= 500) {
        remaining.push(item); // transient — retry later
      } else {
        rejected++; // 4xx (e.g. price changed) — will never succeed, drop it
      }
    } catch {
      // offline again — keep this and the rest, stop trying
      remaining.push(...q.slice(i));
      break;
    }
  }

  write(remaining);
  window.dispatchEvent(new Event("sazanchik:queue-changed"));
  return { sent, rejected };
}
