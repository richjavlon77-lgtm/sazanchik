import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("joins class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("trims falsy values", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("handles empty args", () => {
    expect(cn()).toBe("");
  });

  it("handles conditional classes", () => {
    const truthy = true;
    const falsy = false;
    expect(cn("base", truthy && "active", falsy && "hidden")).toBe("base active");
  });

  it("handles undefined and null", () => {
    expect(cn("a", undefined, "b", null)).toBe("a b");
  });
});
