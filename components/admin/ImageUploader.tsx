"use client";

import Image from "next/image";
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

        {/* URL field + dropzone */}
        <div className="space-y-2">
          <input
            type="url"
            placeholder="https://... (ссылка на картинку из Telegram, Imgur, и т.д.)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold/50"
          />

          <label
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/30 px-3 py-3 text-xs text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? "Загружаем…" : "↑ Выбрать файл (или вставь URL выше)"}
          </label>

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
        </div>
      </div>
    </div>
  );
}
