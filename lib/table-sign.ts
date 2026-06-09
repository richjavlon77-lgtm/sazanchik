import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed table tokens. A QR code encodes `<number>.<sig>` where sig is an HMAC
 * of the table number. The client can read the number (for display) but cannot
 * forge a token for another table — so nobody can change ?t= and spam a neighbour.
 * Verification happens server-side on order / call / reservation.
 */
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function sig(num: string): string {
  return createHmac("sha256", secret()).update(`table:${num}`).digest("hex").slice(0, 16);
}

export function signTable(num: string): string {
  return `${num}.${sig(num)}`;
}

/** Returns the verified table number, or null if the token is forged/invalid. */
export function verifyTableToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const num = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  if (!/^\d{1,6}$/.test(num)) return null;
  const expected = sig(num);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? num : null;
}
