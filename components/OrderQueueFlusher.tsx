"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { flushOrderQueue, queueCount } from "@/lib/order-queue";

/** Resends any queued (offline) orders when the connection returns. Mounted
 *  once for guests. Renders nothing. */
export function OrderQueueFlusher() {
  useEffect(() => {
    let busy = false;
    const run = async () => {
      if (busy || !navigator.onLine || queueCount() === 0) return;
      busy = true;
      try {
        const { sent, rejected } = await flushOrderQueue();
        if (sent > 0) {
          toast.success(
            sent === 1
              ? "Отложенный заказ отправлен ✓"
              : `Отправлено отложенных заказов: ${sent} ✓`
          );
        }
        if (rejected > 0) {
          toast.error(
            rejected === 1
              ? "Отложенный заказ не прошёл — оформите его заново"
              : `Отложенных заказов не прошло: ${rejected} — оформите их заново`
          );
        }
      } finally {
        busy = false;
      }
    };

    run();
    window.addEventListener("online", run);
    window.addEventListener("sazanchik:queue-changed", run);
    const id = setInterval(run, 15000);
    return () => {
      window.removeEventListener("online", run);
      window.removeEventListener("sazanchik:queue-changed", run);
      clearInterval(id);
    };
  }, []);

  return null;
}
