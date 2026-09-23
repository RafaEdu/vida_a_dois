import { useMemo } from "react";
import type { CategoryBudget, Expense } from "../../../types/domain";
import {
  calculateBudgetProgress,
  groupExpensesByCategory,
  selectExpensesByMonth,
  sumExpenses,
  type BudgetProgress,
  type CategoryTotal,
} from "../../../domain/finance/selectors";
import {
  calculateCategoryBudgetProgresses,
  resolveCategoryBudgetOverflow,
  sumCategoryBudgetLimits,
  type CategoryBudgetOverflow,
  type CategoryBudgetProgress,
} from "../../../domain/finance/categoryBudgets";

export interface UsePlanningParams {
  expenses: Expense[];
  /** Monthly budget from the couple settings. `0` means no ceiling. */
  budget: number;
  /** Selected period in `YYYY-MM`. */
  selectedMonth: string;
  /** Per-category monthly limits configured by the couple. */
  categoryBudgets: CategoryBudget[];
}

export interface UsePlanningResult {
  spent: number;
  budget: number;
  remaining: number;
  progress: BudgetProgress;
  categories: CategoryTotal[];
  categoryProgresses: CategoryBudgetProgress[];
  categoryBudgetTotal: number;
  categoryBudgetOverflow: CategoryBudgetOverflow;
}

/**
 * Derives the planning overview strictly from the existing finance selectors.
 * No financial rule is recomputed here — only per-month selection and the
 * existing budget progress calculation.
 */
export function usePlanning({
  expenses,
  budget,
  selectedMonth,
  categoryBudgets,
}: UsePlanningParams): UsePlanningResult {
  const monthExpenses = useMemo(
    () => selectExpensesByMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const spent = useMemo(() => sumExpenses(monthExpenses), [monthExpenses]);

  const progress = useMemo(
    () => calculateBudgetProgress(spent, budget),
    [spent, budget],
  );

  const categories = useMemo(
    () => groupExpensesByCategory(monthExpenses),
    [monthExpenses],
  );

  const categoryProgresses = useMemo(
    () => calculateCategoryBudgetProgresses(categoryBudgets, monthExpenses),
    [categoryBudgets, monthExpenses],
  );

  const categoryBudgetTotal = useMemo(
    () => sumCategoryBudgetLimits(categoryBudgets),
    [categoryBudgets],
  );

  const categoryBudgetOverflow = useMemo(
    () => resolveCategoryBudgetOverflow(categoryBudgetTotal, budget),
    [categoryBudgetTotal, budget],
  );

  return {
    spent,
    budget,
    remaining: progress.remaining,
    progress,
    categories,
    categoryProgresses,
    categoryBudgetTotal,
    categoryBudgetOverflow,
  };
}
