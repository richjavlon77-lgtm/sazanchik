"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SazanFish } from "@/components/icons/SazanFish";

export default function WaiterLoginPage() {
  return (
    <Suspense>
      <PinLogin />
    </Suspense>
  );
}

function PinLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/waiter";
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/waiter/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Неверный PIN");
        setPin("");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Ошибка сети");
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && !busy) submit(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const press = (d: string) => {
    if (busy) return;
    setError(null);
    setPin((p) => (p.length < 4 ? p + d : p));
  };
  const back = () => setPin((p) => p.slice(0, -1));

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-background px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <SazanFish className="mb-3 h-9 w-auto text-gold" />
        <h1 className="font-heading text-2xl">
          <span className="italic text-gold">О</span>фициант
        </h1>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Введите свой PIN
        </p>
      </div>

      {/* PIN dots */}
      <div className="mb-2 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={
              "size-3.5 rounded-full border transition-all duration-200 " +
              (i < pin.length
                ? "border-gold bg-gold"
                : "border-muted-foreground/40")
            }
          />
        ))}
      </div>
      <div className="h-5 text-xs text-red-400">{error}</div>

      {/* Keypad */}
      <div className="mt-4 grid w-full max-w-[260px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <KeypadButton key={d} onClick={() => press(d)}>
            {d}
          </KeypadButton>
        ))}
        <div />
        <KeypadButton onClick={() => press("0")}>0</KeypadButton>
        <KeypadButton onClick={back} aria-label="Стереть">
          ⌫
        </KeypadButton>
      </div>
    </main>
  );
}

function KeypadButton({
  children,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-16 items-center justify-center rounded-2xl border border-border bg-card/40 font-heading text-2xl text-foreground transition-all duration-150 hover:border-gold/40 active:scale-95 active:bg-gold/10"
      {...rest}
    >
      {children}
    </button>
  );
}
