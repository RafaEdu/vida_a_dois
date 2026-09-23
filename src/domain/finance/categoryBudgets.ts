import type { CategoryBudget, Expense } from "../../types/domain";
import { groupExpensesByCategory } from "./selectors";

/**
 * A category is considered "close to the limit" from 80% of its monthly
 * amount. Kept here so the UI, the cards and the Home highlights share the
 * exact same threshold.
 */
export const CATEGORY_BUDGET_WARNING_THRESHOLD = 0.8;

export type CategoryBudgetStatus = "ok" | "warning" | "over";

export interface CategoryBudgetProgress {
  id: string;
  category: string;
  /** Configured monthly ceiling for the category. */
  limit: number;
  /** Spend of the selected month for this category. */
  spent: number;
  /** `limit - spent`; negative when the category exceeds the ceiling. */
  remaining: number;
  /** `spent / limit` (unbounded). */
  share: number;
  /** `share` as a whole percentage; may exceed 100. */
  percentage: number;
  status: CategoryBudgetStatus;
}

export interface CategoryBudgetOverflow {
  /** Whether the sum of category limits exceeds the global monthly budget. */
  exceeded: boolean;
  /** How much the limits exceed the global budget (never negative). */
  difference: number;
}

export type CategoryBudgetProgressInput = Pick<
  CategoryBudget,
  "id" | "category" | "monthly_amount"
>;

export function resolveCategoryBudgetStatus(
  share: number,
): CategoryBudgetStatus {
  if (!Number.isFinite(share)) return "ok";
  if (share >= 1) return "over";
  if (share >= CATEGORY_BUDGET_WARNING_THRESHOLD) return "warning";
  return "ok";
}

/**
 * Pure progress for a single category limit against the spend already
 * selected for the month. `spent` must come from the same monthly selection
 * used elsewhere (see `selectExpensesByMonth`).
 */
export function calculateCategoryBudgetProgress(
  budget: CategoryBudgetProgressInput,
  spent: number,
): CategoryBudgetProgress {
  const limit = budget.monthly_amount;
  const safeSpent = Number.isFinite(spent) ? spent : 0;
  const share = limit > 0 ? safeSpent / limit : 0;

  return {
    id: budget.id,
    category: budget.category,
    limit,
    spent: safeSpent,
    remaining: limit - safeSpent,
    share,
    percentage: Math.round(share * 100),
    status: resolveCategoryBudgetStatus(share),
  };
}

/**
 * Progress of every configured category for the given month. Expenses are
 * aggregated by category name; categories with no matching expense (renamed
 * or unused) stay in the list with zero spend instead of breaking the app.
 * Sorted by consumption (most critical first) and then alphabetically.
 */
export function calculateCategoryBudgetProgresses(
  budgets: CategoryBudget[],
  monthExpenses: Expense[],
): CategoryBudgetProgress[] {
  const totals = new Map(
    groupExpensesByCategory(monthExpenses).map((total) => [
      total.name,
      total.amount,
    ]),
  );

  return budgets
    .map((budget) =>
      calculateCategoryBudgetProgress(budget, totals.get(budget.category) ?? 0),
    )
    .sort((a, b) => b.share - a.share || a.category.localeCompare(b.category));
}

export function sumCategoryBudgetLimits(
  budgets: Pick<CategoryBudget, "monthly_amount">[],
): number {
  return budgets.reduce((sum, budget) => sum + budget.monthly_amount, 0);
}

/**
 * Compares the sum of category limits with the global monthly budget. A missing
 * global budget (`<= 0`) never counts as overflow. This only warns — it never
 * blocks saving, per the phase rules.
 */
export function resolveCategoryBudgetOverflow(
  totalLimits: number,
  globalBudget: number,
): CategoryBudgetOverflow {
  if (!Number.isFinite(globalBudget) || globalBudget <= 0) {
    return { exceeded: false, difference: 0 };
  }

  const difference = totalLimits - globalBudget;
  return {
    exceeded: difference > 0.005,
    difference: Math.max(difference, 0),
  };
}

/**
 * Categories that are at/above the warning threshold, most critical first. Used
 * by the Home highlights and by the Planning summary.
 */
export function selectCategoryBudgetHighlights(
  progresses: CategoryBudgetProgress[],
): CategoryBudgetProgress[] {
  return progresses.filter((progress) => progress.status !== "ok");
}
