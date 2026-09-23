import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { CoupleActivity } from "../../types/domain";
import { ACTIVITY_PAGE_SIZE, fetchCoupleActivity } from "../activity";

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
  limit?: number;
}

const fromMock = supabase.from as unknown as {
  mockReset: () => void;
  mockImplementation: (fn: (table: string) => unknown) => void;
};

let queryResult: QueryResult;
let chainCalls: MockRecord[];

function makeActivity(overrides: Partial<CoupleActivity> = {}): CoupleActivity {
  return {
    id: "a1",
    couple_id: "c1",
    actor_id: "u1",
    event_type: "expense_paid",
    entity_type: "expense",
    entity_id: "e1",
    metadata: { description: "Mercado", amount: 120 },
    created_at: "2026-09-22T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  queryResult = { data: null, error: null };
  chainCalls = [];
  fromMock.mockReset();

  fromMock.mockImplementation((table: string) => {
    const record: MockRecord = { table, eqs: [], orders: [] };

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
      limit(value: number) {
        record.limit = value;
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

describe("fetchCoupleActivity", () => {
  it("lista o feed do casal do mais recente ao mais antigo", async () => {
    const activity = [makeActivity()];
    queryResult = { data: activity, error: null };

    const result = await fetchCoupleActivity("c1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual(activity);

    const record = chainCalls[0];
    expect(record.table).toBe("couple_activity");
    expect(record.select).toBe("*");
    expect(record.eqs).toEqual([["couple_id", "c1"]]);
    expect(record.orders).toEqual([["created_at", { ascending: false }]]);
    expect(record.limit).toBe(ACTIVITY_PAGE_SIZE);
  });

  it("aceita um limite customizado", async () => {
    queryResult = { data: [], error: null };

    await fetchCoupleActivity("c1", 10);

    expect(chainCalls[0].limit).toBe(10);
  });

  it("propaga erro de leitura", async () => {
    queryResult = { data: null, error: { message: "permission denied" } };

    const result = await fetchCoupleActivity("c1");

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("permission denied");
  });
});
