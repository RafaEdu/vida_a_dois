import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { RecurrenceSeries } from "../../types/domain";
import {
  endRecurrenceSeries,
  fetchRecurrenceSeries,
  setRecurrenceSeriesActive,
  updateRecurrenceSeries,
} from "../recurrence";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

interface QueryResult {
  data: unknown;
  error: unknown;
}

interface RpcMock {
  mockReset: () => void;
  mockResolvedValue: (value: { data: unknown; error: unknown }) => void;
  mock: { calls: unknown[][] };
}

const rpcMock = supabase.rpc as unknown as RpcMock;

const fromMock = supabase.from as unknown as {
  mockReset: () => void;
  mockImplementation: (fn: (table: string) => unknown) => void;
  mock: { calls: unknown[][] };
};

let queryResult: QueryResult;
let chainCalls: Array<{ table: string; orders: unknown[] }>;

function makeSeries(
  overrides: Partial<RecurrenceSeries> = {},
): RecurrenceSeries {
  return {
    id: "s1",
    couple_id: "c1",
    description: "Aluguel",
    category: "Aluguel / Financiamento",
    amount: 1500,
    frequency: "monthly",
    active: true,
    next_due_date: "2026-10-05",
    created_by: "u1",
    created_at: "2026-08-01T12:00:00.000Z",
    updated_at: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  queryResult = { data: null, error: null };
  chainCalls = [];
  rpcMock.mockReset();
  fromMock.mockReset();

  fromMock.mockImplementation((table: string) => {
    const record = { table, orders: [] as unknown[] };

    const resolve = (): Promise<QueryResult> => Promise.resolve(queryResult);

    const api = {
      select(columns: string) {
        (record as { select?: string }).select = columns;
        return api;
      },
      eq(column: string, value: unknown) {
        const current = (record as { eq?: [string, unknown][] }).eq ?? [];
        (record as { eq?: [string, unknown][] }).eq = [
          ...current,
          [column, value],
        ];
        return api;
      },
      order(column: string, options?: unknown) {
        record.orders.push([column, options]);
        return api;
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

describe("fetchRecurrenceSeries", () => {
  it("lista as séries do casal com prioridade para ativas", async () => {
    const series = [
      makeSeries({ id: "s1", active: true }),
      makeSeries({ id: "s2", active: false }),
    ];
    queryResult = { data: series, error: null };

    const result = await fetchRecurrenceSeries("c1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual(series);

    const record = chainCalls[0];
    expect(record.table).toBe("expense_recurrence_series");
    expect(record.orders).toEqual([
      ["active", { ascending: false }],
      ["next_due_date", { ascending: true, nullsFirst: false }],
      ["created_at", { ascending: true }],
    ]);
  });

  it("propaga erro de leitura", async () => {
    queryResult = { data: null, error: { message: "permission denied" } };

    const result = await fetchRecurrenceSeries("c1");

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("permission denied");
  });
});

describe("updateRecurrenceSeries", () => {
  it("chama a RPC com o template e devolve a série atualizada", async () => {
    const updated = makeSeries({ description: "Aluguel novo", amount: 1600 });
    rpcMock.mockResolvedValue({
      data: { status: "updated", series: updated, updated_occurrences: 1 },
      error: null,
    });

    const result = await updateRecurrenceSeries("s1", {
      description: "Aluguel novo",
      category: "Aluguel / Financiamento",
      amount: 1600,
    });

    expect(rpcMock.mock.calls[0]).toEqual([
      "update_recurrence_series",
      {
        p_series_id: "s1",
        p_description: "Aluguel novo",
        p_category: "Aluguel / Financiamento",
        p_amount: 1600,
      },
    ]);
    expect(result.error).toBeUndefined();
    expect(result.series).toEqual(updated);
  });

  it("devolve a mensagem de domínio da RPC", async () => {
    rpcMock.mockResolvedValue({
      data: { error: "Recorrencia nao encontrada." },
      error: null,
    });

    const result = await updateRecurrenceSeries("s1", {
      description: "Aluguel",
      category: "Aluguel / Financiamento",
      amount: 1500,
    });

    expect(result.series).toBeUndefined();
    expect(result.error).toBe("Recorrencia nao encontrada.");
  });

  it("rejeita resposta sem série", async () => {
    rpcMock.mockResolvedValue({
      data: { status: "updated" },
      error: null,
    });

    const result = await updateRecurrenceSeries("s1", {
      description: "Aluguel",
      category: "Aluguel / Financiamento",
      amount: 1500,
    });

    expect(result.error).toBe("Resposta inválida ao salvar a recorrência.");
  });
});

describe("setRecurrenceSeriesActive", () => {
  it("pausa a recorrência", async () => {
    const paused = makeSeries({ active: false });
    rpcMock.mockResolvedValue({
      data: { status: "paused", series: paused },
      error: null,
    });

    const result = await setRecurrenceSeriesActive("s1", false);

    expect(rpcMock.mock.calls[0]).toEqual([
      "set_recurrence_series_active",
      { p_series_id: "s1", p_active: false },
    ]);
    expect(result.series?.active).toBe(false);
  });

  it("classifica erro técnico da RPC", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const result = await setRecurrenceSeriesActive("s1", true);

    expect(result.series).toBeUndefined();
    expect(result.error).toBe("permission denied");
  });
});

describe("endRecurrenceSeries", () => {
  it("devolve quantas ocorrências futuras foram canceladas", async () => {
    rpcMock.mockResolvedValue({
      data: {
        status: "ended",
        series: makeSeries({ active: false }),
        cancelled_occurrences: 3,
      },
      error: null,
    });

    const result = await endRecurrenceSeries("s1");

    expect(rpcMock.mock.calls[0]).toEqual([
      "end_recurrence_series",
      { p_series_id: "s1" },
    ]);
    expect(result.error).toBeUndefined();
    expect(result.cancelledOccurrences).toBe(3);
  });

  it("devolve a mensagem de domínio ao falhar", async () => {
    rpcMock.mockResolvedValue({
      data: { error: "Sem permissao para esta recorrencia." },
      error: null,
    });

    const result = await endRecurrenceSeries("s1");

    expect(result.error).toBe("Sem permissao para esta recorrencia.");
  });
});
