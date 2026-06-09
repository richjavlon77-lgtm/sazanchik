"use client";

import { useEffect, useState } from "react";

const TABLE_KEY = "sazanchik:table";
const TOKEN_KEY = "sazanchik:tableToken";

/** Display number lives before the last "." of a signed token "5.<sig>". */
function numberOf(token: string): string {
  const i = token.lastIndexOf(".");
  return i > 0 ? token.slice(0, i) : token;
}

/**
 * Resolves the guest's table:
 * - `?t=<signed>` from a QR → verified table (token kept to send to the server,
 *   which validates the HMAC; the number can't be forged).
 * - `?table=N` or manual entry → unverified fallback (no token).
 * Cached in localStorage. Returns null until mounted on the client.
 */
export function useTableNumber(): {
  table: string | null;
  tableToken: string | null;
  setTable: (v: string | null) => void;
} {
  const [table, setTableState] = useState<string | null>(null);
  const [tableToken, setTableToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // 1) Signed QR token
    const signed = params.get("t");
    if (signed) {
      const num = numberOf(signed);
      localStorage.setItem(TABLE_KEY, num);
      localStorage.setItem(TOKEN_KEY, signed);
      setTableState(num);
      setTableToken(signed);
      return;
    }

    // 2) Legacy / manual ?table=N (unverified)
    const fromUrl = params.get("table");
    if (fromUrl) {
      localStorage.setItem(TABLE_KEY, fromUrl);
      localStorage.removeItem(TOKEN_KEY);
      setTableState(fromUrl);
      setTableToken(null);
      return;
    }

    // 3) Restore from storage
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(TABLE_KEY);
    if (storedToken) {
      setTableToken(storedToken);
      setTableState(numberOf(storedToken));
    } else if (stored) {
      setTableState(stored);
    }
  }, []);

  // Manual entry → unverified (clears any signed token)
  const setTable = (v: string | null) => {
    if (v) {
      localStorage.setItem(TABLE_KEY, v);
    } else {
      localStorage.removeItem(TABLE_KEY);
    }
    localStorage.removeItem(TOKEN_KEY);
    setTableToken(null);
    setTableState(v);
  };

  return { table, tableToken, setTable };
}
