import { describe, it, expect, beforeAll, afterEach } from "vitest";

// table-sign reads SESSION_SECRET at call time, so set it before importing.
beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-please-ignore";
});

const { signTable, verifyTableToken, resolveTable } = await import(
  "@/lib/table-sign"
);

describe("table token signing", () => {
  it("round-trips a signed token back to its number", () => {
    const token = signTable("12");
    expect(verifyTableToken(token)).toBe("12");
  });

  it("encodes the readable number in the token", () => {
    expect(signTable("7").startsWith("7.")).toBe(true);
  });

  it("rejects a forged signature", () => {
    expect(verifyTableToken("12.deadbeefdeadbeef")).toBeNull();
  });

  it("rejects a token whose number was swapped (sig no longer matches)", () => {
    const token = signTable("12");
    const sig = token.split(".")[1];
    expect(verifyTableToken(`99.${sig}`)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyTableToken("12")).toBeNull();
    expect(verifyTableToken(".abc")).toBeNull();
    expect(verifyTableToken("abc.def")).toBeNull();
    expect(verifyTableToken("")).toBeNull();
  });

  it("is bound to the secret (different secret → invalid)", () => {
    const token = signTable("5");
    process.env.SESSION_SECRET = "a-different-secret";
    expect(verifyTableToken(token)).toBeNull();
    process.env.SESSION_SECRET = "test-secret-please-ignore"; // restore
  });
});

describe("resolveTable", () => {
  afterEach(() => {
    delete process.env.REQUIRE_TABLE_TOKEN;
  });

  it("uses the verified number from a valid token", () => {
    expect(resolveTable("anything", signTable("8"))).toEqual({
      ok: true,
      table: "8",
    });
  });

  it("rejects a forged token (403) regardless of mode", () => {
    expect(resolveTable("8", "8.deadbeefdeadbeef")).toEqual({
      ok: false,
      error: "Недействительный QR-код стола",
      status: 403,
    });
  });

  it("falls back to the plain table number when not in strict mode", () => {
    expect(resolveTable("8")).toEqual({ ok: true, table: "8" });
  });

  it("rejects a tokenless request in strict mode", () => {
    process.env.REQUIRE_TABLE_TOKEN = "1";
    const r = resolveTable("8");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("still accepts a valid token in strict mode", () => {
    process.env.REQUIRE_TABLE_TOKEN = "true";
    expect(resolveTable("x", signTable("8"))).toEqual({ ok: true, table: "8" });
  });
});
