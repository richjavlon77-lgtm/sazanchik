import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { closeShift } from "@/lib/staff-shifts";

export async function POST() {
  // Close the staff member's open shift before clearing the session.
  const session = await getSession();
  if (session?.waiterId) await closeShift(session.waiterId);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE.name, "", {
    ...SESSION_COOKIE.options,
    maxAge: 0,
  });
  return res;
}
