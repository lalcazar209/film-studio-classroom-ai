import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils/slugify";
import { cn } from "@/lib/utils/cn";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Three-Point Lighting Basics")).toBe("three-point-lighting-basics");
  });

  it("strips characters that aren't alphanumeric", () => {
    expect(slugify("What's a PSA? (30s cut)")).toBe("what-s-a-psa-30s-cut");
  });

  it("falls back to a default for an all-punctuation title", () => {
    expect(slugify("???")).toBe("untitled");
  });
});

describe("cn", () => {
  it("joins plain string classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("expands an object of conditional classes", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });
});
