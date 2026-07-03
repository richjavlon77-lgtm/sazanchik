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

/**
 * Strict-QR mode. When `REQUIRE_TABLE_TOKEN` is on, every dine-in action
 * (order / waiter call) MUST carry a valid signed token — a bare `?table=N`
 * is rejected. Turn this on once all physical QR codes are signed ones, to
 * fully close table-spoofing. Default off, so legacy plain links keep working.
 */
export function tableTokenRequired(): boolean {
  const v = process.env.REQUIRE_TABLE_TOKEN;
  return v === "1" || v === "true";
}

export type TableResolution =
  | { ok: true; table: string }
  | { ok: false; error: string; status: number };

/**
 * Resolve the authoritative table from a request's `(tableNumber, tableToken)`:
 *  - valid token  → its verified number (authoritative, cannot be forged)
 *  - bad token     → reject (tampering)
 *  - no token      → use tableNumber, unless strict-QR mode requires a token
 * Centralised so the order and call-waiter routes stay consistent.
 */
export function resolveTable(
  tableNumber: string,
  tableToken?: string
): TableResolution {
  if (tableToken) {
    const verified = verifyTableToken(tableToken);
    if (!verified) {
      return { ok: false, error: "Недействительный QR-код стола", status: 403 };
    }
    return { ok: true, table: verified };
  }
  if (tableTokenRequired()) {
    return {
      ok: false,
      error: "Отсканируйте QR-код стола, чтобы сделать заказ",
      status: 403,
    };
  }
  return { ok: true, table: tableNumber };
}
