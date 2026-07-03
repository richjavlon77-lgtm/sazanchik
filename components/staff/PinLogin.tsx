"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SazanFish } from "@/components/icons/SazanFish";

export type StaffVariant =
  | "waiter"
  | "bartender"
  | "hookah"
  | "cook"
  | "cold"
  | "meat";

const HEADINGS: Record<StaffVariant, string> = {
  waiter: "Официант",
  bartender: "Бармен",
  hookah: "Кальянщик",
  cook: "Повар",
  cold: "Холодный цех",
  meat: "Мясной цех",
};

const ROLE_HOME: Record<string, string> = {
  bartender: "/bar",
  hookah: "/hookah",
  cook: "/kitchen",
  cold: "/cold",
  meat: "/meat",
  waiter: "/waiter",
};

/** Shared PIN keypad for every staff contour. The destination after login
 *  follows the staff member's real role (returned by the API), so a single
 *  PIN always lands the person in their own panel. */
export function PinLogin({
  variant,
  heading,
}: {
  variant: StaffVariant;
  /** overrides the role name — the unified staff cover uses "Панель персонала" */
  heading?: string;
}) {
  return (
    <Suspense>
      <PinPad variant={variant} heading={heading} />
    </Suspense>
  );
}

function PinPad({
  variant,
  heading: headingOverride,
}: {
  variant: StaffVariant;
  heading?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const explicitNext = params.get("next");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const heading = headingOverride ?? HEADINGS[variant];

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
      const j = (await res.json().catch(() => ({}))) as { role?: string };
      const home = ROLE_HOME[j.role ?? "waiter"] ?? "/waiter";
      router.push(explicitNext || home);
      router.refresh();
    } catch {
      setError("Ошибка сети");
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  // Auto-submit lives in the event handler (not an effect): the moment the
  // 4th digit is pressed we know the full PIN and can fire the request.
  const press = (d: string) => {
    if (busy) return;
    setError(null);
    const next = pin.length < 4 ? pin + d : pin;
    setPin(next);
    if (next.length === 4 && pin.length === 3) void submit(next);
  };
  const back = () => setPin((p) => p.slice(0, -1));

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-background px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <SazanFish className="mb-3 h-10 w-auto text-foreground" />
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-[26px] font-semibold leading-none">
            Сазанчик
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gold">
            City
          </span>
        </div>
        <p className="mt-3 font-heading text-lg text-foreground">{heading}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Введите свой PIN
        </p>
      </div>

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
