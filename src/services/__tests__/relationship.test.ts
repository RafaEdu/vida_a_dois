import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import { fetchPartnersByCoupleIds } from "../relationship";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

interface QueryResult {
  data: unknown;
  error: unknown;
}

let calls: Record<string, unknown>[];
let result: QueryResult;

const fromMock = supabase.from as unknown as {
  mockReset: () => void;
  mockImplementation: (fn: (table: string) => unknown) => void;
};

beforeEach(() => {
  calls = [];
  result = { data: [], error: null };

  fromMock.mockReset();
  fromMock.mockImplementation((table: string) => {
    const record: Record<string, unknown> = { table };

    const resolve = (): Promise<QueryResult> => {
      calls.push(record);
      return Promise.resolve(result);
    };

    const api = {
      select(columns: string) {
        record.select = columns;
        return api;
      },
      in(column: string, values: unknown) {
        record.in = [column, values];
        return resolve();
      },
    };

    return api;
  });
});

describe("fetchPartnersByCoupleIds", () => {
  it("indexa os parceiros por couple_id", async () => {
    result = {
      data: [
        {
          couple_id: "c1",
          id: "u2",
          full_name: "Edu",
          monthly_income: null,
          avatar_path: null,
        },
        {
          couple_id: "c2",
          id: "u4",
          full_name: "Bia",
          monthly_income: 3000,
          avatar_path: "u4/a.png",
        },
      ],
      error: null,
    };

    const response = await fetchPartnersByCoupleIds(["c1", "c2"]);

    expect(response.error).toBeNull();
    expect(response.data).toEqual({
      c1: {
        id: "u2",
        full_name: "Edu",
        monthly_income: null,
        avatar_path: null,
      },
      c2: {
        id: "u4",
        full_name: "Bia",
        monthly_income: 3000,
        avatar_path: "u4/a.png",
      },
    });
    expect(calls).toContainEqual({
      table: "partner_profiles",
      select: "couple_id, id, full_name, monthly_income, avatar_path",
      in: ["couple_id", ["c1", "c2"]],
    });
  });

  it("não consulta quando não há vínculos", async () => {
    const response = await fetchPartnersByCoupleIds([]);

    expect(response.data).toEqual({});
    expect(calls).toHaveLength(0);
  });

  it("propaga erro de leitura", async () => {
    result = { data: null, error: { message: "permission denied" } };

    const response = await fetchPartnersByCoupleIds(["c1"]);

    expect(response.data).toBeNull();
    expect(response.error?.message).toBe("permission denied");
  });
});
