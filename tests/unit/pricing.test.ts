// @vitest-environment node
import { describe, expect, it } from "vitest";
import { computeConvenienceFee, computeTotals } from "@/lib/pricing";

const fee = {
  type: "percent" as const,
  bps: 350,
  flatPaise: 0,
  minPaise: 2000,
  maxPaise: 20000,
};
const tax = { onConvenienceFeeBps: 1800, onTicketsBps: 0 };

describe("computeConvenienceFee", () => {
  it("applies the percentage with min and max caps", () => {
    expect(computeConvenienceFee(500000, fee)).toBe(17500); // 3.5% of ₹5,000
    expect(computeConvenienceFee(10000, fee)).toBe(2000); // min ₹20
    expect(computeConvenienceFee(100000000, fee)).toBe(20000); // max ₹200
    expect(computeConvenienceFee(0, fee)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("itemises discount, fee, tax and wallet", () => {
    const totals = computeTotals({
      subtotal: 500000,
      discount: 30000,
      fee,
      tax,
      walletBalance: 100000,
      useWallet: true,
    });
    // discounted 470000 → fee 16450 → gst 2961
    expect(totals.convenienceFee).toBe(16450);
    expect(totals.tax).toBe(2961);
    expect(totals.walletUsed).toBe(100000);
    expect(totals.total).toBe(470000 + 16450 + 2961 - 100000);
  });

  it("wallet never exceeds the payable amount", () => {
    const totals = computeTotals({
      subtotal: 10000,
      discount: 0,
      fee,
      tax,
      walletBalance: 10_000_000,
      useWallet: true,
    });
    expect(totals.total).toBe(0);
    expect(totals.walletUsed).toBe(10000 + totals.convenienceFee + totals.tax);
  });
});
