import { describe, expect, it } from "@jest/globals";
import { computeSplitShares } from "../split";

describe("computeSplitShares", () => {
  it("splits evenly for a 50% ratio", () => {
    expect(computeSplitShares(320, 50)).toEqual({ shareA: 160, shareB: 160 });
  });

  it("uses the configured first-partner percentage", () => {
    expect(computeSplitShares(200, 70)).toEqual({ shareA: 140, shareB: 60 });
  });

  it("keeps both shares adding up to the total when rounding", () => {
    const { shareA, shareB } = computeSplitShares(100, 33.33);
    expect(shareA + shareB).toBeCloseTo(100, 10);
  });

  it("returns zero shares for an empty or invalid amount", () => {
    expect(computeSplitShares(0, 50)).toEqual({ shareA: 0, shareB: 0 });
    expect(computeSplitShares(Number.NaN, 50)).toEqual({
      shareA: 0,
      shareB: 0,
    });
  });

  it("clamps ratios outside the 0-100 range", () => {
    expect(computeSplitShares(100, 150)).toEqual({ shareA: 100, shareB: 0 });
    expect(computeSplitShares(100, -20)).toEqual({ shareA: 0, shareB: 100 });
  });

  it("falls back to a full second share when the ratio is not finite", () => {
    expect(computeSplitShares(100, Number.NaN)).toEqual({
      shareA: 0,
      shareB: 100,
    });
  });
});
