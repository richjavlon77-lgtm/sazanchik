import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/db";
import { uploads } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не получен" }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Файл больше 12 МБ" }, { status: 413 });
    }

    // Normalize: auto-orient by EXIF (phone photos), resize, compress
    const input = Buffer.from(await file.arrayBuffer());
    const optimized = await sharp(input)
      .rotate()
      .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    // Prefer Vercel Blob if connected (CDN); else store in DB (self-contained)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const name = `menu/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const blob = await put(name, optimized, {
        access: "public",
        contentType: "image/jpeg",
      });
      return NextResponse.json({ url: blob.url });
    }

    const [row] = await db
      .insert(uploads)
      .values({ mime: "image/jpeg", data: optimized.toString("base64") })
      .returning({ id: uploads.id });

    return NextResponse.json({ url: `/api/img/${row.id}` });
  } catch (e) {
    console.error("Upload failed:", e);
    return NextResponse.json(
      { error: "Не удалось загрузить фото. Попробуйте другое изображение." },
      { status: 500 }
    );
  }
}
