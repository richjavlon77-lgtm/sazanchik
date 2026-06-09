import { NextResponse } from "next/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createWaiterSession, SESSION_COOKIE } from "@/lib/auth";
import { verifyPin, isValidPin } from "@/lib/staff-auth";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  const rl = rateLimitResponse(`waiter-login:${ip}`, {
    limit: 8,
    windowMs: 60_000,
  });
  if (rl.status === 429) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите минуту." },
      { status: 429, headers: rl.headers }
    );
  }

  let body: { pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const pin = (body.pin ?? "").trim();
  if (!isValidPin(pin)) {
    return NextResponse.json(
      { error: "PIN — это 4 цифры" },
      { status: 422, headers: rl.headers }
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

  const token = await createWaiterSession(match.id, match.name);
  const res = NextResponse.json(
    { ok: true, name: match.name },
    { headers: rl.headers }
  );
  res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
  return res;
}
