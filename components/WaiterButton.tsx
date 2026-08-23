"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLocale, t, UI_STRINGS } from "@/lib/i18n";
import { useTableNumber } from "@/lib/table";
import { guestTableLabel } from "@/lib/tables";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { PayBill } from "@/components/PayBill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CallType = "waiter" | "bill" | "water";

export function WaiterButton() {
  const { locale } = useLocale();
  const { table, tableToken, setTable } = useTableNumber();
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [tableInput, setTableInput] = useState(table ?? "");
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<{
    type: CallType;
    tableNum: string;
  } | null>(null);
  const hasCart = totalItems > 0;

  const submit = (type: CallType) => {
    const t1 = table || tableInput.trim();
    if (!t1) return;
    if (!table) setTable(t1);

    // Optimistic UI: show the "sending" badge immediately for a responsive
    // feel, but the success toast only fires once the server confirms —
    // otherwise a failed call still tells the guest help is on the way.
    setOptimisticStatus({ type, tableNum: t1 });
    setOpen(false);

    const messages: Record<CallType, { ru: string; uz: string; en: string }> = {
      waiter: UI_STRINGS.call_waiter_desc as { ru: string; uz: string; en: string },
      bill: UI_STRINGS.bill_request as { ru: string; uz: string; en: string },
      water: UI_STRINGS.water_request as { ru: string; uz: string; en: string },
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/orders/call-waiter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableNumber: t1, tableToken: tableToken ?? undefined, type }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("Waiter call API error:", data.error ?? res.status);
          setOptimisticStatus(null);
          toast.error("Не удалось вызвать — попробуйте ещё раз", {
            description: guestTableLabel(t1, t(UI_STRINGS.table, locale)),
          });
          return;
        }

        toast.success(t(UI_STRINGS.call_sent, locale), {
          description: `${guestTableLabel(t1, t(UI_STRINGS.table, locale))} · ${t(messages[type], locale)}`,
        });
      } catch (err) {
        console.error("Waiter call network error:", err);
        setOptimisticStatus(null);
        toast.error("Нет сети — вызов не отправлен, попробуйте ещё раз", {
          description: guestTableLabel(t1, t(UI_STRINGS.table, locale)),
        });
        return;
      }
      setOptimisticStatus(null);
    });
  };

  const statusLabel = (() => {
    if (!optimisticStatus) return null;
    const labels: Record<CallType, string> = {
      waiter: "Официант приглашён",
      bill: "Счёт запрошен",
      water: "Вода запрошена",
    };
    return `${labels[optimisticStatus.type]} · ${guestTableLabel(optimisticStatus.tableNum, t(UI_STRINGS.table, locale))}`;
  })();

  return (
    <>
      <button
        onClick={() => {
          setTableInput(table ?? "");
          setOpen(true);
        }}
        className={cn(
          "fixed right-5 z-50 flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_8px_32px_-8px_rgba(212,178,106,0.6)] transition-all duration-500 hover:scale-105 active:scale-95",
          "md:right-8",
          hasCart ? "bottom-24 md:bottom-28" : "bottom-safe-5 md:bottom-8",
          pending && "opacity-80"
        )}
        aria-label={t(UI_STRINGS.call_waiter_title, locale)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("size-5", pending && "animate-pulse")}
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        <span className="hidden sm:inline">
          {optimisticStatus
            ? "✓ Отправлено"
            : t(UI_STRINGS.call_waiter_short, locale)}
        </span>
        {table && !optimisticStatus && (
          <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[11px] tabular-nums">
            #{table}
          </span>
        )}
      </button>

      {/* Status toast bar when optimistic */}
      {optimisticStatus && (
        <div className="fixed bottom-36 left-1/2 z-50 -translate-x-1/2 md:bottom-8">
          <div className="animate-in slide-in-from-bottom-4 rounded-full border border-gold/30 bg-card/95 px-5 py-2 text-xs backdrop-blur-md shadow-lg">
            <span className="text-gold">✓</span> {statusLabel}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-gold/30 bg-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {t(UI_STRINGS.call_waiter_title, locale)}
            </DialogTitle>
            <DialogDescription>
              {t(UI_STRINGS.call_waiter_desc, locale)}
            </DialogDescription>
          </DialogHeader>

          {!table && (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-gold">
                {t(UI_STRINGS.table_number_prompt, locale)}
              </label>
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                placeholder="12"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-2xl font-heading tabular-nums outline-none focus:border-gold/50"
              />
            </div>
          )}

          {table && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t(UI_STRINGS.table, locale)}
              </span>
              <span className="font-heading text-2xl tabular-nums text-gold">
                #{table}
              </span>
              <button
                onClick={() => setTable(null)}
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                {t(UI_STRINGS.search_clear, locale)}
              </button>
            </div>
          )}

          {/* Онлайн-оплата счёта — рендерится только с подключённым
              мерчантом (Payme/Click) и открытым счётом стола */}
          <PayBill className="mt-2" />

          <div className="mt-2 grid gap-2">
            <ActionRow
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10 21a2 2 0 0 0 4 0" />
                </svg>
              }
              label={t(UI_STRINGS.general_call, locale)}
              onClick={() => submit("waiter")}
              disabled={!(table || tableInput.trim()) || pending}
            />
            <ActionRow
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
              }
              label={t(UI_STRINGS.bill_request, locale)}
              onClick={() => submit("bill")}
              disabled={!(table || tableInput.trim()) || pending}
            />
            <ActionRow
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
                  <path d="M12 2 C 16 8, 20 12, 20 16 A 8 8 0 0 1 4 16 C 4 12, 8 8, 12 2 Z" />
                </svg>
              }
              label={t(UI_STRINGS.water_request, locale)}
              onClick={() => submit("water")}
              disabled={!(table || tableInput.trim()) || pending}
            />
          </div>

          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              {t(UI_STRINGS.cancel, locale)}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-left text-sm transition-all",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-gold/40 hover:bg-gold/5 hover:text-gold"
      )}
    >
      <span className="text-gold">{icon}</span>
      <span className="flex-1">{label}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4 opacity-60">
        <path d="M9 6l6 6-6 6" strokeLinecap="round" />
      </svg>
    </button>
  );
}
