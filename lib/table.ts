"use client";

import { useCallback, useEffect } from "react";
import { useLocalString, writeLocal } from "@/lib/local-store";

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
 *
 * State lives in localStorage and is read through useSyncExternalStore, so
 * the effect below only WRITES to the store (sanctioned external-system sync)
 * and every subscribed component re-renders automatically.
 * Returns null until hydrated on the client.
 */
export function useTableNumber(): {
  table: string | null;
  tableToken: string | null;
  setTable: (v: string | null) => void;
} {
  const tableToken = useLocalString(TOKEN_KEY);
  const storedTable = useLocalString(TABLE_KEY);

  // One-time URL → storage sync on mount (QR scan / legacy link).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // 1) Signed QR token
    const signed = params.get("t");
    if (signed) {
      writeLocal(TABLE_KEY, numberOf(signed));
      writeLocal(TOKEN_KEY, signed);
      return;
    }

    // 2) Legacy / manual ?table=N (unverified)
    const fromUrl = params.get("table");
    if (fromUrl) {
      writeLocal(TABLE_KEY, fromUrl);
      writeLocal(TOKEN_KEY, null);
    }
  }, []);

  // Manual entry → unverified (clears any signed token)
  const setTable = useCallback((v: string | null) => {
    writeLocal(TABLE_KEY, v);
    writeLocal(TOKEN_KEY, null);
  }, []);

  const table = tableToken ? numberOf(tableToken) : storedTable;

  return { table, tableToken, setTable };
}
