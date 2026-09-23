import { describe, expect, it } from "@jest/globals";
import type { CategoryBudget, Expense } from "../../../types/domain";
import { selectExpensesByMonth } from "../selectors";
import {
  CATEGORY_BUDGET_WARNING_THRESHOLD,
  calculateCategoryBudgetProgress,
  calculateCategoryBudgetProgresses,
  resolveCategoryBudgetOverflow,
  resolveCategoryBudgetStatus,
  selectCategoryBudgetHighlights,
  sumCategoryBudgetLimits,
} from "../categoryBudgets";

const SEPTEMBER = "2026-09";
const septemberTimestamp = new Date(2026, 8, 10, 12).toISOString();
const augustTimestamp = new Date(2026, 7, 10, 12).toISOString();

function makeBudget(overrides: Partial<CategoryBudget> = {}): CategoryBudget {
  return {
    id: "b1",
    couple_id: "c1",
    category: "Alimentação (mercado)",
    monthly_amount: 1000,
    created_at: septemberTimestamp,
    updated_at: septemberTimestamp,
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    couple_id: "c1",
    created_by: "u1",
    paid_by: null,
    description: "Despesa",
    amount: 100,
    category: "Alimentação (mercado)",
    due_date: "2026-09-05",
    paid: false,
    paid_at: null,
    is_recurring: false,
    recurrence_series_id: null,
    created_at: septemberTimestamp,
    ...overrides,
  };
}

describe("resolveCategoryBudgetStatus", () => {
  it("classifica ok, warning e over", () => {
    expect(resolveCategoryBudgetStatus(0)).toBe("ok");
    expect(resolveCategoryBudgetStatus(0.79)).toBe("ok");
    expect(resolveCategoryBudgetStatus(CATEGORY_BUDGET_WARNING_THRESHOLD)).toBe(
      "warning",
    );
    expect(resolveCategoryBudgetStatus(0.99)).toBe("warning");
    expect(resolveCategoryBudgetStatus(1)).toBe("over");
    expect(resolveCategoryBudgetStatus(1.5)).toBe("over");
  });
});

describe("calculateCategoryBudgetProgress", () => {
  it("calcula o progresso dentro do limite", () => {
    const progress = calculateCategoryBudgetProgress(
      makeBudget({ monthly_amount: 1000 }),
      250,
    );

    expect(progress).toMatchObject({
      limit: 1000,
      spent: 250,
      remaining: 750,
      share: 0.25,
      percentage: 25,
      status: "ok",
    });
  });

  it("marca aviso a partir de 80%", () => {
    const progress = calculateCategoryBudgetProgress(
      makeBudget({ monthly_amount: 1000 }),
      850,
    );

    expect(progress.status).toBe("warning");
    expect(progress.percentage).toBe(85);
  });

  it("estoura o limite com percentual acima de 100 e restante negativo", () => {
    const progress = calculateCategoryBudgetProgress(
      makeBudget({ monthly_amount: 1000 }),
      1300,
    );

    expect(progress.status).toBe("over");
    expect(progress.percentage).toBe(130);
    expect(progress.remaining).toBe(-300);
  });

  it("zera a proporção quando não há limite (defensivo)", () => {
    const progress = calculateCategoryBudgetProgress(
      makeBudget({ monthly_amount: 0 }),
      300,
    );

    expect(progress.share).toBe(0);
    expect(progress.percentage).toBe(0);
    expect(progress.status).toBe("ok");
  });
});

