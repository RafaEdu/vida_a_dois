import type {
  FinancialGoal,
  GoalContribution,
  GoalStatus,
} from "../../types/domain";

/**
 * Monetary tolerance used to consider a goal reached, so floating point cents
 * do not leave a goal one cent short.
 */
export const GOAL_REACHED_TOLERANCE = 0.005;

export interface GoalProgress {
  id: string;
  title: string;
  /** Configured target amount. */
  target: number;
  /** Sum of every contribution recorded for the goal. */
  contributed: number;
  /** How much is still missing, never negative. */
  remaining: number;
  /** `contributed / target` (unbounded; `0` when there is no target). */
  share: number;
  /** `share` as a whole percentage; may exceed 100. */
  percentage: number;
  /** Whether the target has been reached (with cent tolerance). */
  reached: boolean;
}

export interface GoalSummary {
  total: number;
  active: number;
  completed: number;
  archived: number;
}

export type GoalProgressInput = Pick<
  FinancialGoal,
  "id" | "title" | "target_amount"
>;

export function sumGoalContributions(
  contributions: Pick<GoalContribution, "amount">[],
): number {
  return contributions.reduce(
    (sum, contribution) =>
      sum + (Number.isFinite(contribution.amount) ? contribution.amount : 0),
    0,
  );
}

/**
 * Pure progress of a single goal against its own contributions. Goals without a
 * positive target (invalid by domain, guarded here) report `0%`.
 */
export function calculateGoalProgress(
  goal: GoalProgressInput,
  contributions: Pick<GoalContribution, "amount">[],
): GoalProgress {
  const target = Number.isFinite(goal.target_amount) ? goal.target_amount : 0;
  const contributed = sumGoalContributions(contributions);
  const share = target > 0 ? contributed / target : 0;

  return {
    id: goal.id,
    title: goal.title,
    target,
    contributed,
    remaining: Math.max(target - contributed, 0),
    share,
    percentage: Math.round(share * 100),
    reached: target > 0 && contributed + GOAL_REACHED_TOLERANCE >= target,
  };
}

/**
 * Groups contributions by `goal_id`. Contributions of an unknown goal (e.g.
 * stale data) are simply ignored by the callers instead of breaking the list.
 */
export function groupContributionsByGoal(
  contributions: GoalContribution[],
): Map<string, GoalContribution[]> {
  const grouped = new Map<string, GoalContribution[]>();

  for (const contribution of contributions) {
    const list = grouped.get(contribution.goal_id);
    if (list) {
      list.push(contribution);
    } else {
      grouped.set(contribution.goal_id, [contribution]);
    }
  }

  return grouped;
}

/**
 * Progress of every goal, using the contributions already loaded for the
 * couple. Preserves the input order (the service sorts by recency).
 */
export function calculateGoalProgresses(
  goals: FinancialGoal[],
  contributions: GoalContribution[],
): GoalProgress[] {
  const grouped = groupContributionsByGoal(contributions);
  return goals.map((goal) =>
    calculateGoalProgress(goal, grouped.get(goal.id) ?? []),
  );
}

export function isGoalStatus(value: string): value is GoalStatus {
  return value === "active" || value === "completed" || value === "archived";
}

/**
 * Active goals first, then the ones already closed, keeping the service order
 * inside each group.
 */
export function sortGoalsForDisplay(goals: FinancialGoal[]): FinancialGoal[] {
  const rank = (goal: FinancialGoal) =>
    goal.status === "active" ? 0 : goal.status === "completed" ? 1 : 2;
  return [...goals].sort((a, b) => rank(a) - rank(b));
}

export function summarizeGoals(goals: FinancialGoal[]): GoalSummary {
  return goals.reduce<GoalSummary>(
    (summary, goal) => {
      summary.total += 1;
      if (goal.status === "active") summary.active += 1;
      else if (goal.status === "completed") summary.completed += 1;
      else summary.archived += 1;
      return summary;
    },
    {
      total: 0,
      active: 0,
      completed: 0,
      archived: 0,
    },
  );
}
