import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "sazanchik_session";
const EXPIRES_IN_DAYS = 30;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type Role =
  | "manager"
  | "waiter"
  | "bartender"
  | "hookah"
  | "cook"
  | "cold"
  | "meat";

/** Staff roles that log in by PIN (everyone except the password-based manager) */
export type StaffRole =
  | "waiter"
  | "bartender"
  | "hookah"
  | "cook"
  | "cold"
  | "meat";

export type SessionPayload = {
  role: Role;
  waiterId?: string;
  name?: string;
  /** legacy manager sessions issued before roles existed */
  admin?: true;
  iat?: number;
  exp?: number;
};

async function sign(
  payload: Record<string, unknown>,
  expiresIn: string
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

/** Manager (admin) session */
export async function createSessionToken(): Promise<string> {
  return sign({ role: "manager" }, `${EXPIRES_IN_DAYS}d`);
}

/** Staff session — tied to a staff member; role is "waiter" or "bartender" */
export async function createWaiterSession(
  waiterId: string,
  name: string,
  role: StaffRole = "waiter"
): Promise<string> {
  return sign({ role, waiterId, name }, `${EXPIRES_IN_DAYS}d`);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const p = payload as SessionPayload;
    const roles = [
      "manager",
      "waiter",
      "bartender",
      "hookah",
      "cook",
      "cold",
      "meat",
    ];
    if (roles.includes(p.role)) return p;
    // Backward-compat: sessions signed before roles were introduced
    if ((p as { admin?: boolean }).admin === true) return { role: "manager" };
    return null;
  } catch {
    return null;
  }
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (password.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: EXPIRES_IN_DAYS * 24 * 60 * 60,
  },
};