describe("calculateCategoryBudgetProgresses", () => {
  it("casa a despesa pela categoria e zera as sem despesa", () => {
    const budgets = [
      makeBudget({ id: "b1", category: "Alimentação (mercado)" }),
      makeBudget({
        id: "b2",
        category: "Categoria antiga removida",
        monthly_amount: 200,
      }),
    ];
    const expenses = [
      makeExpense({ category: "Alimentação (mercado)", amount: 400 }),
    ];

    const progresses = calculateCategoryBudgetProgresses(budgets, expenses);

    const groceries = progresses.find((p) => p.id === "b1");
    const removed = progresses.find((p) => p.id === "b2");

    expect(groceries?.spent).toBe(400);
    expect(removed?.spent).toBe(0);
    expect(removed?.status).toBe("ok");
  });

  it("soma apenas o mês selecionado (mesma seleção das despesas)", () => {
    const budgets = [makeBudget({ id: "b1" })];
    const expenses = [
      makeExpense({ amount: 200, due_date: "2026-09-05" }),
      makeExpense({ id: "e2", amount: 999, due_date: "2026-08-05" }),
      makeExpense({
        id: "e3",
        amount: 50,
        due_date: null,
        created_at: augustTimestamp,
      }),
    ];

    const monthExpenses = selectExpensesByMonth(expenses, SEPTEMBER);
    const progresses = calculateCategoryBudgetProgresses(
      budgets,
      monthExpenses,
    );

    expect(progresses[0].spent).toBe(200);
  });

  it("ordena do mais crítico para o menos crítico", () => {
    const budgets = [
      makeBudget({
        id: "ok",
        category: "Saúde e farmácia",
        monthly_amount: 500,
      }),
      makeBudget({ id: "over", category: "Transporte", monthly_amount: 100 }),
      makeBudget({ id: "warn", category: "Lazer", monthly_amount: 100 }),
    ];
    const expenses = [
      makeExpense({ category: "Transporte", amount: 300 }),
      makeExpense({ id: "e2", category: "Lazer", amount: 90 }),
      makeExpense({ id: "e3", category: "Saúde e farmácia", amount: 10 }),
    ];

    const progresses = calculateCategoryBudgetProgresses(budgets, expenses);

    expect(progresses.map((p) => p.id)).toEqual(["over", "warn", "ok"]);
  });

  it("retorna lista vazia quando não há limites configurados", () => {
    expect(calculateCategoryBudgetProgresses([], [makeExpense()])).toEqual([]);
  });
});

describe("sumCategoryBudgetLimits", () => {
  it("soma os limites e trata lista vazia", () => {
    expect(
      sumCategoryBudgetLimits([
        makeBudget({ monthly_amount: 500 }),
        makeBudget({ id: "b2", monthly_amount: 250.5 }),
      ]),
    ).toBe(750.5);
    expect(sumCategoryBudgetLimits([])).toBe(0);
  });
});

describe("resolveCategoryBudgetOverflow", () => {
  it("não alerta quando a soma cabe no orçamento global", () => {
    expect(resolveCategoryBudgetOverflow(800, 1000)).toEqual({
      exceeded: false,
      difference: 0,
    });
  });

  it("alerta e calcula a diferença quando excede", () => {
    const overflow = resolveCategoryBudgetOverflow(1300, 1000);
    expect(overflow.exceeded).toBe(true);
    expect(overflow.difference).toBeCloseTo(300);
  });

  it("não alerta sem orçamento global definido", () => {
    expect(resolveCategoryBudgetOverflow(1300, 0)).toEqual({
      exceeded: false,
      difference: 0,
    });
  });

  it("tolera ruído de ponto flutuante", () => {
    expect(resolveCategoryBudgetOverflow(1000.004, 1000).exceeded).toBe(false);
  });
});

describe("selectCategoryBudgetHighlights", () => {
  it("mantém apenas categorias em aviso ou acima do limite", () => {
    const budgets = [
      makeBudget({ id: "ok", category: "A", monthly_amount: 100 }),
      makeBudget({ id: "warn", category: "B", monthly_amount: 100 }),
      makeBudget({ id: "over", category: "C", monthly_amount: 100 }),
    ];
    const expenses = [
      makeExpense({ category: "A", amount: 10 }),
      makeExpense({ id: "e2", category: "B", amount: 85 }),
      makeExpense({ id: "e3", category: "C", amount: 120 }),
    ];

    const highlights = selectCategoryBudgetHighlights(
      calculateCategoryBudgetProgresses(budgets, expenses),
    );

    expect(highlights.map((p) => p.id).sort()).toEqual(["over", "warn"]);
  });
});
