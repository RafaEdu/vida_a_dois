export type PlanningMonthTone = "primary" | "neutral";

export interface PlanningMonthStatus {
  /** Human label for the selected period, e.g. `Planejamento ativo`. */
  label: string;
  tone: PlanningMonthTone;
  isCurrentMonth: boolean;
  isClosed: boolean;
  /** Whether the closing flow can run for the selected period. */
  canCloseMonth: boolean;
}

/**
 * Derives the planning status badge for a period. Closing is only possible for
 * the current month that has not been consolidated yet — the same rule used by
 * the `close_month` backend function.
 */
export function derivePlanningMonthStatus(
  selectedMonth: string,
  currentYearMonth: string,
  lastClosedMonth: string | null | undefined,
): PlanningMonthStatus {
  const isCurrentMonth = selectedMonth === currentYearMonth;
  const isClosed =
    Boolean(lastClosedMonth) && lastClosedMonth === selectedMonth;

  if (isClosed) {
    return {
      label: "Mês encerrado",
      tone: "neutral",
      isCurrentMonth,
      isClosed,
      canCloseMonth: false,
    };
  }

  if (isCurrentMonth) {
    return {
      label: "Planejamento ativo",
      tone: "primary",
      isCurrentMonth,
      isClosed,
      canCloseMonth: true,
    };
  }

  return {
    label: "Mês anterior",
    tone: "neutral",
    isCurrentMonth,
    isClosed,
    canCloseMonth: false,
  };
}

/**
 * Share of the monthly budget consumed by a category. There is no per-category
 * limit in the current domain, so the monthly budget is used as reference.
 * Returns `0` when there is no budget; may exceed `1` when a single category
 * surpasses the whole budget (the `ProgressBar` clamps it for rendering).
 */
export function categoryBudgetShare(amount: number, budget: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(budget) || budget <= 0) {
    return 0;
  }
  return amount / budget;
}

/**
 * Label for who consolidated a month. Prefers the current user's own name, then
 * the partner's, and falls back to a neutral label when the id is unknown
 * (e.g. account without a visible profile).
 */
export function resolveClosingAuthorLabel(
  closedBy: string | null | undefined,
  selfId: string | null | undefined,
  selfName: string | null | undefined,
  partnerId: string | null | undefined,
  partnerName: string | null | undefined,
): string {
  if (!closedBy) return "Não identificado";
  if (selfId && closedBy === selfId) return selfName?.trim() || "Você";
  if (partnerId && closedBy === partnerId)
    return partnerName?.trim() || "Seu parceiro";
  return "Não identificado";
}
