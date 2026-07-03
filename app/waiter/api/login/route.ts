import { NextResponse } from "next/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createWaiterSession, SESSION_COOKIE } from "@/lib/auth";
import { verifyPin, isValidPin } from "@/lib/staff-auth";
import { rateLimitResponse } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { openShift } from "@/lib/staff-shifts";

export async function POST(request: Request) {
  const ip = clientIp(request);

  let body: { pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const pin = (body.pin ?? "").trim();
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: "PIN — это 4 цифры" }, { status: 422 });
  }

  // Two limits: a loose per-IP ceiling so one person fumbling a PIN at
  // shift-change can't lock out the whole floor sharing the venue Wi-Fi/NAT,
  // plus a tight per-IP+PIN limit so brute-forcing any single PIN is still
  // capped (varying the guessed PIN doesn't reset this one).
  const rl = rateLimitResponse(`waiter-login:${ip}`, {
    limit: 30,
    windowMs: 60_000,
  });
  const rlPin = rateLimitResponse(`waiter-login-pin:${ip}:${pin}`, {
    limit: 6,
    windowMs: 60_000,
  });
  if (rl.status === 429 || rlPin.status === 429) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите минуту." },
      { status: 429, headers: rl.status === 429 ? rl.headers : rlPin.headers }
    );
  }

  // Find an active staff member whose PIN matches (salted hashes → check each)
  const active = await db.select().from(staff).where(eq(staff.isActive, true));
  const match = active.find((s) => verifyPin(pin, s.pinHash));

  if (!match) {
    await new Promise((r) => setTimeout(r, 300));
    return NextResponse.json(
      { error: "Неверный PIN" },
      { status: 401, headers: rl.headers }
    );
  }

  const allowed = [
    "waiter",
    "bartender",
    "hookah",
    "cook",
    "cold",
    "meat",
  ] as const;
  const role = (allowed as readonly string[]).includes(match.role)
    ? (match.role as (typeof allowed)[number])
    : "waiter";
  const token = await createWaiterSession(match.id, match.name, role);
  // Open a shift for this staff member (best-effort — never blocks login)
  await openShift(match.id, match.name, role);
  const res = NextResponse.json(
    { ok: true, name: match.name, role },
    { headers: rl.headers }
  );
  res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
  return res;
}
