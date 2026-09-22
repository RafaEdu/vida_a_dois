import { describe, expect, it } from "@jest/globals";
import type { Expense, Income } from "../../../types/domain";
import { sortExpenses, sortIncomes } from "../order";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    couple_id: "c1",
    created_by: "u1",
    paid_by: "u1",
    description: "Despesa",
    amount: 100,
    category: "Outros",
    due_date: "2026-09-05",
    paid: false,
    paid_at: null,
    is_recurring: false,
    recurrence_series_id: null,
    created_at: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: "i1",
    couple_id: "c1",
    user_id: "u1",
    description: "Receita",
    amount: 100,
    is_extra: false,
    received_at: "2026-09-01T12:00:00.000Z",
    created_at: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("sortExpenses", () => {
  it("ordena por due_date decrescente", () => {
    const older = makeExpense({ id: "e1", due_date: "2026-09-05" });
    const newer = makeExpense({ id: "e2", due_date: "2026-10-05" });

    const sorted = sortExpenses([older, newer]);

    expect(sorted.map((item) => item.id)).toEqual(["e2", "e1"]);
  });

  it("usa created_at como fallback quando não há due_date", () => {
    const withDue = makeExpense({ id: "e1", due_date: "2026-09-05" });
    const withoutDue = makeExpense({
      id: "e2",
      due_date: null,
      created_at: "2026-11-10T12:00:00.000Z",
    });

    const sorted = sortExpenses([withDue, withoutDue]);

    expect(sorted.map((item) => item.id)).toEqual(["e2", "e1"]);
  });

  it("desempata por created_at decrescente", () => {
    const a = makeExpense({
      id: "e1",
      due_date: "2026-09-05",
      created_at: "2026-08-01T12:00:00.000Z",
    });
    const b = makeExpense({
      id: "e2",
      due_date: "2026-09-05",
      created_at: "2026-09-01T12:00:00.000Z",
    });

    const sorted = sortExpenses([a, b]);

    expect(sorted.map((item) => item.id)).toEqual(["e2", "e1"]);
  });

  it("não muta o array original", () => {
    const list = [
      makeExpense({ id: "e1", due_date: "2026-09-05" }),
      makeExpense({ id: "e2", due_date: "2026-10-05" }),
    ];

    sortExpenses(list);

    expect(list.map((item) => item.id)).toEqual(["e1", "e2"]);
  });
});

describe("sortIncomes", () => {
  it("ordena por received_at decrescente", () => {
    const older = makeIncome({
      id: "i1",
      received_at: "2026-09-01T10:00:00.000Z",
    });
    const newer = makeIncome({
      id: "i2",
      received_at: "2026-09-20T10:00:00.000Z",
    });

    const sorted = sortIncomes([older, newer]);

    expect(sorted.map((item) => item.id)).toEqual(["i2", "i1"]);
  });
});
