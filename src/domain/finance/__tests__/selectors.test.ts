import { describe, expect, it } from "@jest/globals";
import type {
  CloseMonthResult,
  Expense,
  Income,
} from "../../../types/domain";
import {
  calculateBudgetProgress,
  calculateMonthlySummary,
  compareMonthlySummaryWithCloseResult,
  groupExpensesByCategory,
  selectExpensesByMonth,
  selectIncomesByMonth,
  sumExpenses,
  sumIncomes,
} from "../selectors";

const AUGUST = "2026-08";
const SEPTEMBER = "2026-09";
const augustTimestamp = new Date(2026, 7, 10, 12).toISOString();
const septemberTimestamp = new Date(2026, 8, 10, 12).toISOString();

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    couple_id: "c1",
    created_by: "u1",
    paid_by: null,
    description: "Despesa",
    amount: 100,
    category: "Outros",
    due_date: null,
    paid: false,
    paid_at: null,
    is_recurring: false,
    recurrence_series_id: null,
    created_at: augustTimestamp,
    ...overrides,
  };
}

function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: "i1",
    couple_id: "c1",
    user_id: "u1",
    description: "Receita",
    amount: 1000,
    is_extra: false,
    received_at: septemberTimestamp,
    created_at: septemberTimestamp,
    ...overrides,
  };
}

describe("selectExpensesByMonth", () => {
  it("filtra por due_date quando existe", () => {
    const expenses = [
      makeExpense({ id: "a", due_date: "2026-09-15" }),
      makeExpense({ id: "b", due_date: "2026-08-15" }),
    ];
    expect(selectExpensesByMonth(expenses, SEPTEMBER).map((e) => e.id)).toEqual(
      ["a"],
    );
  });

  it("usa created_at quando não há due_date", () => {
    const expenses = [
      makeExpense({ id: "a", due_date: null, created_at: augustTimestamp }),
    ];
    expect(selectExpensesByMonth(expenses, AUGUST).map((e) => e.id)).toEqual([
      "a",
    ]);
    expect(selectExpensesByMonth(expenses, SEPTEMBER)).toEqual([]);
  });
});

describe("selectIncomesByMonth", () => {
  it("filtra pelo mês de recebimento", () => {
    const incomes = [
      makeIncome({ id: "a", received_at: septemberTimestamp }),
      makeIncome({ id: "b", received_at: augustTimestamp }),
    ];
    expect(selectIncomesByMonth(incomes, SEPTEMBER).map((i) => i.id)).toEqual([
      "a",
    ]);
  });
});

describe("sumExpenses / sumIncomes", () => {
  it("soma os valores", () => {
    expect(
      sumExpenses([makeExpense({ amount: 10 }), makeExpense({ amount: 5.5 })]),
    ).toBe(15.5);
    expect(
      sumIncomes([makeIncome({ amount: 1000 }), makeIncome({ amount: 250 })]),
    ).toBe(1250);
  });

  it("retorna zero para listas vazias", () => {
    expect(sumExpenses([])).toBe(0);
    expect(sumIncomes([])).toBe(0);
  });
});

describe("groupExpensesByCategory", () => {
  it("agrupa e ordena por valor decrescente", () => {
    const expenses = [
      makeExpense({ category: "Alimentação", amount: 50 }),
      makeExpense({ category: "Transporte", amount: 90 }),
      makeExpense({ category: "Alimentação", amount: 30 }),
    ];
    expect(groupExpensesByCategory(expenses)).toEqual([
      { name: "Transporte", amount: 90 },
      { name: "Alimentação", amount: 80 },
    ]);
  });
});

describe("calculateMonthlySummary", () => {
  it("mês vazio zera totais e mantém o orçamento", () => {
    const summary = calculateMonthlySummary([], [], SEPTEMBER, 5000);
    expect(summary).toEqual({
      totalExpenses: 0,
      totalIncomes: 0,
      balance: 0,
      budget: 5000,
      remainingBudget: 5000,
      paid: 0,
      pending: 0,
    });
  });

  it("separa pago e pendente e calcula o saldo", () => {
    const expenses = [
      makeExpense({ amount: 100, paid: true, due_date: "2026-09-05" }),
      makeExpense({ amount: 300, paid: false, due_date: "2026-09-20" }),
      makeExpense({ amount: 999, due_date: "2026-08-20" }),
    ];
    const incomes = [makeIncome({ amount: 1000 })];

    const summary = calculateMonthlySummary(expenses, incomes, SEPTEMBER, 500);
    expect(summary.totalExpenses).toBe(400);
    expect(summary.totalIncomes).toBe(1000);
    expect(summary.balance).toBe(600);
    expect(summary.paid).toBe(100);
    expect(summary.pending).toBe(300);
    expect(summary.remainingBudget).toBe(100);
  });

  it("aceita saldo negativo e orçamento zero", () => {
    const expenses = [makeExpense({ amount: 200, due_date: "2026-09-05" })];
    const summary = calculateMonthlySummary(expenses, [], SEPTEMBER, 0);
    expect(summary.balance).toBe(-200);
    expect(summary.remainingBudget).toBe(-200);
  });
});

describe("calculateBudgetProgress", () => {
  it("retorna percentual zero quando não há orçamento", () => {
    expect(calculateBudgetProgress(100, 0).percentage).toBe(0);
  });

  it("limita o percentual a 100 quando estoura o orçamento", () => {
    expect(calculateBudgetProgress(1500, 1000).percentage).toBe(100);
  });

  it("calcula o percentual consumido", () => {
    const progress = calculateBudgetProgress(250, 1000);
    expect(progress.percentage).toBe(25);
    expect(progress.remaining).toBe(750);
  });
});

describe("compareMonthlySummaryWithCloseResult", () => {
  const summary = calculateMonthlySummary(
    [makeExpense({ amount: 400, due_date: "2026-09-05", paid: true })],
    [makeIncome({ amount: 1000 })],
    SEPTEMBER,
    500,
  );

  const result: CloseMonthResult = {
    success: true,
    total_incomes: 1000,
    total_expenses: 400,
    month_balance: 600,
    previous_balance: 0,
    new_shared_balance: 600,
    monthly_budget: 500,
    last_closed_month: SEPTEMBER,
  };

  it("não aponta divergência quando os valores são iguais", () => {
    expect(compareMonthlySummaryWithCloseResult(summary, result)).toEqual([]);
  });

  it("tolera ruído de ponto flutuante", () => {
    expect(
      compareMonthlySummaryWithCloseResult(summary, {
        ...result,
        total_expenses: 400.0000001,
      }),
    ).toEqual([]);
  });

  it("aponta os campos divergentes", () => {
    const divergences = compareMonthlySummaryWithCloseResult(summary, {
      ...result,
      total_expenses: 450,
    });
    expect(divergences).toEqual([
      { field: "totalExpenses", client: 400, server: 450 },
    ]);
  });
});
