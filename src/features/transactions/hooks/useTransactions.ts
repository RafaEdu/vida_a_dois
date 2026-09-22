import { useMemo } from "react";
import type { Expense, Income } from "../../../types/domain";
import {
  selectExpensesByMonth,
  selectIncomesByMonth,
  sumExpenses,
  sumIncomes,
} from "../../../domain/finance/selectors";
import {
  buildTransactionEntries,
  collectExpenseCategories,
  filterTransactionEntries,
  groupTransactionEntries,
  hasActiveTransactionFilters,
  type TransactionFilterState,
  type TransactionGroup,
  type TransactionIdentity,
} from "../model";

export interface UseTransactionsParams {
  expenses: Expense[];
  incomes: Income[];
  /** Selected period in `YYYY-MM`. */
  selectedMonth: string;
  filters: TransactionFilterState;
  identity: TransactionIdentity;
}

export interface UseTransactionsResult {
  /** Filtered entries grouped by date (newest first). */
  groups: TransactionGroup[];
  totalIncomes: number;
  totalExpenses: number;
  categoryOptions: string[];
  hasActiveFilters: boolean;
  count: number;
}

/**
 * Derives the transactions list strictly from the existing finance selectors.
 * No financial rule is recomputed here — only selection, filtering and grouping
 * for presentation.
 */
export function useTransactions({
  expenses,
  incomes,
  selectedMonth,
  filters,
  identity,
}: UseTransactionsParams): UseTransactionsResult {
  const { selfId, partnerId, partnerName } = identity;

  const monthExpenses = useMemo(
    () => selectExpensesByMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const monthIncomes = useMemo(
    () => selectIncomesByMonth(incomes, selectedMonth),
    [incomes, selectedMonth],
  );

  const stableIdentity = useMemo<TransactionIdentity>(
    () => ({ selfId, partnerId, partnerName }),
    [selfId, partnerId, partnerName],
  );

  const entries = useMemo(
    () => buildTransactionEntries(monthExpenses, monthIncomes, stableIdentity),
    [monthExpenses, monthIncomes, stableIdentity],
  );

  const filtered = useMemo(
    () => filterTransactionEntries(entries, filters, stableIdentity),
    [entries, filters, stableIdentity],
  );

  const groups = useMemo(() => groupTransactionEntries(filtered), [filtered]);

  const totalIncomes = useMemo(() => sumIncomes(monthIncomes), [monthIncomes]);
  const totalExpenses = useMemo(
    () => sumExpenses(monthExpenses),
    [monthExpenses],
  );

  const categoryOptions = useMemo(
    () => collectExpenseCategories(monthExpenses),
    [monthExpenses],
  );

  const hasActiveFilters = hasActiveTransactionFilters(filters);

  return {
    groups,
    totalIncomes,
    totalExpenses,
    categoryOptions,
    hasActiveFilters,
    count: filtered.length,
  };
}
