import postgres from "postgres";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DIRECT_URL =
  process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;

/**
 * Server-Sent Events stream for the waiter board. Uses Postgres LISTEN on the
 * `waiter_events` channel (a direct, non-pooled connection) so new orders/calls
 * push to connected devices instantly. The client EventSource auto-reconnects
 * when the serverless function reaches its max duration.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role === undefined) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!DIRECT_URL) {
    return new Response("No direct DB connection", { status: 503 });
  }

  const encoder = new TextEncoder();
  const sql = postgres(DIRECT_URL, { max: 1 });
  let sub: { unlisten: () => Promise<void> } | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (s: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(s));
        } catch {
          /* stream already closed */
        }
      };

      send("retry: 3000\n\n");
      send("data: connected\n\n");

      try {
        sub = await sql.listen("waiter_events", () => send("data: update\n\n"));
      } catch (e) {
        console.error("SSE listen failed:", e);
      }

      heartbeat = setInterval(() => send(": ping\n\n"), 20000);

      const cleanup = async () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        try {
          await sub?.unlisten();
        } catch {
          /* noop */
        }
        try {
          await sql.end({ timeout: 1 });
        } catch {
          /* noop */
        }
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
    async cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      try {
        await sub?.unlisten();
      } catch {
        /* noop */
      }
      try {
        await sql.end({ timeout: 1 });
      } catch {
        /* noop */
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
