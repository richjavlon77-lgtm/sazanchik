/** Restaurant's fixed timezone — Tashkent has no DST, so a static offset is
 *  always correct. */
export const TASHKENT_OFFSET = "+05:00";

/**
 * Parses a `datetime-local` input value ("YYYY-MM-DDTHH:mm[:ss]") as
 * Asia/Tashkent time into a correct UTC Date.
 *
 * `new Date(str)` on a bare local string (no timezone suffix) parses in the
 * *server's* timezone, which is UTC on Vercel — not the admin/guest's
 * Tashkent time. Without this, a "20:00" entry silently lands 5 hours off.
 */
export function parseTashkentLocal(value: string): Date {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return new Date(NaN);
  const [, y, mo, d, h, mi, s] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s ?? "00"}${TASHKENT_OFFSET}`);
}
