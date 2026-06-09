import { db } from "@/db";
import { uploads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const [row] = await db
    .select({ mime: uploads.mime, data: uploads.data })
    .from(uploads)
    .where(eq(uploads.id, id))
    .limit(1);

  if (!row) return new Response("Not found", { status: 404 });

  const bytes = Buffer.from(row.data, "base64");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": row.mime,
      // Images are immutable (new id per upload) → cache hard
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
