import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { Couple } from "../../types/domain";
import {
  fetchCoupleById,
  fetchCurrentCouple,
  fetchIdealSplit,
  fetchPartner,
  fetchRelationshipHistory,
} from "../couple";

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

function makeCouple(overrides: Partial<Couple> = {}): Couple {
  return {
    id: "c1",
    user_a: "u1",
    user_b: "u2",
    status: "active",
    split_mode: "manual",
    split_ratio_a: 50,
    split_ratio_b: 50,
    monthly_budget: 0,
    shared_balance: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    linked_at: "2026-01-02T00:00:00.000Z",
    ended_at: null,
    ended_by: null,
    last_closed_month: null,
    ...overrides,
  } as Couple;
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
      or(filter: string) {
        record.or = filter;
        return api;
      },
      in(column: string, values: unknown[]) {
        record.in = [column, values];
        return api;
      },
      order(column: string, options?: unknown) {
        record.order = [column, options];
        return api;
      },
      limit(count: number) {
        record.limit = count;
        return api;
      },
      maybeSingle() {
        return resolve();
      },
      then(onFulfilled: (value: QueryResult) => unknown) {
        return resolve().then(onFulfilled);
      },
    };

    return api;
  });
});

describe("fetchCurrentCouple", () => {
  it("busca apenas vínculos abertos (pending/active), do mais recente", async () => {
    resultsByTable["couples"] = { data: makeCouple(), error: null };

    const result = await fetchCurrentCouple("u1");

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("c1");
    expect(calls).toContainEqual({
      table: "couples",
      select: "*",
      or: "user_a.eq.u1,user_b.eq.u1",
      in: ["status", ["pending", "active"]],
      order: ["created_at", { ascending: false }],
      limit: 1,
    });
  });

  it("devolve null quando o usuário só tem histórico encerrado", async () => {
    resultsByTable["couples"] = { data: null, error: null };

    const result = await fetchCurrentCouple("u1");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("fetchRelationshipHistory", () => {
  it("lista vínculos encerrados ordenados por ended_at", async () => {
    const ended = makeCouple({
      id: "c-old",
      status: "ended",
      ended_at: "2026-03-01T00:00:00.000Z",
      ended_by: "u1",
    });
    resultsByTable["couples"] = { data: [ended], error: null };

    const result = await fetchRelationshipHistory("u1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([ended]);
    expect(calls).toContainEqual({
      table: "couples",
      select: "*",
      or: "user_a.eq.u1,user_b.eq.u1",
      eq: [["status", "ended"]],
      order: ["ended_at", { ascending: false }],
    });
  });
});

describe("fetchCoupleById", () => {
  it("lê um vínculo encerrado por id (histórico somente leitura)", async () => {
    const ended = makeCouple({
      id: "c-old",
      status: "ended",
      ended_at: "2026-03-01T00:00:00.000Z",
      ended_by: "u1",
    });
    resultsByTable["couples"] = { data: ended, error: null };

    const result = await fetchCoupleById("c-old");

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("c-old");
    expect(result.data?.status).toBe("ended");
    expect(calls).toContainEqual({
      table: "couples",
      select: "*",
      eq: [["id", "c-old"]],
    });
  });

  it("devolve null quando o vínculo não existe ou não é acessível", async () => {
    resultsByTable["couples"] = { data: null, error: null };

    const result = await fetchCoupleById("missing");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("fetchPartner", () => {
  it("lê o parceiro pela view limitada partner_profiles", async () => {
    resultsByTable["partner_profiles"] = {
      data: {
        id: "u2",
        full_name: "Bia",
        monthly_income: 3000,
        avatar_path: "u2/avatar-1.png",
      },
      error: null,
    };

    const result = await fetchPartner(makeCouple(), "u1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      id: "u2",
      full_name: "Bia",
      monthly_income: 3000,
      avatar_path: "u2/avatar-1.png",
    });
    expect(calls).toContainEqual({
      table: "partner_profiles",
      select: "id, full_name, monthly_income, avatar_path",
      eq: [
        ["couple_id", "c1"],
        ["id", "u2"],
      ],
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
