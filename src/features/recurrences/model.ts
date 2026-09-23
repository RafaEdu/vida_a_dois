import type { RecurrenceSeries } from "../../types/domain";
import { formatDateOnlyForDisplay, isValidDateOnly } from "../../utils/date";

export type RecurrenceStatusTone = "success" | "neutral";

export interface RecurrenceStatus {
  active: boolean;
  label: string;
  tone: RecurrenceStatusTone;
}

export function resolveRecurrenceStatus(
  series: Pick<RecurrenceSeries, "active">,
): RecurrenceStatus {
  if (series.active) {
    return { active: true, label: "Ativa", tone: "success" };
  }
  return { active: false, label: "Pausada", tone: "neutral" };
}

export function formatRecurrenceFrequency(frequency: string): string {
  if (frequency === "monthly") return "Mensal";
  return frequency;
}

/**
 * Label for the next expected occurrence of a series. Returns a helpful empty
 * label when there is no pending occurrence date.
 */
export function resolveNextOccurrenceLabel(
  nextDueDate: string | null | undefined,
): string {
  if (!nextDueDate || !isValidDateOnly(nextDueDate)) {
    return "Sem próxima data definida";
  }
  return `Próxima em ${formatDateOnlyForDisplay(nextDueDate)}`;
}

export interface RecurrenceSummary {
  activeCount: number;
  pausedCount: number;
  /** Sum of the monthly amount of the active series. */
  activeMonthlyAmount: number;
}

export function summarizeRecurrences(
  series: RecurrenceSeries[],
): RecurrenceSummary {
  return series.reduce<RecurrenceSummary>(
    (summary, item) => {
      if (item.active) {
        summary.activeCount += 1;
        summary.activeMonthlyAmount += item.amount;
      } else {
        summary.pausedCount += 1;
      }
      return summary;
    },
    { activeCount: 0, pausedCount: 0, activeMonthlyAmount: 0 },
  );
}
