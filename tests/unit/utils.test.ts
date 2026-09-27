import { describe, expect, it } from "vitest";
import { formatPaise, slugify } from "@/lib/utils";

describe("formatPaise", () => {
  it("formats whole rupees with Indian digit grouping", () => {
    expect(formatPaise(250000)).toBe("₹2,500");
    expect(formatPaise(12000000)).toBe("₹1,20,000");
    expect(formatPaise(0)).toBe("₹0");
  });

  it("shows paise only when non-zero", () => {
    expect(formatPaise(250050)).toBe("₹2,500.50");
  });
});

describe("slugify", () => {
  it("normalises names to url slugs", () => {
    expect(slugify("Kitty Su")).toBe("kitty-su");
    expect(slugify("Polly Esther's")).toBe("polly-esthers");
    expect(slugify("  Mix@36 ")).toBe("mix36");
  });
});
