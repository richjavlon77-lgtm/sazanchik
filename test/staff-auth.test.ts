import { describe, it, expect } from "vitest";
import { hashPin, verifyPin, isValidPin } from "@/lib/staff-auth";

describe("staff PIN hashing", () => {
  it("verifies a correct PIN against its hash", () => {
    const stored = hashPin("1234");
    expect(verifyPin("1234", stored)).toBe(true);
  });

  it("rejects a wrong PIN", () => {
    const stored = hashPin("1234");
    expect(verifyPin("0000", stored)).toBe(false);
  });

  it("salts: the same PIN hashes differently each time", () => {
    expect(hashPin("1234")).not.toBe(hashPin("1234"));
  });

  it("handles malformed stored values without throwing", () => {
    expect(verifyPin("1234", "garbage")).toBe(false);
    expect(verifyPin("1234", "")).toBe(false);
    expect(verifyPin("1234", "onlysalt:")).toBe(false);
  });
});

describe("isValidPin", () => {
  it("accepts exactly 4 digits", () => {
    expect(isValidPin("0000")).toBe(true);
    expect(isValidPin("9999")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
    expect(isValidPin(" 1234")).toBe(false);
  });
});
