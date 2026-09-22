import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { Couple } from "../../types/domain";
import { fetchIdealSplit, fetchPartner } from "../couple";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

interface QueryResult {
  data: unknown;
  error: unknown;
}

interface ChainCall {
  table: string;
  select: string;
  eq: [string, unknown];
}

let calls: ChainCall[];
let resultsByTable: Record<string, QueryResult>;

const fromMock = supabase.from as unknown as {
  mockReset: () => void;
  mockImplementation: (fn: (table: string) => unknown) => void;
};

function makeCouple(overrides: Partial<Couple> = {}): Couple {
  return {
    id: "c1",
    user_a: "u1",
    user_b: "u2",
    status: "active",
    split_ratio_a: 50,
    split_ratio_b: 50,
    monthly_budget: 0,
    shared_balance: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    linked_at: "2026-01-02T00:00:00.000Z",
    last_closed_month: null,
    ...overrides,
  } as Couple;
}

beforeEach(() => {
  calls = [];
  resultsByTable = {};

  fromMock.mockReset();
  fromMock.mockImplementation((table: string) => {
    let select = "";
    let eq: [string, unknown] = ["", ""];

    const maybeSingle = async () => {
      calls.push({ table, select, eq });
      return resultsByTable[table] ?? { data: null, error: null };
    };

    const eqBuilder = (column: string, value: unknown) => {
      eq = [column, value];
      return { maybeSingle };
    };

    const selectBuilder = (columns: string) => {
      select = columns;
      return { eq: eqBuilder };
    };

    return { select: selectBuilder };
  });
});

describe("fetchPartner", () => {
  it("lê o parceiro pela view limitada partner_profiles", async () => {
    resultsByTable["partner_profiles"] = {
      data: { id: "u2", full_name: "Bia", monthly_income: 3000 },
      error: null,
    };

    const result = await fetchPartner(makeCouple(), "u1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      id: "u2",
      full_name: "Bia",
      monthly_income: 3000,
    });
    expect(calls).toContainEqual({
      table: "partner_profiles",
      select: "id, full_name, monthly_income",
      eq: ["id", "u2"],
    });
  });
});

describe("fetchIdealSplit", () => {
  it("calcula a proporção quando o usuário é user_a", async () => {
    resultsByTable["couples"] = {
      data: { user_a: "u1", user_b: "u2" },
      error: null,
    };
    resultsByTable["partner_profiles"] = {
      data: { id: "u2", monthly_income: 3000 },
      error: null,
    };
    resultsByTable["profiles"] = {
      data: { id: "u1", monthly_income: 1000 },
      error: null,
    };

    const result = await fetchIdealSplit("c1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      ratio_a: 25,
      ratio_b: 75,
      calculated: true,
    });
  });

  it("inverte a proporção quando o usuário é user_b", async () => {
    resultsByTable["couples"] = {
      data: { user_a: "u2", user_b: "u1" },
      error: null,
    };
    resultsByTable["partner_profiles"] = {
      data: { id: "u2", monthly_income: 3000 },
      error: null,
    };
    resultsByTable["profiles"] = {
      data: { id: "u1", monthly_income: 1000 },
      error: null,
    };

    const result = await fetchIdealSplit("c1");

    expect(result.data).toEqual({
      ratio_a: 75,
      ratio_b: 25,
      calculated: true,
    });
  });

  it("devolve null quando não há parceiro visível", async () => {
    resultsByTable["couples"] = {
      data: { user_a: "u1", user_b: "u2" },
      error: null,
    };

    const result = await fetchIdealSplit("c1");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });
});
