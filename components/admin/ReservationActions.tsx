"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setReservationStatus } from "@/lib/admin-actions";
import { cn } from "@/lib/utils";

type Status = "new" | "confirmed" | "seated" | "cancelled";

const NEXT: { value: Status; label: string; cls: string }[] = [
  { value: "confirmed", label: "Подтвердить", cls: "border-gold/40 text-gold hover:bg-gold hover:text-primary-foreground" },
  { value: "seated", label: "Посадили", cls: "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white" },
  { value: "cancelled", label: "Отмена", cls: "border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white" },
];

export function ReservationActions({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const [pending, start] = useTransition();

  const apply = (next: Status) => {
    start(async () => {
      try {
        await setReservationStatus(id, next);
        toast.success("Статус обновлён");
      } catch {
        toast.error("Не удалось обновить");
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {NEXT.filter((n) => n.value !== status).map((n) => (
        <button
          key={n.value}
          onClick={() => apply(n.value)}
          disabled={pending}
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider transition-colors disabled:opacity-40",
            n.cls
          )}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}
