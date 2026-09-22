export interface SplitShares {
  shareA: number;
  shareB: number;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Splits a total amount between two partners using the couple's configured
 * first-partner percentage (`split_ratio_a`). `shareB` is the remainder, so
 * both shares always add up to the original total (no cent drift).
 *
 * This only reproduces the existing display derived from `split_ratio_a/b`
 * (already used by the planning screen); it does not persist a new split.
 */
export function computeSplitShares(total: number, ratioA: number): SplitShares {
  if (!Number.isFinite(total) || total <= 0) {
    return { shareA: 0, shareB: 0 };
  }

  const safeRatioA = Number.isFinite(ratioA)
    ? Math.min(Math.max(ratioA, 0), 100)
    : 0;

  const shareA = roundCurrency(total * (safeRatioA / 100));
  const shareB = roundCurrency(total - shareA);

  return { shareA, shareB };
}
