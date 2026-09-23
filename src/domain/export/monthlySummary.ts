import type { Expense, Income, MonthlyClosing } from "../../types/domain";
import {
  getExpenseYearMonth,
  getIncomeYearMonth,
  isExpenseInYearMonth,
  isIncomeInYearMonth,
} from "../finance/period";

export interface ExportMonthlySummary {
  yearMonth: string;
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  /** Se o mês possui snapshot consolidado em `monthly_closings`. */
  closed: boolean;
  sharedBalanceAfter: number | null;
  monthlyBudget: number | null;
}

/**
 * Consolida o resumo mês a mês para exportação/consulta.
 *
 * Para meses já fechados, prefere os valores congelados no snapshot
 * (`monthly_closings`), consistentes com o que foi efetivamente consolidado.
 * Para meses abertos, calcula a partir de despesas e receitas usando a mesma
 * regra de mês do restante do app (`due_date ?? created_at` / `received_at`).
 */
export function buildMonthlySummaries(
  expenses: Expense[],
  incomes: Income[],
  closings: MonthlyClosing[],
): ExportMonthlySummary[] {
  const months = new Set<string>();
  for (const expense of expenses) months.add(getExpenseYearMonth(expense));
  for (const income of incomes) months.add(getIncomeYearMonth(income));
  for (const closing of closings) months.add(closing.year_month);

  const closingByMonth = new Map(
    closings.map((closing) => [closing.year_month, closing]),
  );

  return Array.from(months)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((yearMonth) => {
      const closedClosing = closingByMonth.get(yearMonth);
      if (closedClosing) {
        return {
          yearMonth,
          totalIncomes: closedClosing.total_incomes,
          totalExpenses: closedClosing.total_expenses,
          balance: closedClosing.month_delta,
          closed: true,
          sharedBalanceAfter: closedClosing.shared_balance_after,
          monthlyBudget: closedClosing.monthly_budget,
        };
      }

      const totalIncomes = incomes
        .filter((income) => isIncomeInYearMonth(income, yearMonth))
        .reduce((sum, income) => sum + income.amount, 0);
      const totalExpenses = expenses
        .filter((expense) => isExpenseInYearMonth(expense, yearMonth))
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        yearMonth,
        totalIncomes,
        totalExpenses,
        balance: totalIncomes - totalExpenses,
        closed: false,
        sharedBalanceAfter: null,
        monthlyBudget: null,
      };
    });
}
