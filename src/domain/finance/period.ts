import type { Expense, Income } from "../../types/domain";
import {
  getYearMonthFromDateOnly,
  getYearMonthFromTimestamp,
} from "../../utils/date";

export type ExpensePeriod = Pick<Expense, "due_date" | "created_at">;
export type IncomePeriod = Pick<Income, "received_at">;

export function getExpenseYearMonth(expense: ExpensePeriod): string {
  if (expense.due_date) return getYearMonthFromDateOnly(expense.due_date);
  return getYearMonthFromTimestamp(expense.created_at);
}

export function getIncomeYearMonth(income: IncomePeriod): string {
  return getYearMonthFromTimestamp(income.received_at);
}

export function isExpenseInYearMonth(
  expense: ExpensePeriod,
  yearMonth: string,
): boolean {
  return getExpenseYearMonth(expense) === yearMonth;
}

export function isIncomeInYearMonth(
  income: IncomePeriod,
  yearMonth: string,
): boolean {
  return getIncomeYearMonth(income) === yearMonth;
}
