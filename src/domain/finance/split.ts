import type { Couple } from "../../types/domain";

export interface SplitShares {
  shareA: number;
  shareB: number;
}

export interface PartnerShares {
  selfShare: number;
  partnerShare: number;
}

/**
 * Converte a divisão armazenada relativa a `user_a`/`user_b` para a ótica da
 * pessoa autenticada. A ordem dos campos no banco não corresponde
 * necessariamente a "eu/parceiro", então toda exibição/edição individual deve
 * passar por aqui.
 */
export function resolvePartnerShares(
  couple: Pick<Couple, "user_a" | "split_ratio_a" | "split_ratio_b">,
  selfId: string,
): PartnerShares {
  const selfIsA = couple.user_a === selfId;
  return {
    selfShare: selfIsA ? couple.split_ratio_a : couple.split_ratio_b,
    partnerShare: selfIsA ? couple.split_ratio_b : couple.split_ratio_a,
  };
}

/**
 * Caminho inverso de `resolvePartnerShares`: converte percentuais na ótica da
 * pessoa autenticada de volta para o formato persistido (`split_ratio_a/b`).
 */
export function coupleRatiosFromShares(
  shares: PartnerShares,
  couple: Pick<Couple, "user_a">,
  selfId: string,
): { split_ratio_a: number; split_ratio_b: number } {
  const selfIsA = couple.user_a === selfId;
  return {
    split_ratio_a: selfIsA ? shares.selfShare : shares.partnerShare,
    split_ratio_b: selfIsA ? shares.partnerShare : shares.selfShare,
  };
}

/** Arredonda um percentual para duas casas, como no cálculo do servidor. */
export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
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
