import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tableSessions } from "@/db/schema";
import { verifyTableToken } from "@/lib/table-sign";
import { loadOpenBill } from "@/lib/payments/bill";
import { paymeConfig, clickConfig, paymentsEnabled } from "@/lib/payments/config";
import { buildPaymeCheckoutUrl, buildClickPayUrl } from "@/lib/payments/core";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

/**
 * Счёт стола для ГОСТЯ: сумма к оплате + ссылки Payme/Click.
 * Только по подписанному QR-токену (`?t=`) — ручной номер стола не
 * принимается, чтобы нельзя было подглядывать чужие счета перебором.
 * Пока платёжные провайдеры не подключены — { enabled: false }.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);
  if (!checkRateLimit(`bill-ip:${ip}`, { limit: 30, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "Слишком часто" }, { status: 429 });
  }

  if (!paymentsEnabled()) {
    return NextResponse.json(
      { enabled: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const token = new URL(request.url).searchParams.get("t") ?? "";
  const table = verifyTableToken(token);
  if (!table) {
    return NextResponse.json({ error: "Недействительный QR-код стола" }, { status: 403 });
  }

  const [session] = await db
    .select({ id: tableSessions.id })
    .from(tableSessions)
    .where(
      and(eq(tableSessions.tableNumber, table), eq(tableSessions.status, "open"))
    );
  if (!session) {
    // Заказов ещё нет — счёта нет
    return NextResponse.json(
      { enabled: true, open: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const bill = await loadOpenBill(session.id);
  if (!bill) {
    return NextResponse.json(
      { enabled: true, open: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const payme = paymeConfig();
  const click = clickConfig();
  return NextResponse.json(
    {
      enabled: true,
      open: true,
      total: bill.total,
      paidOnline: bill.paidOnline,
      due: bill.due,
      paymeUrl:
        payme && bill.due > 0
          ? buildPaymeCheckoutUrl(payme.merchantId, bill.sessionId, bill.due)
          : null,
      clickUrl:
        click && bill.due > 0
          ? buildClickPayUrl(click.serviceId, click.merchantId, bill.sessionId, bill.due)
          : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
