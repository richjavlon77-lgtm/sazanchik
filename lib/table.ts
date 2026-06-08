"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sazanchik:table";

/**
 * Reads table number from URL (?table=5) or localStorage, caches in localStorage.
 * Returns null until mounted on client.
 */
export function useTableNumber(): {
  table: string | null;
  setTable: (v: string | null) => void;
} {
  const [table, setTableState] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("table");
    if (fromUrl) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
      setTableState(fromUrl);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setTableState(stored);
  }, []);

  const setTable = (v: string | null) => {
    if (v) {
      localStorage.setItem(STORAGE_KEY, v);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setTableState(v);
  };

  return { table, setTable };
}
