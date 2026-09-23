import type { Expense } from "../../types/domain";
import { computeSplitShares } from "./split";

/**
 * Minimal structural input for the settlement calculation. The caller is
 * responsible for filtering the expenses to the period; this module only knows
 * how to split what was effectively paid.
 */
export type SettlementExpense = Pick<Expense, "amount" | "paid" | "paid_by">;

export interface SettlementInput {
  /** Expenses already filtered to the period being settled. */
  expenses: SettlementExpense[];
  /** Percentage of the shared total assigned to `userIdA`. */
  splitRatioA: number;
  userIdA: string;
  userIdB: string;
}

export interface SettlementResult {
  /** Sum of expenses actually paid (effectively disbursed). */
  totalPaid: number;
  /** Sum of expenses still pending, shown separately and never as paid. */
  totalPending: number;
  /** Share of `totalPaid` that each partner should have paid. */
  expectedA: number;
  expectedB: number;
  /** How much each partner actually paid. */
  paidA: number;
  paidB: number;
  /** `paid - expected` for each partner; compensates when fully attributed. */
  differenceA: number;
  differenceB: number;
  /** Paid expenses whose payer is not one of the two members (defensive). */
  paidUnattributed: number;
  /** Whether both differences are within the monetary rounding tolerance. */
  balanced: boolean;
}

/** Result from the authenticated person's point of view. */
export interface SettlementPerspective {
  selfExpected: number;
  partnerExpected: number;
  selfPaid: number;
  partnerPaid: number;
  selfDifference: number;
  partnerDifference: number;
}

export type SettlementOutcome =
  "self_advanced" | "partner_advanced" | "balanced";

export interface SettlementOutcomeResult {
  outcome: SettlementOutcome;
  /** Positive magnitude that the other side should compensate. */
  amount: number;
}

/** Half a cent: below this the difference is treated as monetary rounding. */
const TOLERANCE = 0.005;

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function sumAmounts(expenses: SettlementExpense[]): number {
  return roundMoney(
    expenses.reduce(
      (total, expense) =>
        total + (Number.isFinite(expense.amount) ? expense.amount : 0),
      0,
    ),
  );
}

/**
 * Settlement of a period: what each partner was supposed to pay (based on what
 * was effectively paid and the period split) versus what each one actually
 * paid, plus who advanced money.
 *
 * Pending expenses are intentionally excluded from `totalPaid`/`expected*` (the
 * Fase 5 rule: pending means no disbursement and no payer) and surfaced only in
 * `totalPending` so the UI can list them apart.
 */
export function calculateSettlement(input: SettlementInput): SettlementResult {
  const paidExpenses = input.expenses.filter((expense) => expense.paid);
  const pendingExpenses = input.expenses.filter((expense) => !expense.paid);

  const totalPaid = sumAmounts(paidExpenses);
  const totalPending = sumAmounts(pendingExpenses);

  const { shareA, shareB } = computeSplitShares(totalPaid, input.splitRatioA);

  const paidA = sumAmounts(
    paidExpenses.filter((expense) => expense.paid_by === input.userIdA),
  );
  const paidB = sumAmounts(
    paidExpenses.filter((expense) => expense.paid_by === input.userIdB),
  );
  const paidUnattributed = roundMoney(totalPaid - paidA - paidB);

  const differenceA = roundMoney(paidA - shareA);
  const differenceB = roundMoney(paidB - shareB);

  return {
    totalPaid,
    totalPending,
    expectedA: shareA,
    expectedB: shareB,
    paidA,
    paidB,
    differenceA,
    differenceB,
    paidUnattributed,
    balanced:
      Math.abs(differenceA) <= TOLERANCE && Math.abs(differenceB) <= TOLERANCE,
  };
}

/** Maps a settlement result to the perspective of the authenticated person. */
export function resolveSettlementPerspective(
  result: SettlementResult,
  selfIsA: boolean,
): SettlementPerspective {
  return {
    selfExpected: selfIsA ? result.expectedA : result.expectedB,
    partnerExpected: selfIsA ? result.expectedB : result.expectedA,
    selfPaid: selfIsA ? result.paidA : result.paidB,
    partnerPaid: selfIsA ? result.paidB : result.paidA,
    selfDifference: selfIsA ? result.differenceA : result.differenceB,
    partnerDifference: selfIsA ? result.differenceB : result.differenceA,
  };
}

/**
 * Classifies a person's difference: positive means they paid more than their
 * share and are owed the amount; negative means the partner advanced it.
 */
export function resolveSettlementOutcome(
  selfDifference: number,
): SettlementOutcomeResult {
  if (
    !Number.isFinite(selfDifference) ||
    Math.abs(selfDifference) <= TOLERANCE
  ) {
    return { outcome: "balanced", amount: 0 };
  }

  if (selfDifference > 0) {
    return { outcome: "self_advanced", amount: roundMoney(selfDifference) };
  }

  return {
    outcome: "partner_advanced",
    amount: roundMoney(Math.abs(selfDifference)),
  };
}
