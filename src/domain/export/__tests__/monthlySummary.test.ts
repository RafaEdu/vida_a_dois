import { describe, expect, it } from "@jest/globals";
import type { Expense, Income, MonthlyClosing } from "../../../types/domain";
import { buildMonthlySummaries } from "../monthlySummary";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    couple_id: "c1",
    created_by: "u1",
    description: "Mercado",
    amount: 100,
    category: "Mercado",
    due_date: "2026-09-10",
    paid: true,
    paid_at: "2026-09-10T12:00:00.000Z",
    paid_by: "u1",
    is_recurring: false,
    recurrence_series_id: null,
    created_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: "i1",
    couple_id: "c1",
    user_id: "u1",
    description: "Salário",
    amount: 500,
    is_extra: false,
    received_at: "2026-09-05T12:00:00.000Z",
    created_at: "2026-09-05T12:00:00.000Z",
    ...overrides,
  };
}

function makeClosing(overrides: Partial<MonthlyClosing> = {}): MonthlyClosing {
  return {
    id: "cl1",
    couple_id: "c1",
    year_month: "2026-08",
    total_incomes: 5000,
    total_expenses: 2000,
    monthly_budget: 3000,
    split_ratio_a: 50,
    split_ratio_b: 50,
    shared_balance_before: 0,
    month_delta: 3000,
    shared_balance_after: 3000,
    closed_by: "u1",
    closed_at: "2026-08-31T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildMonthlySummaries", () => {
  it("calcula meses abertos a partir de despesas e receitas", () => {
    const summaries = buildMonthlySummaries(
      [
        makeExpense({ id: "e1", amount: 100 }),
        makeExpense({ id: "e2", amount: 50, due_date: null }),
      ],
      [makeIncome({ amount: 500 })],
      [],
    );

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      yearMonth: "2026-09",
      totalIncomes: 500,
      totalExpenses: 150,
      balance: 350,
      closed: false,
      sharedBalanceAfter: null,
    });
  });

  it("prefere o snapshot para meses fechados", () => {
    const summaries = buildMonthlySummaries(
      [makeExpense({ amount: 999 })],
      [makeIncome({ amount: 999 })],
      [makeClosing({ year_month: "2026-08" })],
    );

    const august = summaries.find((summary) => summary.yearMonth === "2026-08");
    expect(august).toMatchObject({
      totalIncomes: 5000,
      totalExpenses: 2000,
      balance: 3000,
      closed: true,
      sharedBalanceAfter: 3000,
    });
  });

  it("une meses de despesas, receitas e fechamentos em ordem decrescente", () => {
    const summaries = buildMonthlySummaries(
      [makeExpense({ due_date: "2026-07-10" })],
      [makeIncome({ received_at: "2026-09-05T12:00:00.000Z" })],
      [makeClosing({ year_month: "2026-08" })],
    );

    expect(summaries.map((summary) => summary.yearMonth)).toEqual([
      "2026-09",
      "2026-08",
      "2026-07",
    ]);
  });

  it("devolve lista vazia sem dados", () => {
    expect(buildMonthlySummaries([], [], [])).toEqual([]);
  });
});
