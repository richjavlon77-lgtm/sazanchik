import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * PIN hashing for staff. Salted scrypt — stored as "salt:hash".
 * PINs are low-entropy by nature, so brute-force resistance also relies on
 * server-side storage + rate limiting on the login endpoint.
 */
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(pin, salt, 32);
  const known = Buffer.from(hash, "hex");
  if (candidate.length !== known.length) return false;
  return timingSafeEqual(candidate, known);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
