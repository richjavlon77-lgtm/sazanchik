import { NextResponse } from "next/server";
import { checkAdminPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { rateLimitResponse } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

export async function POST(request: Request) {
  // Rate limit: 5 attempts per minute per IP
  const ip = clientIp(request);

  const rl = rateLimitResponse(`login:${ip}`, { limit: 5, windowMs: 60_000 });

  if (rl.status === 429) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте через минуту." },
      { status: 429, headers: rl.headers }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.password || !checkAdminPassword(body.password)) {
    // Small constant delay to slow brute force
    await new Promise((r) => setTimeout(r, 300));
    return NextResponse.json(
      { error: "Неверный пароль" },
      { status: 401, headers: rl.headers }
    );
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true }, { headers: rl.headers });
  res.cookies.set(SESSION_COOKIE.name, token, SESSION_COOKIE.options);
  return res;
}
