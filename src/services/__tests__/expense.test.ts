import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { Expense } from "../../types/domain";
import { createExpense, markExpensePaid, updateExpense } from "../expense";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

interface RpcResult {
  data: unknown;
  error: unknown;
}

interface RpcMock {
  mockReset: () => void;
  mockResolvedValue: (value: RpcResult) => void;
  mock: { calls: unknown[][] };
}

const rpcMock = supabase.rpc as unknown as RpcMock;

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    couple_id: "c1",
    created_by: "u1",
    paid_by: "u1",
    description: "Aluguel",
    amount: 1500,
    category: "Aluguel / Financiamento",
    due_date: "2026-09-05",
    paid: true,
    paid_at: "2026-09-05T12:00:00.000Z",
    is_recurring: true,
    recurrence_series_id: "s1",
    created_at: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("markExpensePaid", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("chama a RPC mark_expense_paid com o id da despesa", async () => {
    rpcMock.mockResolvedValue({
      data: { status: "paid", expense: makeExpense(), next_expense: null },
      error: null,
    });

    await markExpensePaid("e1");

    expect(rpcMock.mock.calls[0]).toEqual([
      "mark_expense_paid",
      { p_expense_id: "e1" },
    ]);
  });

  it("retorna a despesa atualizada e a próxima ocorrência", async () => {
    const next = makeExpense({
      id: "e2",
      due_date: "2026-10-05",
      paid: false,
      paid_at: null,
    });
    rpcMock.mockResolvedValue({
      data: { status: "paid", expense: makeExpense(), next_expense: next },
      error: null,
    });

    const { error, result } = await markExpensePaid("e1");

    expect(error).toBeUndefined();
    expect(result?.status).toBe("paid");
    expect(result?.expense.id).toBe("e1");
    expect(result?.nextExpense?.id).toBe("e2");
  });

  it("trata pagamento já confirmado como idempotente", async () => {
    rpcMock.mockResolvedValue({
      data: {
        status: "already_paid",
        expense: makeExpense(),
        next_expense: null,
      },
      error: null,
    });

    const { error, result } = await markExpensePaid("e1");

    expect(error).toBeUndefined();
    expect(result?.status).toBe("already_paid");
    expect(result?.nextExpense).toBeNull();
  });

  it("devolve a mensagem de domínio da RPC", async () => {
    rpcMock.mockResolvedValue({
      data: { error: "Despesa nao encontrada." },
      error: null,
    });

    const { error, result } = await markExpensePaid("e1");

    expect(result).toBeUndefined();
    expect(error).toBe("Despesa nao encontrada.");
  });

  it("classifica erro técnico da RPC", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const { error } = await markExpensePaid("e1");

    expect(error).toBe("permission denied");
  });

  it("rejeita resposta sem despesa", async () => {
    rpcMock.mockResolvedValue({
      data: { status: "paid" },
      error: null,
    });

    const { error, result } = await markExpensePaid("e1");

    expect(result).toBeUndefined();
    expect(error).toBe("Resposta inválida ao confirmar o pagamento.");
  });
});

interface FromChain {
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  select: jest.Mock;
  single: jest.Mock;
}

function mockFromMutation(result: {
  data: unknown;
  error: unknown;
}): FromChain {
  const single = jest.fn(async () => result);
  const select = jest.fn(() => ({ single }));
  const eq = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));
  const insert = jest.fn(() => ({ select }));

  const fromMock = supabase.from as unknown as {
    mockImplementation: (fn: () => unknown) => void;
  };
  fromMock.mockImplementation(() => ({ insert, update }));

  return { insert, update, eq, select, single };
}

describe("createExpense", () => {
  it("devolve a despesa criada pelo banco", async () => {
    const created = makeExpense({ id: "e9" });
    const chain = mockFromMutation({ data: created, error: null });

    const result = await createExpense("c1", "u1", {
      description: "Aluguel",
      amount: 1500,
      category: "Aluguel / Financiamento",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("e9");
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ couple_id: "c1", created_by: "u1" }),
    );
  });

  it("classifica erro ao criar", async () => {
    mockFromMutation({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const result = await createExpense("c1", "u1", {
      description: "Aluguel",
      amount: 1500,
      category: "Aluguel / Financiamento",
    });

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("permission denied");
  });
});

describe("updateExpense", () => {
  it("devolve a despesa atualizada pelo banco", async () => {
    const updated = makeExpense({ id: "e9", paid: true });
    const chain = mockFromMutation({ data: updated, error: null });

    const result = await updateExpense("e9", { paid: true });

    expect(result.error).toBeNull();
    expect(result.data?.paid).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({ paid: true });
    expect(chain.eq).toHaveBeenCalledWith("id", "e9");
  });
});
