import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { Couple, Expense, Income } from "../../types/database";
import {
  applyExpenseDelta,
  applyIncomeDelta,
  subscribeToCoupleChanges,
  subscribeToCoupleInvites,
  subscribeToFinance,
} from "../realtime";

jest.mock("../../lib/supabase", () => {
  const makeChannel = () => {
    const channel = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    channel.on.mockReturnValue(channel);
    channel.subscribe.mockReturnValue(channel);
    return channel;
  };
  return {
    supabase: {
      channel: jest.fn(() => makeChannel()),
      removeChannel: jest.fn(),
    },
  };
});

interface ChannelMock {
  on: { mock: { calls: unknown[][] } };
  subscribe: { mock: { calls: unknown[][] } };
}

function lastChannel(): ChannelMock {
  const channelMock = supabase.channel as unknown as {
    mock: { results: { value: unknown }[] };
  };
  const results = channelMock.mock.results;
  return results[results.length - 1].value as ChannelMock;
}

function findHandler(
  channel: ChannelMock,
  table: string,
  event: string,
): (payload: unknown) => void {
  const call = channel.on.mock.calls.find((entry) => {
    const config = entry[1] as { table?: string; event?: string };
    return config.table === table && config.event === event;
  });
  return call?.[2] as (payload: unknown) => void;
}

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
    paid: false,
    paid_at: null,
    is_recurring: false,
    recurrence_series_id: null,
    created_at: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: "i1",
    couple_id: "c1",
    user_id: "u1",
    description: "Salário",
    amount: 5000,
    is_extra: false,
    received_at: "2026-09-01T12:00:00.000Z",
    created_at: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  (supabase.channel as unknown as { mockClear: () => void }).mockClear();
  (supabase.removeChannel as unknown as { mockClear: () => void }).mockClear();
});

describe("applyExpenseDelta", () => {
  it("insere uma despesa mantendo a ordenação canônica", () => {
    const older = makeExpense({
      id: "e1",
      due_date: "2026-09-05",
      created_at: "2026-08-01T12:00:00.000Z",
    });
    const newer = makeExpense({
      id: "e2",
      due_date: "2026-10-05",
      created_at: "2026-09-01T12:00:00.000Z",
    });

    const next = applyExpenseDelta([older], {
      eventType: "INSERT",
      new: newer,
      old: { id: "e2" },
    });

    expect(next.map((item) => item.id)).toEqual(["e2", "e1"]);
  });

  it("reposiciona a despesa ao atualizar o vencimento", () => {
    const first = makeExpense({ id: "e1", due_date: "2026-10-05" });
    const second = makeExpense({ id: "e2", due_date: "2026-09-05" });
    const updated = makeExpense({ id: "e2", due_date: "2026-11-05" });

    const next = applyExpenseDelta([first, second], {
      eventType: "UPDATE",
      new: updated,
      old: { id: "e2" },
    });

    expect(next.map((item) => item.id)).toEqual(["e2", "e1"]);
  });

  it("atualiza sem duplicar", () => {
    const original = makeExpense();
    const updated = makeExpense({ description: "Aluguel pago", paid: true });
    const next = applyExpenseDelta([original], {
      eventType: "UPDATE",
      new: updated,
      old: { id: "e1" },
    });

    expect(next).toHaveLength(1);
    expect(next[0].description).toBe("Aluguel pago");
    expect(next[0].paid).toBe(true);
  });

  it("ignora evento duplicado mantendo um único item", () => {
    const expense = makeExpense();
    const once = applyExpenseDelta([], {
      eventType: "INSERT",
      new: expense,
      old: { id: expense.id },
    });
    const twice = applyExpenseDelta(once, {
      eventType: "INSERT",
      new: expense,
      old: { id: expense.id },
    });

    expect(twice).toHaveLength(1);
  });

  it("remove pelo id no delete", () => {
    const next = applyExpenseDelta([makeExpense()], {
      eventType: "DELETE",
      new: makeExpense(),
      old: { id: "e1" },
    });

    expect(next).toHaveLength(0);
  });
});

describe("applyIncomeDelta", () => {
  it("insere, atualiza e remove receitas", () => {
    const income = makeIncome();
    const inserted = applyIncomeDelta([], {
      eventType: "INSERT",
      new: income,
      old: { id: income.id },
    });
    expect(inserted).toHaveLength(1);

    const updated = applyIncomeDelta(inserted, {
      eventType: "UPDATE",
      new: { ...income, amount: 5500 },
      old: { id: income.id },
    });
    expect(updated).toHaveLength(1);
    expect(updated[0].amount).toBe(5500);

    const removed = applyIncomeDelta(updated, {
      eventType: "DELETE",
      new: income,
      old: { id: income.id },
    });
    expect(removed).toHaveLength(0);
  });
});

describe("subscribeToFinance", () => {
  it("assina despesas e receitas e devolve unsubscribe", () => {
    const onExpense = jest.fn();
    const onIncome = jest.fn();

    const unsubscribe = subscribeToFinance("c1", { onExpense, onIncome });
    const channel = lastChannel();

    expect(supabase.channel).toHaveBeenCalledWith("finance-c1");
    expect(channel.on).toHaveBeenCalledTimes(6);
    expect(channel.subscribe).toHaveBeenCalledTimes(1);

    findHandler(
      channel,
      "expenses",
      "INSERT",
    )({
      eventType: "INSERT",
      new: makeExpense(),
      old: { id: "e1" },
    });
    findHandler(
      channel,
      "incomes",
      "UPDATE",
    )({
      eventType: "UPDATE",
      new: makeIncome(),
      old: { id: "i1" },
    });

    expect(onExpense).toHaveBeenCalledTimes(1);
    expect(onIncome).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});

describe("subscribeToCoupleChanges", () => {
  it("assina update do casal e aplica o payload", () => {
    const onUpdate = jest.fn<(couple: Couple) => void>();

    const unsubscribe = subscribeToCoupleChanges("c1", onUpdate);
    const channel = lastChannel();
    const updated = { id: "c1", status: "active" } as Couple;

    findHandler(channel, "couples", "UPDATE")({ new: updated });
    expect(onUpdate).toHaveBeenCalledWith(updated);

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});

describe("subscribeToCoupleInvites", () => {
  it("assina inserts e deletes do casal do usuário", () => {
    const onInsert = jest.fn();
    const onDelete = jest.fn();

    const unsubscribe = subscribeToCoupleInvites("u1", {
      onInsert,
      onDelete,
    });
    const channel = lastChannel();

    expect(supabase.channel).toHaveBeenCalledWith("couples-insert-u1");
    expect(channel.on).toHaveBeenCalledTimes(4);

    findHandler(channel, "couples", "INSERT")({});
    findHandler(channel, "couples", "DELETE")({});

    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
