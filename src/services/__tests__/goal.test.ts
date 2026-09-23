import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { FinancialGoal, GoalContribution } from "../../types/domain";
import {
  createFinancialGoal,
  createGoalContribution,
  fetchFinancialGoals,
  fetchGoalContributions,
  fetchGoalsOverview,
  setFinancialGoalStatus,
  updateFinancialGoal,
} from "../goal";

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
  in?: [string, unknown];
  insert?: unknown;
  update?: unknown;
  isSingle: boolean;
}

const fromMock = supabase.from as unknown as {
  mockReset: () => void;
  mockImplementation: (fn: (table: string) => unknown) => void;
};

let results: Record<string, QueryResult>;
let calls: MockRecord[];

function makeGoal(overrides: Partial<FinancialGoal> = {}): FinancialGoal {
  return {
    id: "g1",
    couple_id: "c1",
    title: "Viagem",
    target_amount: 1000,
    target_date: null,
    status: "active",
    created_by: "u1",
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

function makeContribution(
  overrides: Partial<GoalContribution> = {},
): GoalContribution {
  return {
    id: "k1",
    goal_id: "g1",
    user_id: "u1",
    amount: 100,
    contributed_at: "2026-09-02T12:00:00.000Z",
    note: null,
    ...overrides,
  };
}

beforeEach(() => {
  results = {};
  calls = [];
  fromMock.mockReset();

  fromMock.mockImplementation((table: string) => {
    const record: MockRecord = {
      table,
      eqs: [],
      orders: [],
      isSingle: false,
    };

    const resolve = (): Promise<QueryResult> =>
      Promise.resolve(results[table] ?? { data: null, error: null });

    const api = {
      select(columns?: string) {
        record.select = columns ?? "*";
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
      in(column: string, values: unknown) {
        record.in = [column, values];
        return api;
      },
      insert(values: unknown) {
        record.insert = values;
        return api;
      },
      update(values: unknown) {
        record.update = values;
        return api;
      },
      single() {
        record.isSingle = true;
        calls.push(record);
        return resolve();
      },
      then(
        onFulfilled: (value: QueryResult) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        calls.push(record);
        return resolve().then(onFulfilled, onRejected);
      },
    };

    return api;
  });
});

describe("fetchFinancialGoals", () => {
  it("lista as metas do casal por recência", async () => {
    const goals = [makeGoal()];
    results.financial_goals = { data: goals, error: null };

    const result = await fetchFinancialGoals("c1");

    expect(result.error).toBeNull();
    expect(result.data).toEqual(goals);

    const record = calls[0];
    expect(record.table).toBe("financial_goals");
    expect(record.select).toBe("*");
    expect(record.eqs).toEqual([["couple_id", "c1"]]);
    expect(record.orders).toEqual([["created_at", { ascending: false }]]);
  });

  it("propaga erro de leitura", async () => {
    results.financial_goals = { data: null, error: { message: "denied" } };

    const result = await fetchFinancialGoals("c1");

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("denied");
  });
});

describe("fetchGoalContributions", () => {
  it("lista as contribuições em ordem cronológica", async () => {
    const contributions = [makeContribution()];
    results.goal_contributions = { data: contributions, error: null };

    const result = await fetchGoalContributions("g1");

    expect(result.data).toEqual(contributions);

    const record = calls[0];
    expect(record.table).toBe("goal_contributions");
    expect(record.eqs).toEqual([["goal_id", "g1"]]);
    expect(record.orders).toEqual([["contributed_at", { ascending: true }]]);
  });
});

describe("fetchGoalsOverview", () => {
  it("combina metas e contribuições filtradas pelos ids das metas", async () => {
    const goals = [makeGoal({ id: "g1" }), makeGoal({ id: "g2" })];
    const contributions = [makeContribution({ goal_id: "g2" })];
    results.financial_goals = { data: goals, error: null };
    results.goal_contributions = { data: contributions, error: null };

    const result = await fetchGoalsOverview("c1");

    expect(result.error).toBeNull();
    expect(result.data?.goals).toEqual(goals);
    expect(result.data?.contributions).toEqual(contributions);

    const contributionCall = calls.find(
      (call) => call.table === "goal_contributions",
    );
    expect(contributionCall?.in).toEqual(["goal_id", ["g1", "g2"]]);
  });

  it("não consulta contribuições quando não há metas", async () => {
    results.financial_goals = { data: [], error: null };

    const result = await fetchGoalsOverview("c1");

    expect(result.data).toEqual({ goals: [], contributions: [] });
    expect(calls.some((call) => call.table === "goal_contributions")).toBe(
      false,
    );
  });

  it("propaga erro das metas", async () => {
    results.financial_goals = { data: null, error: { message: "denied" } };

    const result = await fetchGoalsOverview("c1");

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("denied");
  });
});

describe("createFinancialGoal", () => {
  it("insere sem enviar created_by (derivado no banco)", async () => {
    const created = makeGoal();
    results.financial_goals = { data: created, error: null };

    const result = await createFinancialGoal("c1", {
      title: "Viagem",
      target_amount: 1000,
      target_date: null,
    });

    expect(result.data).toEqual(created);

    const record = calls[0];
    expect(record.insert).toEqual({
      couple_id: "c1",
      title: "Viagem",
      target_amount: 1000,
      target_date: null,
    });
    expect(record.isSingle).toBe(true);
  });
});

describe("updateFinancialGoal", () => {
  it("atualiza os campos editáveis da meta", async () => {
    const updated = makeGoal({ title: "Reserva" });
    results.financial_goals = { data: updated, error: null };

    const result = await updateFinancialGoal("g1", {
      title: "Reserva",
      target_amount: 5000,
      target_date: "2027-01-01",
    });

    expect(result.data).toEqual(updated);

    const record = calls[0];
    expect(record.update).toEqual({
      title: "Reserva",
      target_amount: 5000,
      target_date: "2027-01-01",
    });
    expect(record.eqs).toEqual([["id", "g1"]]);
  });
});

describe("setFinancialGoalStatus", () => {
  it("muda apenas o status", async () => {
    const updated = makeGoal({ status: "archived" });
    results.financial_goals = { data: updated, error: null };

    const result = await setFinancialGoalStatus("g1", "archived");

    expect(result.data?.status).toBe("archived");
    expect(calls[0].update).toEqual({ status: "archived" });
  });
});

describe("createGoalContribution", () => {
  it("insere sem user_id e sem contributed_at quando a data é omitida", async () => {
    const created = makeContribution();
    results.goal_contributions = { data: created, error: null };

    const result = await createGoalContribution("g1", {
      amount: 100,
      note: "  ",
    });

    expect(result.data).toEqual(created);

    expect(calls[0].insert).toEqual({
      goal_id: "g1",
      amount: 100,
      note: null,
    });
  });

  it("inclui a data e normaliza a nota", async () => {
    results.goal_contributions = {
      data: makeContribution({ note: "parcela" }),
      error: null,
    };

    await createGoalContribution("g1", {
      amount: 250,
      note: "  parcela  ",
      contributed_at: "2026-09-10T12:00:00.000Z",
    });

    expect(calls[0].insert).toEqual({
      goal_id: "g1",
      amount: 250,
      note: "parcela",
      contributed_at: "2026-09-10T12:00:00.000Z",
    });
  });

  it("propaga erro de escrita", async () => {
    results.goal_contributions = {
      data: null,
      error: { message: "new row violates policy" },
    };

    const result = await createGoalContribution("g1", { amount: 100 });

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("new row violates policy");
  });
});
