"use client";

/**
 * Shared client-state primitives built on useSyncExternalStore — the
 * React-sanctioned way to read external stores (localStorage, navigator)
 * without setState-in-effect hydration hacks.
 *
 * Server snapshots return safe defaults, so SSR markup stays deterministic
 * and React swaps in the real client value right after hydration.
 *
 * Bonus: localStorage values sync across tabs via the `storage` event.
 */
import { useCallback, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// useHydrated — `false` on the server / first paint, `true` after hydration.
// Replaces the `const [mounted, setMounted] = useState(false)` + effect dance.
// ---------------------------------------------------------------------------

const emptySubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// ---------------------------------------------------------------------------
// localStorage store
// ---------------------------------------------------------------------------

const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // Safari private mode / storage disabled
  }
}

/** Write (or remove with `null`) and notify every subscribed component. */
export function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  emit(key);
}

/**
 * Subscribe to a localStorage key. Returns the raw string (or null).
 * Parse JSON with useMemo on the caller side.
 */
export function useLocalString(key: string): string | null {
  const subscribe = useCallback(
    (cb: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(cb);
      // Cross-tab updates
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) cb();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key]
  );

  return useSyncExternalStore(
    subscribe,
    () => readLocal(key),
    () => null
  );
}

// ---------------------------------------------------------------------------
// useOnline — navigator.onLine as a store (the textbook uSES example).
// ---------------------------------------------------------------------------

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
}
