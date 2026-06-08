"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SazanFish } from "@/components/icons/SazanFish";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/admin/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Неверный пароль");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 h-[420px] opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(212, 178, 106, 0.18), transparent 60%)",
        }}
      />

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-gold/20 bg-card/80 p-8 backdrop-blur-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <SazanFish className="mb-4 h-10 w-auto text-gold" />
          <h1 className="font-heading text-2xl">
            <span className="italic text-gold">А</span>дминка
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Сазанчик · вход
          </p>
        </div>

        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Пароль
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none focus:border-gold/50"
          placeholder="••••••••"
        />

        {error && (
          <div className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-6 w-full rounded-full bg-gold py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Проверяем…" : "Войти"}
        </button>

        <a
          href="/"
          className="mt-4 block text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          ← К меню
        </a>
      </form>
    </main>
  );
}
