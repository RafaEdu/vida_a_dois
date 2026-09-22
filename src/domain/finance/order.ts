import type { Expense, Income } from "../../types/domain";

function datePartOf(timestamp: string | null | undefined): string {
  return timestamp ? timestamp.slice(0, 10) : "";
}

function expenseSortKey(expense: Expense): string {
  return expense.due_date ?? datePartOf(expense.created_at);
}

export function compareExpenses(a: Expense, b: Expense): number {
  const byDueDate = expenseSortKey(b).localeCompare(expenseSortKey(a));
  if (byDueDate !== 0) return byDueDate;

  return (b.created_at ?? "").localeCompare(a.created_at ?? "");
}

export function compareIncomes(a: Income, b: Income): number {
  const byReceivedAt = (b.received_at ?? "").localeCompare(a.received_at ?? "");
  if (byReceivedAt !== 0) return byReceivedAt;

  return (b.created_at ?? "").localeCompare(a.created_at ?? "");
}

export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort(compareExpenses);
}

export function sortIncomes(incomes: Income[]): Income[] {
  return [...incomes].sort(compareIncomes);
}
