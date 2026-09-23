import { describe, expect, it } from "@jest/globals";
import type {
  Couple,
  CoupleActivity,
  Expense,
  FinancialGoal,
  GoalContribution,
  Income,
  MonthlyClosing,
} from "../../../types/domain";
import {
  buildClosingsCsv,
  buildExpensesCsv,
  buildExportFilename,
  buildIncomesCsv,
  buildJsonBackup,
  buildMonthlySummaryCsv,
  formatFilenameTimestamp,
  type ExportDataset,
} from "../builders";

function makeCouple(overrides: Partial<Couple> = {}): Couple {
  return {
    id: "c1",
    user_a: "u1",
    user_b: "u2",
    status: "ended",
    split_mode: "income_based",
    split_ratio_a: 60,
    split_ratio_b: 40,
    monthly_budget: 3000,
    shared_balance: 1500,
    last_closed_month: "2026-08",
    linked_at: "2025-03-12T12:00:00.000Z",
    created_at: "2025-03-12T12:00:00.000Z",
    ended_at: "2026-09-01T12:00:00.000Z",
    ended_by: "u1",
    ...overrides,
  };
}

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
    paid_by: "u2",
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
    closed_by: "u2",
    closed_at: "2026-08-31T12:00:00.000Z",
    ...overrides,
  };
}

function makeDataset(overrides: Partial<ExportDataset> = {}): ExportDataset {
  return {
    couple: makeCouple(),
    selfId: "u1",
    members: [
      { id: "u1", full_name: "Rafa" },
      { id: "u2", full_name: "Edu" },
    ],
    expenses: [makeExpense()],
    incomes: [makeIncome()],
    closings: [makeClosing()],
    goals: [
      {
        id: "g1",
        couple_id: "c1",
        title: "Viagem",
        target_amount: 10000,
        target_date: "2027-01-01",
        status: "active",
        created_by: "u1",
        created_at: "2026-01-01T12:00:00.000Z",
        updated_at: "2026-01-01T12:00:00.000Z",
      } satisfies FinancialGoal,
    ],
    contributions: [
      {
        id: "gc1",
        goal_id: "g1",
        user_id: "u1",
        amount: 500,
        contributed_at: "2026-02-01T12:00:00.000Z",
        note: null,
      } satisfies GoalContribution,
    ],
    activity: [] as CoupleActivity[],
    ...overrides,
  };
}

describe("buildExpensesCsv", () => {
  it("gera cabeçalho e linhas com nomes e status", () => {
    const file = buildExpensesCsv(
      makeDataset({
        expenses: [
          makeExpense({ id: "e2", due_date: "2026-09-20" }),
          makeExpense({
            id: "e1",
            due_date: "2026-09-10",
            paid: false,
            paid_at: null,
            paid_by: null,
          }),
        ],
      }),
    );

    expect(file.filename).toMatch(/^vida-a-dois-despesas-\d{8}-\d{4}\.csv$/);
    const lines = file.content.split("\r\n").filter(Boolean);
    expect(lines[0]).toContain("Data;Descrição;Categoria;Valor;Status");
    expect(lines[1]).toContain("10/09/2026;Mercado;Mercado;100,00;Pendente");
    expect(lines[2]).toContain("20/09/2026;Mercado;Mercado;100,00;Pago");
    expect(lines[2]).toContain("Edu");
  });
});

describe("buildIncomesCsv", () => {
  it("resolve o recebedor pelo nome", () => {
    const file = buildIncomesCsv(makeDataset());
    expect(file.content).toContain("Rafa");
    expect(file.content).toContain("05/09/2026");
  });
});

describe("buildClosingsCsv", () => {
  it("usa nome longo do mês e divisão por extenso", () => {
    const file = buildClosingsCsv(makeDataset());
    expect(file.content).toContain("Agosto de 2026");
    expect(file.content).toContain("Edu");
    expect(file.content).toContain("50,00");
  });
});

describe("buildMonthlySummaryCsv", () => {
  it("marca mês fechado e usa o snapshot", () => {
    const file = buildMonthlySummaryCsv(makeDataset());
    const lines = file.content.split("\r\n").filter(Boolean);
    const august = lines.find((line) => line.includes("Agosto de 2026"));
    expect(august).toContain("5000,00");
    expect(august).toContain("Sim");
  });

  it("marca mês aberto com os totais calculados", () => {
    const file = buildMonthlySummaryCsv(
      makeDataset({ closings: [], goals: [], contributions: [] }),
    );
    const lines = file.content.split("\r\n").filter(Boolean);
    const september = lines.find((line) => line.includes("Setembro de 2026"));
    expect(september).toContain("500,00");
    expect(september).toContain("Não");
  });
});

describe("buildJsonBackup", () => {
  it("inclui relacionamento, metas e contribuições sem ids internos", () => {
    const file = buildJsonBackup(makeDataset(), {
      generatedAt: new Date("2026-09-21T10:00:00.000Z"),
    });

    expect(file.filename).toBe(
      `vida-a-dois-backup-${formatFilenameTimestamp(
        new Date("2026-09-21T10:00:00.000Z"),
      )}.json`,
    );

    const parsed = JSON.parse(file.content) as {
      relacionamento: { parceiro: string; status: string };
      metas: unknown[];
      contribuicoes: unknown[];
    };
    expect(parsed.relacionamento.parceiro).toBe("Edu");
    expect(parsed.relacionamento.status).toBe("ended");
    expect(parsed.metas).toHaveLength(1);
    expect(parsed.contribuicoes).toHaveLength(1);
  });

  it("não vaza ids internos nem chaves estrangeiras", () => {
    const file = buildJsonBackup(makeDataset());
    expect(file.content).not.toContain("couple_id");
    expect(file.content).not.toContain("created_by");
    expect(file.content).not.toContain("recurrence_series_id");
    expect(file.content).not.toContain("user_id");
  });
});

describe("buildExportFilename", () => {
  it("normaliza o prefixo e aplica timestamp", () => {
    expect(
      buildExportFilename("Resumo Mensal", "csv", new Date(2026, 8, 21, 9, 5)),
    ).toBe("vida-a-dois-resumo-mensal-20260921-0905.csv");
  });
});
