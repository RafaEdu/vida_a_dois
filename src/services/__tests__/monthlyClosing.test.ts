import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { MonthlyClosing } from "../../types/domain";
import {
  fetchMonthlyClosing,
  fetchMonthlyClosingByMonth,
  fetchMonthlyClosings,
} from "../monthlyClosing";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

interface QueryResult {
  data: unknown;
  error: unknown;
}

type RecordedCall = Record<string, unknown>;

let calls: RecordedCall[];
let resultsByTable: Record<string, QueryResult>;

const fromMock = supabase.from as unknown as {
  mockReset: () => void;
  mockImplementation: (fn: (table: string) => unknown) => void;
};

function makeClosing(overrides: Partial<MonthlyClosing> = {}): MonthlyClosing {
  return {
    id: "cl1",
    couple_id: "c1",
    year_month: "2026-09",
    total_incomes: 1000,
    total_expenses: 400,
    monthly_budget: 500,
    split_ratio_a: 50,
    split_ratio_b: 50,
    shared_balance_before: 0,
    month_delta: 600,
    shared_balance_after: 600,
    closed_by: "u1",
    closed_at: "2026-09-30T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  calls = [];
  resultsByTable = {};

  fromMock.mockReset();
  fromMock.mockImplementation((table: string) => {
    const record: RecordedCall = { table };

    const resolve = (): Promise<QueryResult> => {
      calls.push(record);
      return Promise.resolve(
        resultsByTable[table] ?? { data: null, error: null },
      );
    };

    const api = {
      select(columns: string) {
        record.select = columns;
        return api;
      },
      eq(column: string, value: unknown) {
        const current = (record.eq as [string, unknown][] | undefined) ?? [];
        record.eq = [...current, [column, value]];
        return api;
      },
      order(column: string, options?: unknown) {
        record.order = [column, options];
        return resolve();
      },
      maybeSingle() {
        return resolve();
      },
    };

    return api;
  });
});

describe("fetchMonthlyClosings", () => {
  it("lista os fechamentos do casal do mês mais recente", async () => {
    const closings = [
      makeClosing({ id: "cl2", year_month: "2026-09" }),
      makeClosing({ id: "cl1", year_month: "2026-08" }),
    ];
    resultsByTable["monthly_closings"] = { data: closings, error: null };

    const result = await fetchMonthlyClosings("c1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual(closings);
    expect(calls).toContainEqual({
      table: "monthly_closings",
      select: "*",
      eq: [["couple_id", "c1"]],
      order: ["year_month", { ascending: false }],
    });
  });

  it("propaga erro de leitura", async () => {
    resultsByTable["monthly_closings"] = {
      data: null,
      error: { message: "permission denied" },
    };

    const result = await fetchMonthlyClosings("c1");

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("permission denied");
  });
});

describe("fetchMonthlyClosingByMonth", () => {
  it("busca o snapshot do mês pelo casal", async () => {
    const closing = makeClosing({ year_month: "2026-09" });
    resultsByTable["monthly_closings"] = { data: closing, error: null };

    const result = await fetchMonthlyClosingByMonth("c1", "2026-09");

    expect(result.error).toBeNull();
    expect(result.data).toEqual(closing);
    expect(calls).toContainEqual({
      table: "monthly_closings",
      select: "*",
      eq: [
        ["couple_id", "c1"],
        ["year_month", "2026-09"],
      ],
    });
  });

  it("devolve null quando o mês ainda não foi fechado", async () => {
    resultsByTable["monthly_closings"] = { data: null, error: null };

    const result = await fetchMonthlyClosingByMonth("c1", "2026-10");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it("propaga erro de leitura", async () => {
    resultsByTable["monthly_closings"] = {
      data: null,
      error: { message: "permission denied" },
    };

    const result = await fetchMonthlyClosingByMonth("c1", "2026-09");

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("permission denied");
  });
});

describe("fetchMonthlyClosing", () => {
  it("busca um fechamento por id", async () => {
    const closing = makeClosing();
    resultsByTable["monthly_closings"] = { data: closing, error: null };

    const result = await fetchMonthlyClosing("cl1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual(closing);
    expect(calls).toContainEqual({
      table: "monthly_closings",
      select: "*",
      eq: [["id", "cl1"]],
    });
  });

  it("devolve null quando não encontra", async () => {
    resultsByTable["monthly_closings"] = { data: null, error: null };

    const result = await fetchMonthlyClosing("missing");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });
});
