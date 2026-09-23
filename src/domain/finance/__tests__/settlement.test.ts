import { describe, expect, it } from "@jest/globals";
import type { Expense } from "../../../types/domain";
import {
  calculateSettlement,
  resolveSettlementOutcome,
  resolveSettlementPerspective,
  type SettlementExpense,
} from "../settlement";

const USER_A = "user-a";
const USER_B = "user-b";

function makeExpense(
  overrides: Partial<SettlementExpense> = {},
): SettlementExpense {
  return {
    amount: 100,
    paid: true,
    paid_by: USER_A,
    ...overrides,
  };
}

function settle(expenses: SettlementExpense[], splitRatioA = 50) {
  return calculateSettlement({
    expenses,
    splitRatioA,
    userIdA: USER_A,
    userIdB: USER_B,
  });
}

describe("calculateSettlement", () => {
  it("divide 50/50 e fica equilibrado quando cada um paga a própria parte", () => {
    const result = settle([
      makeExpense({ amount: 50, paid_by: USER_A }),
      makeExpense({ amount: 50, paid_by: USER_B }),
    ]);

    expect(result).toMatchObject({
      totalPaid: 100,
      totalPending: 0,
      expectedA: 50,
      expectedB: 50,
      paidA: 50,
      paidB: 50,
      differenceA: 0,
      differenceB: 0,
      balanced: true,
    });
  });

  it("divide 60/40 conforme o percentual do período", () => {
    const result = settle(
      [
        makeExpense({ amount: 120, paid_by: USER_A }),
        makeExpense({ amount: 80, paid_by: USER_B }),
      ],
      60,
    );

    expect(result.expectedA).toBe(120);
    expect(result.expectedB).toBe(80);
    expect(result.balanced).toBe(true);
  });

  it("aponta adiantamento quando um único pagador paga tudo", () => {
    const result = settle([makeExpense({ amount: 100, paid_by: USER_A })], 50);

    expect(result.paidA).toBe(100);
    expect(result.paidB).toBe(0);
    expect(result.differenceA).toBe(50);
    expect(result.differenceB).toBe(-50);
    expect(result.balanced).toBe(false);
  });

  it("mantém as diferenças compensando quando um paga mais que a parte", () => {
    const result = settle(
      [
        makeExpense({ amount: 150, paid_by: USER_A }),
        makeExpense({ amount: 50, paid_by: USER_B }),
      ],
      60,
    );

    expect(result.expectedA).toBe(120);
    expect(result.expectedB).toBe(80);
    expect(result.differenceA).toBe(30);
    expect(result.differenceB).toBe(-30);
    expect(result.differenceA + result.differenceB).toBe(0);
  });

  it("separa despesas pendentes e não as trata como pagas", () => {
    const result = settle([
      makeExpense({ amount: 100, paid: true, paid_by: USER_A }),
      makeExpense({ amount: 999, paid: false, paid_by: null }),
    ]);

    expect(result.totalPaid).toBe(100);
    expect(result.totalPending).toBe(999);
    expect(result.expectedA).toBe(50);
    expect(result.expectedB).toBe(50);
    expect(result.paidB).toBe(0);
  });

  it("trata pendência com paid_by preenchido apenas como pendente", () => {
    const result = settle([
      makeExpense({ amount: 100, paid: true, paid_by: USER_A }),
      makeExpense({ amount: 40, paid: false, paid_by: USER_B }),
    ]);

    expect(result.totalPending).toBe(40);
    expect(result.paidB).toBe(0);
    expect(result.expectedA + result.expectedB).toBe(result.totalPaid);
  });

  it("respeita o arredondamento monetário sem perder centavos", () => {
    const result = settle(
      [
        makeExpense({ amount: 33.33, paid_by: USER_A }),
        makeExpense({ amount: 66.67, paid_by: USER_B }),
      ],
      33.33,
    );

    expect(result.expectedA).toBe(33.33);
    expect(result.expectedB).toBe(66.67);
    expect(result.expectedA + result.expectedB).toBeCloseTo(100, 10);
    expect(result.balanced).toBe(true);
  });

  it("mês sem despesas zera tudo e fica equilibrado", () => {
    const result = settle([]);

    expect(result).toEqual({
      totalPaid: 0,
      totalPending: 0,
      expectedA: 0,
      expectedB: 0,
      paidA: 0,
      paidB: 0,
      differenceA: 0,
      differenceB: 0,
      paidUnattributed: 0,
      balanced: true,
    });
  });

  it("expõe o valor pago sem pagador válido (defensivo)", () => {
    const result = settle([
      makeExpense({ amount: 60, paid_by: null }),
      makeExpense({ amount: 40, paid_by: USER_A }),
    ]);

    expect(result.totalPaid).toBe(100);
    expect(result.paidA).toBe(40);
    expect(result.paidUnattributed).toBe(60);
    expect(result.balanced).toBe(false);
  });

  it("ignora valores inválidos", () => {
    const result = settle([
      makeExpense({ amount: Number.NaN, paid_by: USER_A }),
      makeExpense({ amount: 100, paid_by: USER_A }),
    ]);

    expect(result.totalPaid).toBe(100);
    expect(result.paidA).toBe(100);
  });

  it("aceita despesas compatíveis com o tipo Expense da aplicação", () => {
    const expense: Expense = {
      id: "e1",
      couple_id: "c1",
      created_by: USER_A,
      paid_by: USER_B,
      description: "Mercado",
      amount: 80,
      category: "Mercado",
      due_date: null,
      paid: true,
      paid_at: null,
      is_recurring: false,
      recurrence_series_id: null,
      created_at: "2026-09-10T12:00:00.000Z",
    };

    const result = settle([expense]);

    expect(result.paidB).toBe(80);
    expect(result.differenceB).toBe(40);
  });
});

describe("resolveSettlementPerspective", () => {
  const result = settle([
    makeExpense({ amount: 200, paid_by: USER_A }),
    makeExpense({ amount: 0, paid_by: USER_B }),
  ]);

  it("mantém os valores quando a pessoa é user_a", () => {
    expect(resolveSettlementPerspective(result, true)).toEqual({
      selfExpected: 100,
      partnerExpected: 100,
      selfPaid: 200,
      partnerPaid: 0,
      selfDifference: 100,
      partnerDifference: -100,
    });
  });

  it("inverte os valores quando a pessoa é user_b", () => {
    expect(resolveSettlementPerspective(result, false)).toEqual({
      selfExpected: 100,
      partnerExpected: 100,
      selfPaid: 0,
      partnerPaid: 200,
      selfDifference: -100,
      partnerDifference: 100,
    });
  });
});

describe("resolveSettlementOutcome", () => {
  it("indica que você adiantou quando a diferença é positiva", () => {
    expect(resolveSettlementOutcome(80)).toEqual({
      outcome: "self_advanced",
      amount: 80,
    });
  });

  it("indica que o parceiro adiantou quando a diferença é negativa", () => {
    expect(resolveSettlementOutcome(-42.5)).toEqual({
      outcome: "partner_advanced",
      amount: 42.5,
    });
  });

  it("trata a diferença dentro da tolerância como equilibrada", () => {
    expect(resolveSettlementOutcome(0)).toEqual({
      outcome: "balanced",
      amount: 0,
    });
    expect(resolveSettlementOutcome(0.004)).toEqual({
      outcome: "balanced",
      amount: 0,
    });
  });

  it("trata valor inválido como equilibrado", () => {
    expect(resolveSettlementOutcome(Number.NaN)).toEqual({
      outcome: "balanced",
      amount: 0,
    });
  });
});
