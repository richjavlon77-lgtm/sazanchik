import { NextResponse } from "next/server";
import { desc, gt } from "drizzle-orm";
import { db } from "@/db";
import { staffMessages } from "@/db/schema";
import { getSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { sql as dsql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  manager: "Менеджер",
  waiter: "Официант",
  bartender: "Бармен",
  hookah: "Кальянщик",
  cook: "Повар",
  cold: "Холодный цех",
  meat: "Мангал",
};

/** Внутренний чат персонала — только под staff/manager-сессией. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const after = new URL(request.url).searchParams.get("after");
  const base = db.select().from(staffMessages);
  const rows = after
    ? await base
        .where(gt(staffMessages.createdAt, new Date(after)))
        .orderBy(desc(staffMessages.createdAt))
        .limit(100)
    : await base.orderBy(desc(staffMessages.createdAt)).limit(100);

  return NextResponse.json(
    {
      me: session.name ?? ROLE_LABEL[session.role] ?? session.role,
      // менеджерский вход безличный (общий пароль) — UI даст представиться
      canSetName: session.role === "manager" && !session.name,
      messages: rows.reverse().map((m) => ({
        id: m.id,
        name: m.authorName,
        role: ROLE_LABEL[m.authorRole] ?? m.authorRole,
        text: m.text,
        at: m.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { text?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Имена персонала приходят из PIN-сессии (не подделать); безликий
  // менеджер подписывается сам — имя из поля в шапке чата.
  const customName =
    session.role === "manager" && !session.name
      ? (body.name ?? "").trim().slice(0, 40)
      : "";
  const author =
    customName || session.name || ROLE_LABEL[session.role] || session.role;
  if (!checkRateLimit(`chat:${author}`, { limit: 20, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "Слишком часто" }, { status: 429 });
  }

  const text = (body.text ?? "").trim().slice(0, 500);
  if (!text) return NextResponse.json({ error: "Пустое сообщение" }, { status: 422 });

  await db.insert(staffMessages).values({
    authorName: author,
    authorRole: session.role,
    text,
  });
  // Разбудить чат на всех устройствах через общий SSE-канал
  await db.execute(dsql`select pg_notify('staff_chat', 'x')`).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
