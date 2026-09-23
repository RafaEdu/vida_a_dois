import { describe, expect, it } from "@jest/globals";
import type { Expense, Income } from "../../../types/domain";
import {
  buildTransactionEntries,
  collectExpenseCategories,
  filterTransactionEntries,
  groupTransactionEntries,
  hasActiveTransactionFilters,
  sortTransactionEntries,
  type TransactionFilterState,
  type TransactionIdentity,
} from "../model";

const identity: TransactionIdentity = {
  selfId: "u1",
  partnerId: "u2",
  partnerName: "Edu",
};

const TODAY = new Date(2026, 8, 21);

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
    created_at: "2026-09-10T12:00:00.000Z",
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
    received_at: "2026-09-10T12:00:00.000Z",
    created_at: "2026-09-10T12:00:00.000Z",
    ...overrides,
  };
}

function filters(
  overrides: Partial<TransactionFilterState> = {},
): TransactionFilterState {
  return {
    type: "all",
    person: "all",
    category: null,
    status: "all",
    ...overrides,
  };
}

describe("buildTransactionEntries / sortTransactionEntries", () => {
  it("mescla despesas e receitas ordenando da data mais recente", () => {
    const entries = buildTransactionEntries(
      [
        makeExpense({ id: "e1", due_date: "2026-09-05" }),
        makeExpense({ id: "e2", due_date: "2026-09-20" }),
      ],
      [makeIncome({ id: "i1", received_at: "2026-09-15T12:00:00.000Z" })],
      identity,
    );

    expect(entries.map((entry) => entry.id)).toEqual(["e2", "i1", "e1"]);
  });

  it("atribui metadados de pagador/recebedor por parceiro", () => {
    const entries = buildTransactionEntries(
      [makeExpense({ id: "e1", paid: true, paid_by: "u2" })],
      [makeIncome({ id: "i1", user_id: "u1" })],
      identity,
    );

    expect(entries.find((entry) => entry.id === "e1")?.meta).toBe(
      "Pago por Edu",
    );
    expect(entries.find((entry) => entry.id === "i1")?.meta).toBe(
      "Recebido por você",
    );
  });

  it("não exibe pagador em despesa pendente", () => {
    const [entry] = buildTransactionEntries(
      [makeExpense({ id: "e1", paid: false, paid_by: null })],
      [],
      identity,
    );

    expect(entry.meta).toBeUndefined();
    expect(entry.status.label).toBe("Pendente");
  });

  it("usa created_at como data quando não há data própria", () => {
    const [entry] = sortTransactionEntries([
      ...buildTransactionEntries(
        [makeExpense({ id: "e1", due_date: null })],
        [],
        identity,
      ),
    ]);
    expect(entry.dateKey).toBe("2026-09-10");
  });
});

describe("groupTransactionEntries", () => {
  it("agrupa por data com rótulos Hoje/Ontem/data", () => {
    const entries = buildTransactionEntries(
      [
        makeExpense({ id: "e1", due_date: "2026-09-21" }),
        makeExpense({ id: "e2", due_date: "2026-09-20" }),
      ],
      [
        makeIncome({
          id: "i1",
          received_at: "2026-09-19T12:00:00.000Z",
        }),
      ],
      identity,
    );

    const groups = groupTransactionEntries(entries, TODAY);
    expect(groups.map((group) => group.label)).toEqual([
      "Hoje",
      "Ontem",
      "19/09/2026",
    ]);
    expect(groups[0].data).toHaveLength(1);
  });

  it("rotula datas ausentes como Sem data", () => {
    const groups = groupTransactionEntries(
      [
        ...buildTransactionEntries(
          [makeExpense({ id: "e1", due_date: null, created_at: "" })],
          [],
          identity,
        ),
      ],
      TODAY,
    );
    expect(groups[0].label).toBe("Sem data");
  });
});

describe("filterTransactionEntries", () => {
  const entries = buildTransactionEntries(
    [
      makeExpense({
        id: "e1",
        category: "Alimentação",
        paid: true,
        paid_by: "u1",
        due_date: "2026-09-10",
      }),
      makeExpense({
        id: "e2",
        category: "Transporte",
        paid: false,
        paid_by: null,
        due_date: "2026-09-11",
      }),
      makeExpense({
        id: "e3",
        category: "Lazer",
        paid: true,
        paid_by: "u2",
        due_date: "2026-09-12",
      }),
    ],
    [makeIncome({ id: "i1", user_id: "u1" })],
    identity,
  );

  it("filtra por tipo", () => {
    expect(
      filterTransactionEntries(
        entries,
        filters({ type: "income" }),
        identity,
      ).map((entry) => entry.id),
    ).toEqual(["i1"]);
  });

  it("filtra por pessoa", () => {
    expect(
      filterTransactionEntries(
        entries,
        filters({ person: "partner" }),
        identity,
      ).map((entry) => entry.id),
    ).toEqual(["e3"]);
  });

  it("filtra por categoria apenas em despesas", () => {
    expect(
      filterTransactionEntries(
        entries,
        filters({ category: "Alimentação" }),
        identity,
      ).map((entry) => entry.id),
    ).toEqual(["e1"]);
  });

  it("filtra por status de pagamento e exclui receitas", () => {
    expect(
      filterTransactionEntries(
        entries,
        filters({ status: "pending" }),
        identity,
      ).map((entry) => entry.id),
    ).toEqual(["e2"]);
    expect(
      filterTransactionEntries(
        entries,
        filters({ status: "paid" }),
        identity,
      ).map((entry) => entry.id),
    ).toEqual(["e3", "e1"]);
  });

  it("sem filtros retorna tudo", () => {
    expect(filterTransactionEntries(entries, filters(), identity)).toHaveLength(
      4,
    );
  });
});

describe("hasActiveTransactionFilters", () => {
  it("detecta filtros ativos e inativos", () => {
    expect(hasActiveTransactionFilters(filters())).toBe(false);
    expect(hasActiveTransactionFilters(filters({ type: "expense" }))).toBe(
      true,
    );
    expect(hasActiveTransactionFilters(filters({ category: "Lazer" }))).toBe(
      true,
    );
  });
});

describe("collectExpenseCategories", () => {
  it("coleta categorias únicas em ordem alfabética", () => {
    expect(
      collectExpenseCategories([
        makeExpense({ category: "Transporte" }),
        makeExpense({ category: "Alimentação" }),
        makeExpense({ category: "Transporte" }),
      ]),
    ).toEqual(["Alimentação", "Transporte"]);
  });
});
