import type { CloseMonthResult, Expense, Income } from "../../types/domain";
import { isExpenseInYearMonth, isIncomeInYearMonth } from "./period";

export interface CategoryTotal {
  name: string;
  amount: number;
}

export interface MonthlySummary {
  totalExpenses: number;
  totalIncomes: number;
  balance: number;
  budget: number;
  remainingBudget: number;
  paid: number;
  pending: number;
}

export interface BudgetProgress {
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export function selectExpensesByMonth(
  expenses: Expense[],
  yearMonth: string,
): Expense[] {
  return expenses.filter((expense) => isExpenseInYearMonth(expense, yearMonth));
}

export function selectIncomesByMonth(
  incomes: Income[],
  yearMonth: string,
): Income[] {
  return incomes.filter((income) => isIncomeInYearMonth(income, yearMonth));
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function sumIncomes(incomes: Income[]): number {
  return incomes.reduce((sum, income) => sum + income.amount, 0);
}

export function groupExpensesByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const current = totals.get(expense.category) ?? 0;
    totals.set(expense.category, current + expense.amount);
  }

  return Array.from(totals, ([name, amount]) => ({ name, amount })).sort(
    (a, b) => b.amount - a.amount,
  );
}

export function calculateMonthlySummary(
  expenses: Expense[],
  incomes: Income[],
  yearMonth: string,
  budget: number,
): MonthlySummary {
  const monthExpenses = selectExpensesByMonth(expenses, yearMonth);
  const monthIncomes = selectIncomesByMonth(incomes, yearMonth);

  const totalExpenses = sumExpenses(monthExpenses);
  const totalIncomes = sumIncomes(monthIncomes);

  const paid = monthExpenses
    .filter((expense) => expense.paid)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const pending = monthExpenses
    .filter((expense) => !expense.paid)
    .reduce((sum, expense) => sum + expense.amount, 0);

  return {
    totalExpenses,
    totalIncomes,
    balance: totalIncomes - totalExpenses,
    budget,
    remainingBudget: budget - totalExpenses,
    paid,
    pending,
  };
}

export function calculateBudgetProgress(
  spent: number,
  budget: number,
): BudgetProgress {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  return {
    budget,
    spent,
    remaining: budget - spent,
    percentage,
  };
}

export interface MonthlyClosingDivergence {
  field: string;
  client: number;
  server: number;
}

const CLOSING_TOLERANCE = 0.005;

export function compareMonthlySummaryWithCloseResult(
  summary: MonthlySummary,
  result: CloseMonthResult,
): MonthlyClosingDivergence[] {
  const pairs: [string, number, number][] = [
    ["totalExpenses", summary.totalExpenses, result.total_expenses],
    ["totalIncomes", summary.totalIncomes, result.total_incomes],
    ["balance", summary.balance, result.month_delta],
    ["budget", summary.budget, result.monthly_budget],
  ];

  return pairs
    .filter(
      ([, client, server]) => Math.abs(client - server) > CLOSING_TOLERANCE,
    )
    .map(([field, client, server]) => ({ field, client, server }));
}
