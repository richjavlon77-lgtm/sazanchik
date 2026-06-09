import "server-only";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE, type SessionPayload } from "@/lib/auth";

/** Read + verify the current session from the request cookies (server only). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE.name)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
