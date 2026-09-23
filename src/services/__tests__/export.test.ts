import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as activityService from "../activity";
import * as closingService from "../monthlyClosing";
import * as coupleService from "../couple";
import * as expenseService from "../expense";
import * as goalService from "../goal";
import * as incomeService from "../income";
import { EXPORT_ACTIVITY_LIMIT, fetchExportDataset } from "../export";
import type { Couple, Expense, Income } from "../../types/domain";

jest.mock("../activity", () => ({ fetchCoupleActivity: jest.fn() }));
jest.mock("../monthlyClosing", () => ({ fetchMonthlyClosings: jest.fn() }));
jest.mock("../couple", () => ({ fetchPartner: jest.fn() }));
jest.mock("../expense", () => ({ fetchExpenses: jest.fn() }));
jest.mock("../goal", () => ({ fetchGoalsOverview: jest.fn() }));
jest.mock("../income", () => ({ fetchIncomes: jest.fn() }));

const fetchExpenses = jest.mocked(expenseService.fetchExpenses);
const fetchIncomes = jest.mocked(incomeService.fetchIncomes);
const fetchMonthlyClosings = jest.mocked(closingService.fetchMonthlyClosings);
const fetchGoalsOverview = jest.mocked(goalService.fetchGoalsOverview);
const fetchCoupleActivity = jest.mocked(activityService.fetchCoupleActivity);
const fetchPartner = jest.mocked(coupleService.fetchPartner);

function makeCouple(overrides: Partial<Couple> = {}): Couple {
  return {
    id: "c1",
    user_a: "u1",
    user_b: "u2",
    status: "active",
    split_mode: "income_based",
    split_ratio_a: 50,
    split_ratio_b: 50,
    monthly_budget: 0,
    shared_balance: 0,
    last_closed_month: null,
    linked_at: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    ended_at: null,
    ended_by: null,
    ...overrides,
  };
}

const self = { id: "u1", full_name: "Rafa" };

beforeEach(() => {
  jest.clearAllMocks();
  fetchExpenses.mockResolvedValue({ data: [] as Expense[], error: null });
  fetchIncomes.mockResolvedValue({ data: [] as Income[], error: null });
  fetchMonthlyClosings.mockResolvedValue({ data: [], error: null });
  fetchGoalsOverview.mockResolvedValue({
    data: { goals: [], contributions: [] },
    error: null,
  });
  fetchCoupleActivity.mockResolvedValue({ data: [], error: null });
  fetchPartner.mockResolvedValue({
    data: {
      id: "u2",
      full_name: "Edu",
      monthly_income: null,
      avatar_path: null,
    },
    error: null,
  });
});

describe("fetchExportDataset", () => {
  it("agrega os dados e resolve os membros do vínculo", async () => {
    fetchExpenses.mockResolvedValue({
      data: [{ id: "e1" } as Expense],
      error: null,
    });
    fetchIncomes.mockResolvedValue({
      data: [{ id: "i1" } as Income],
      error: null,
    });

    const result = await fetchExportDataset(makeCouple(), self);

    expect(result.error).toBeNull();
    expect(result.data?.selfId).toBe("u1");
    expect(result.data?.members).toEqual([
      { id: "u1", full_name: "Rafa" },
      { id: "u2", full_name: "Edu" },
    ]);
    expect(result.data?.expenses).toHaveLength(1);
    expect(result.data?.incomes).toHaveLength(1);
    expect(fetchCoupleActivity).toHaveBeenCalledWith(
      "c1",
      EXPORT_ACTIVITY_LIMIT,
    );
  });

  it("propaga o primeiro erro de leitura", async () => {
    fetchMonthlyClosings.mockResolvedValue({
      data: null,
      error: { code: "permission", message: "permission denied" },
    });

    const result = await fetchExportDataset(makeCouple(), self);

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("permission denied");
  });

  it("usa o id do casal quando o parceiro não é retornado pela view", async () => {
    fetchPartner.mockResolvedValue({ data: null, error: null });

    const result = await fetchExportDataset(makeCouple(), self);

    expect(result.data?.members[1]).toEqual({ id: "u2", full_name: null });
  });
});
