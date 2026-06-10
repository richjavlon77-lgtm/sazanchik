"use client";

import { useState } from "react";

/**
 * Pragmatic image input:
 * - Accepts any image URL (paste from Telegram, Imgur, Instagram, your CDN)
 * - Shows live preview
 * - If BLOB_READ_WRITE_TOKEN is set (Vercel Blob connected), drag-and-drop also works
 */
export function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/admin/api/upload", {
        method: "POST",
        body: form,
      });
      const j = await res.json();
      if (!res.ok || !j.url) {
        setError(j.error || "Upload failed");
        return;
      }
      onChange(j.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[140px_1fr]">
        {/* Preview */}
        <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-card/40">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="preview"
              className="size-full object-cover"
              onError={() => setError("Не удалось загрузить картинку")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="size-10">
                <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>

        {/* Upload (primary) + URL (optional, hidden by default) */}
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/[0.07] px-3 py-3.5 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-primary-foreground">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? "Загружаем…" : "📷 Загрузить фото"}
          </label>
          <p className="text-[11px] text-muted-foreground">
            Выберите фото с телефона или компьютера — оно сразу появится в меню.
          </p>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-red-400"
            >
              Убрать фото
            </button>
          )}

          <details className="pt-1">
            <summary className="cursor-pointer text-[11px] text-muted-foreground/70 hover:text-foreground">
              или вставить ссылку
            </summary>
            <input
              type="url"
              placeholder="https://..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/50"
            />
          </details>
        </div>
      </div>
    </div>
  );
}
