import { describe, expect, it } from "@jest/globals";
import type {
  Couple,
  Expense,
  FinancialGoal,
  Income,
  MonthlyClosing,
} from "../../../types/domain";
import {
  resolveRelationshipPeriod,
  resolveRelationshipStatus,
  summarizeRelationshipData,
} from "../model";

function makeCouple(overrides: Partial<Couple> = {}): Couple {
  return {
    id: "c1",
    user_a: "u1",
    user_b: "u2",
    status: "ended",
    split_mode: "manual",
    split_ratio_a: 50,
    split_ratio_b: 50,
    monthly_budget: 0,
    shared_balance: 0,
    last_closed_month: null,
    linked_at: "2025-03-12T12:00:00.000Z",
    created_at: "2025-03-12T12:00:00.000Z",
    ended_at: "2026-09-01T12:00:00.000Z",
    ended_by: "u1",
    ...overrides,
  };
}

describe("resolveRelationshipStatus", () => {
  it("rotula cada estado", () => {
    expect(resolveRelationshipStatus("active")).toEqual({
      label: "Vínculo ativo",
      tone: "success",
    });
    expect(resolveRelationshipStatus("pending")).toEqual({
      label: "Convite pendente",
      tone: "warning",
    });
    expect(resolveRelationshipStatus("ended")).toEqual({
      label: "Encerrado",
      tone: "neutral",
    });
  });
});

describe("resolveRelationshipPeriod", () => {
  it("mostra início e fim quando encerrado", () => {
    expect(resolveRelationshipPeriod(makeCouple())).toEqual({
      start: "12/03/2025",
      end: "01/09/2026",
      label: "12/03/2025 – 01/09/2026",
    });
  });

  it("mostra 'Desde' quando ainda aberto", () => {
    const period = resolveRelationshipPeriod(
      makeCouple({ status: "active", ended_at: null }),
    );
    expect(period.end).toBeNull();
    expect(period.label).toBe("Desde 12/03/2025");
  });

  it("usa created_at quando não há linked_at", () => {
    const period = resolveRelationshipPeriod(
      makeCouple({ linked_at: null, ended_at: null }),
    );
    expect(period.label).toBe("Desde 12/03/2025");
  });

  it("tem fallback neutro sem datas", () => {
    const period = resolveRelationshipPeriod(
      makeCouple({ linked_at: null, created_at: "", ended_at: null }),
    );
    expect(period.label).toBe("Período não informado");
  });
});

describe("summarizeRelationshipData", () => {
  it("soma valores e conta registros", () => {
    const totals = summarizeRelationshipData({
      expenses: [{ amount: 100 } as Expense, { amount: 50 } as Expense],
      incomes: [{ amount: 500 } as Income],
      closings: [{ id: "cl1" } as MonthlyClosing],
      goals: [{ id: "g1" } as FinancialGoal, { id: "g2" } as FinancialGoal],
    });

    expect(totals).toEqual({
      totalExpenses: 150,
      totalIncomes: 500,
      balance: 350,
      expensesCount: 2,
      incomesCount: 1,
      closingsCount: 1,
      goalsCount: 2,
    });
  });

  it("zera sem dados", () => {
    const totals = summarizeRelationshipData({
      expenses: [],
      incomes: [],
      closings: [],
      goals: [],
    });
    expect(totals.totalExpenses).toBe(0);
    expect(totals.balance).toBe(0);
  });
});
