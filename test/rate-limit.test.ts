import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// Each test uses a unique key so the shared module-level store stays isolated.
let n = 0;
const key = () => `test-${Date.now()}-${n++}`;

describe("checkRateLimit", () => {
  it("allows up to the limit, then blocks", () => {
    const k = key();
    const cfg = { limit: 3, windowMs: 60_000 };
    expect(checkRateLimit(k, cfg).allowed).toBe(true); // 1
    expect(checkRateLimit(k, cfg).allowed).toBe(true); // 2
    expect(checkRateLimit(k, cfg).allowed).toBe(true); // 3
    expect(checkRateLimit(k, cfg).allowed).toBe(false); // 4 — over
  });

  it("reports decreasing remaining and clamps at 0", () => {
    const k = key();
    const cfg = { limit: 2, windowMs: 60_000 };
    expect(checkRateLimit(k, cfg).remaining).toBe(1);
    expect(checkRateLimit(k, cfg).remaining).toBe(0);
    expect(checkRateLimit(k, cfg).remaining).toBe(0); // never negative
  });

  it("resets once the window has elapsed", () => {
    const k = key();
    const cfg = { limit: 1, windowMs: 10 }; // tiny window
    expect(checkRateLimit(k, cfg).allowed).toBe(true);
    expect(checkRateLimit(k, cfg).allowed).toBe(false);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(k, cfg).allowed).toBe(true); // window rolled over
        resolve();
      }, 20);
    });
  });

  it("keeps separate counters per key", () => {
    const a = key();
    const b = key();
    const cfg = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimit(a, cfg).allowed).toBe(true);
    expect(checkRateLimit(b, cfg).allowed).toBe(true); // b unaffected by a
    expect(checkRateLimit(a, cfg).allowed).toBe(false);
  });
});
