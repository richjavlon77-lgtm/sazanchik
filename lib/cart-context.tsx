"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { readLocal, writeLocal } from "@/lib/local-store";

export type CartLine = {
  id: string;
  /** stable key for variant if any */
  variantKey?: string;
  qty: number;
  price: number;
  /** snapshot of name for display in cart */
  name: { ru: string; uz: string; en: string };
  /** optional variant label snapshot */
  variantLabel?: { ru: string; uz: string; en: string };
};

type CartContextValue = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">) => void;
  remove: (id: string, variantKey?: string) => void;
  inc: (id: string, variantKey?: string) => void;
  dec: (id: string, variantKey?: string) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  total: number;
  service: number;
  isBirthday: boolean;
  setBirthday: (v: boolean) => void;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
};

const STORAGE_KEY = "sazanchik:cart";
const SERVICE_RATE = 0.2;
const BIRTHDAY_RATE = 0.1;

const CartContext = createContext<CartContextValue | null>(null);

function keyOf(id: string, variantKey?: string) {
  return variantKey ? `${id}::${variantKey}` : id;
}

function parseLines(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLinesState] = useState<CartLine[]>(() => {
    return parseLines(readLocal(STORAGE_KEY));
  });
  const [isOpen, setOpen] = useState(false);
  const [isBirthday, setBirthday] = useState(false);

  // Sync to localStorage on every change
  useEffect(() => {
    writeLocal(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  // Cross-tab sync via storage event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLinesState(parseLines(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLines = useCallback(
    (updater: (prev: CartLine[]) => CartLine[]) => {
      setLinesState((prev) => updater(prev));
    },
    []
  );

  const add = useCallback((line: Omit<CartLine, "qty">) => {
    setLines((prev) => {
      const k = keyOf(line.id, line.variantKey);
      const existing = prev.find((l) => keyOf(l.id, l.variantKey) === k);
      if (existing) {
        return prev.map((l) =>
          keyOf(l.id, l.variantKey) === k ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { ...line, qty: 1 }];
    });
  }, [setLines]);

  const inc = useCallback((id: string, variantKey?: string) => {
    const k = keyOf(id, variantKey);
    setLines((prev) =>
      prev.map((l) => (keyOf(l.id, l.variantKey) === k ? { ...l, qty: l.qty + 1 } : l))
    );
  }, [setLines]);

  const dec = useCallback((id: string, variantKey?: string) => {
    const k = keyOf(id, variantKey);
    setLines((prev) =>
      prev
        .map((l) =>
          keyOf(l.id, l.variantKey) === k ? { ...l, qty: l.qty - 1 } : l
        )
        .filter((l) => l.qty > 0)
    );
  }, [setLines]);

  const remove = useCallback((id: string, variantKey?: string) => {
    const k = keyOf(id, variantKey);
    setLines((prev) => prev.filter((l) => keyOf(l.id, l.variantKey) !== k));
  }, [setLines]);

  const clear = useCallback(() => {
    setLines(() => []);
    setBirthday(false);
  }, [setLines]);

  const totalItems = useMemo(
    () => lines.reduce((acc, l) => acc + l.qty, 0),
    [lines]
  );
  const subtotal = useMemo(
    () => lines.reduce((acc, l) => acc + l.qty * l.price, 0),
    [lines]
  );
  const discount = useMemo(
    () => (isBirthday ? Math.round(subtotal * BIRTHDAY_RATE) : 0),
    [isBirthday, subtotal]
  );
  const service = useMemo(
    () => Math.round((subtotal - discount) * SERVICE_RATE),
    [subtotal, discount]
  );
  const total = subtotal - discount + service;

  return (
    <CartContext.Provider
      value={{
        lines,
        add,
        remove,
        inc,
        dec,
        clear,
        totalItems,
        subtotal,
        discount,
        total,
        service,
        isBirthday,
        setBirthday,
        isOpen,
        setOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
