import type { GoalStatus } from "../../types/domain";
import type { GoalProgress } from "../../domain/finance/goals";
import type { ProgressTone } from "../../components/ui";
import { formatCurrency } from "../../utils/currency";
import { formatDateOnlyForDisplay } from "../../utils/date";

export type GoalBadgeTone = "primary" | "success" | "neutral" | "warning";

export function resolveGoalStatusLabel(status: GoalStatus): string {
  if (status === "completed") return "Concluída";
  if (status === "archived") return "Arquivada";
  return "Ativa";
}

export function resolveGoalStatusBadgeTone(status: GoalStatus): GoalBadgeTone {
  if (status === "completed") return "success";
  if (status === "archived") return "neutral";
  return "primary";
}

/**
 * Tone of the progress bar: reached goals are success, everything else uses
 * the primary tone so active goals do not look like warnings.
 */
export function resolveGoalProgressTone(progress: GoalProgress): ProgressTone {
  return progress.reached ? "success" : "primary";
}

/**
 * Neutral hint under the progress bar: how much is still missing, or that the
 * goal has already been reached (including any amount above the target).
 */
export function resolveGoalProgressHint(progress: GoalProgress): string {
  if (progress.reached) {
    const extra = progress.contributed - progress.target;
    if (extra > 0.005) {
      return `Meta atingida, ${formatCurrency(extra)} acima do alvo`;
    }
    return "Meta atingida";
  }
  return `Faltam ${formatCurrency(progress.remaining)}`;
}

export function resolveGoalTargetDateLabel(
  targetDate: string | null | undefined,
): string | null {
  if (!targetDate) return null;
  const formatted = formatDateOnlyForDisplay(targetDate);
  return formatted ? `Alvo em ${formatted}` : null;
}

/**
 * Labels a contribution author from the authenticated person's perspective,
 * falling back to a neutral label when the id is unknown.
 */
export function resolveContributionAuthorLabel(
  userId: string,
  selfId: string | null | undefined,
  selfName: string | null | undefined,
  partnerId: string | null | undefined,
  partnerName: string | null | undefined,
): string {
  if (selfId && userId === selfId) return selfName?.trim() || "Você";
  if (partnerId && userId === partnerId) {
    return partnerName?.trim() || "Seu parceiro";
  }
  return "Participante";
}
