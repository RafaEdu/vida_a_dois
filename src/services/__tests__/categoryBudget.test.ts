import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { CategoryBudget } from "../../types/domain";
import {
  deleteCategoryBudget,
  fetchCategoryBudgets,
  saveCategoryBudget,
} from "../categoryBudget";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

interface QueryResult {
  data: unknown;
  error: unknown;
}

interface MockRecord {
  table: string;
  select?: string;
  eqs: [string, unknown][];
  orders: unknown[];
  upsert?: { values: unknown; options: unknown };
  isDelete: boolean;
}

const fromMock = supabase.from as unknown as {
  mockReset: () => void;
  mockImplementation: (fn: (table: string) => unknown) => void;
};

let queryResult: QueryResult;
let chainCalls: MockRecord[];

function makeBudget(overrides: Partial<CategoryBudget> = {}): CategoryBudget {
  return {
    id: "b1",
    couple_id: "c1",
    category: "Alimentação (mercado)",
    monthly_amount: 800,
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  queryResult = { data: null, error: null };
  chainCalls = [];
  fromMock.mockReset();

  fromMock.mockImplementation((table: string) => {
    const record: MockRecord = {
      table,
      eqs: [],
      orders: [],
      isDelete: false,
    };

    const resolve = (): Promise<QueryResult> => Promise.resolve(queryResult);

    const api = {
      select(columns: string) {
        record.select = columns;
        return api;
      },
      eq(column: string, value: unknown) {
        record.eqs.push([column, value]);
        return api;
      },
      order(column: string, options?: unknown) {
        record.orders.push([column, options]);
        return api;
      },
      upsert(values: unknown, options: unknown) {
        record.upsert = { values, options };
        return api;
      },
      delete() {
        record.isDelete = true;
        return api;
      },
      single() {
        chainCalls.push(record);
        return resolve();
      },
      then(
        onFulfilled: (value: QueryResult) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        chainCalls.push(record);
        return resolve().then(onFulfilled, onRejected);
      },
    };

    return api;
  });
});

describe("fetchCategoryBudgets", () => {
  it("lista os limites do casal ordenados por categoria", async () => {
    const budgets = [makeBudget()];
    queryResult = { data: budgets, error: null };

    const result = await fetchCategoryBudgets("c1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual(budgets);

    const record = chainCalls[0];
    expect(record.table).toBe("category_budgets");
    expect(record.select).toBe("*");
    expect(record.eqs).toEqual([["couple_id", "c1"]]);
    expect(record.orders).toEqual([["category", { ascending: true }]]);
  });

  it("propaga erro de leitura", async () => {
    queryResult = { data: null, error: { message: "permission denied" } };

    const result = await fetchCategoryBudgets("c1");

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("permission denied");
  });
});

describe("saveCategoryBudget", () => {
  it("faz upsert pela unicidade casal/categoria", async () => {
    const saved = makeBudget({ monthly_amount: 900 });
    queryResult = { data: saved, error: null };

    const result = await saveCategoryBudget("c1", {
      category: "Alimentação (mercado)",
      monthly_amount: 900,
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual(saved);

    const record = chainCalls[0];
    expect(record.table).toBe("category_budgets");
    expect(record.upsert).toEqual({
      values: {
        couple_id: "c1",
        category: "Alimentação (mercado)",
        monthly_amount: 900,
      },
      options: { onConflict: "couple_id,category" },
    });
  });

  it("propaga erro de escrita", async () => {
    queryResult = { data: null, error: { message: "new row violates policy" } };

    const result = await saveCategoryBudget("c1", {
      category: "Transporte",
      monthly_amount: 200,
    });

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("new row violates policy");
  });
});

describe("deleteCategoryBudget", () => {
  it("remove pelo id", async () => {
    queryResult = { data: null, error: null };

    const result = await deleteCategoryBudget("b1");

    expect(result.error).toBeUndefined();
    const record = chainCalls[0];
    expect(record.table).toBe("category_budgets");
    expect(record.isDelete).toBe(true);
    expect(record.eqs).toEqual([["id", "b1"]]);
  });

  it("propaga erro ao remover", async () => {
    queryResult = { data: null, error: { message: "permission denied" } };

    const result = await deleteCategoryBudget("b1");

    expect(result.error).toBe("permission denied");
  });
});
