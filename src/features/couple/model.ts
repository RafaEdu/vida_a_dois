import type { Couple } from "../../types/domain";
import { formatElapsedSince } from "../../utils/date";
import { getFirstName } from "../../utils/name";

export type CoupleLinkTone = "success" | "warning" | "neutral";

export interface CoupleLinkSummary {
  statusLabel: string;
  statusTone: CoupleLinkTone;
  /** Human elapsed time since the link, e.g. `há 2 meses`. */
  elapsedLabel: string | null;
}

/**
 * Presentation status of the couple link. The link `status` and `linked_at`
 * are existing domain fields — no new business rule is derived here.
 */
export function deriveCoupleLinkSummary(
  couple: Couple | null,
  now = new Date(),
): CoupleLinkSummary {
  if (!couple) {
    return {
      statusLabel: "Sem vínculo",
      statusTone: "neutral",
      elapsedLabel: null,
    };
  }

  if (couple.status !== "active") {
    return {
      statusLabel: "Vínculo pendente",
      statusTone: "warning",
      elapsedLabel: null,
    };
  }

  return {
    statusLabel: "Vínculo ativo",
    statusTone: "success",
    elapsedLabel: formatElapsedSince(couple.linked_at, now),
  };
}

/**
 * Display name for the couple built from the two real profiles, e.g.
 * `Rafa & Edu`. Falls back gracefully when one or both names are missing.
 */
export function buildCoupleDisplayName(
  selfName: string | null | undefined,
  partnerName: string | null | undefined,
): string {
  const self = getFirstName(selfName);
  const partner = getFirstName(partnerName);

  if (self && partner) return `${self} & ${partner}`;
  if (self) return self;
  if (partner) return partner;
  return "Nosso casal";
}
