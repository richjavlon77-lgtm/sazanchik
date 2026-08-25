"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Общий чат персонала. Плавающая кнопка 💬 на каждой рабочей панели
 * (официант, цеха, админка); виден только под сессией — на логин-страницах
 * первый же запрос вернёт 401 и компонент не отрисуется.
 * Живое обновление — событие "chat" в общем SSE-канале + фолбэк-поллинг.
 */

type Msg = { id: string; name: string; role: string; text: string; at: string };

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
  });

export function StaffChat() {
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [me, setMe] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/chat", { cache: "no-store" });
      if (!res.ok) return false;
      const data = (await res.json()) as { me: string; messages: Msg[] };
      setMe(data.me);
      setMessages((prev) => {
        // новые чужие сообщения при закрытой шторке → точка на кнопке
        if (prev.length && data.messages.length > prev.length && !openRef.current) {
          setUnread(true);
        }
        return data.messages;
      });
      setAuthorized(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Первичная загрузка + подписка на SSE + фолбэк-поллинг
  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    // отложенный старт: инициализация вне тела эффекта (внешняя система)
    const boot = setTimeout(() => {
      load().then((ok) => {
        if (!ok || cancelled) return;
        try {
          es = new EventSource("/api/staff/stream");
          es.onmessage = (e) => {
            if (e.data === "chat") load();
          };
        } catch {
          /* поллинг подстрахует */
        }
        poll = setInterval(load, 25_000);
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(boot);
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [load]);

  // Автоскролл вниз при новых сообщениях/открытии
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/staff/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      if (res.ok) {
        setText("");
        await load();
      }
    } finally {
      setSending(false);
    }
  };

  if (!authorized) return null;

  return (
    <>
      {/* Плавающая кнопка */}
      <button
        onClick={() => {
          setOpen(!open);
          setUnread(false);
        }}
        aria-label="Чат персонала"
        className="fixed bottom-24 right-4 z-[60] flex size-12 items-center justify-center rounded-full border border-gold/40 bg-card text-xl shadow-[0_10px_30px_-10px_rgba(23,21,15,0.4)] transition-transform active:scale-90 lg:bottom-6 lg:right-6"
      >
        💬
        {unread && (
          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-card bg-gold" />
        )}
      </button>

      {/* Шторка чата */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <section
            className="fixed bottom-0 right-0 z-[70] flex h-[72vh] w-full flex-col rounded-t-3xl border-t border-gold/25 bg-card shadow-2xl md:bottom-6 md:right-6 md:h-[560px] md:w-[380px] md:rounded-3xl md:border"
            aria-label="Чат персонала"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="font-heading text-lg">Чат персонала</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  видят только сотрудники
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground"
              >
                ✕
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <p className="pt-8 text-center text-sm text-muted-foreground">
                  Пока тихо. Напишите первым 👋
                </p>
              )}
              {messages.map((m) => {
                const mine = m.name === me;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2",
                        mine
                          ? "rounded-br-md bg-gold text-primary-foreground"
                          : "rounded-bl-md border border-border bg-background"
                      )}
                    >
                      <div
                        className={cn(
                          "text-[11px] font-medium",
                          mine ? "text-right text-primary-foreground/90" : "text-gold"
                        )}
                      >
                        {m.name}
                        <span
                          className={cn(
                            "ml-1.5 text-[9px] uppercase tracking-wider",
                            mine ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}
                        >
                          {m.role}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap break-words text-sm leading-snug">
                        {m.text}
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 text-right text-[9px] tabular-nums",
                          mine ? "text-primary-foreground/70" : "text-muted-foreground/70"
                        )}
                      >
                        {fmtTime(m.at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="flex items-end gap-2 border-t border-border p-3 pb-safe-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 500))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Сообщение…"
                className="max-h-28 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold/50"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                aria-label="Отправить"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </footer>
          </section>
        </>
      )}
    </>
  );
}
