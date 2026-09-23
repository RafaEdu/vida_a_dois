import type {
  Couple,
  CoupleStatus,
  Expense,
  FinancialGoal,
  Income,
  MonthlyClosing,
} from "../../types/domain";
import { formatDateFromTimestamp } from "../../utils/date";

export type RelationshipStatusTone = "success" | "warning" | "neutral";

export interface RelationshipStatusMeta {
  label: string;
  tone: RelationshipStatusTone;
}

/** Rótulo/tom do estado do vínculo para o histórico de relacionamentos. */
export function resolveRelationshipStatus(
  status: CoupleStatus,
): RelationshipStatusMeta {
  if (status === "active") return { label: "Vínculo ativo", tone: "success" };
  if (status === "pending")
    return { label: "Convite pendente", tone: "warning" };
  return { label: "Encerrado", tone: "neutral" };
}

export interface RelationshipPeriod {
  start: string;
  end: string | null;
  /** Ex.: `12/03/2025 – 01/09/2026` ou `Desde 12/03/2025`. */
  label: string;
}

/**
 * Período do relacionamento a partir de `linked_at` (com fallback para
 * `created_at`) e `ended_at`. Datas em branco viram um rótulo neutro.
 */
export function resolveRelationshipPeriod(couple: Couple): RelationshipPeriod {
  const start = formatDateFromTimestamp(couple.linked_at ?? couple.created_at);
  const end = couple.ended_at ? formatDateFromTimestamp(couple.ended_at) : null;

  if (start && end) return { start, end, label: `${start} – ${end}` };
  if (start) return { start, end: null, label: `Desde ${start}` };
  return { start: "", end: null, label: "Período não informado" };
}

export interface RelationshipTotals {
  totalExpenses: number;
  totalIncomes: number;
  balance: number;
  expensesCount: number;
  incomesCount: number;
  closingsCount: number;
  goalsCount: number;
}

/**
 * Totais de leitura de um relacionamento (histórico ou atual). Não altera
 * dados; apenas resume o que foi carregado.
 */
export function summarizeRelationshipData(data: {
  expenses: Expense[];
  incomes: Income[];
  closings: MonthlyClosing[];
  goals: FinancialGoal[];
}): RelationshipTotals {
  const totalExpenses = data.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const totalIncomes = data.incomes.reduce(
    (sum, income) => sum + income.amount,
    0,
  );

  return {
    totalExpenses,
    totalIncomes,
    balance: totalIncomes - totalExpenses,
    expensesCount: data.expenses.length,
    incomesCount: data.incomes.length,
    closingsCount: data.closings.length,
    goalsCount: data.goals.length,
  };
}
