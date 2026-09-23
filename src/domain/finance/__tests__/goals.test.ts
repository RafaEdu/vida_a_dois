import { describe, expect, it } from "@jest/globals";
import type { FinancialGoal, GoalContribution } from "../../../types/domain";
import {
  calculateGoalProgress,
  calculateGoalProgresses,
  groupContributionsByGoal,
  isGoalStatus,
  sortGoalsForDisplay,
  sumGoalContributions,
  summarizeGoals,
} from "../goals";

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

describe("sumGoalContributions", () => {
  it("soma os valores das contribuições", () => {
    expect(sumGoalContributions([{ amount: 100 }, { amount: 250.5 }])).toBe(
      350.5,
    );
  });

  it("ignora valores inválidos e lista vazia", () => {
    expect(sumGoalContributions([])).toBe(0);
    expect(
      sumGoalContributions([{ amount: 100 }, { amount: Number.NaN }]),
    ).toBe(100);
  });
});

describe("calculateGoalProgress", () => {
  it("calcula progresso parcial", () => {
    const progress = calculateGoalProgress(makeGoal(), [
      { amount: 250 },
      { amount: 100 },
    ]);

    expect(progress.contributed).toBe(350);
    expect(progress.target).toBe(1000);
    expect(progress.remaining).toBe(650);
    expect(progress.share).toBeCloseTo(0.35);
    expect(progress.percentage).toBe(35);
    expect(progress.reached).toBe(false);
  });

  it("marca como atingida quando o valor bate o alvo", () => {
    const progress = calculateGoalProgress(makeGoal({ target_amount: 500 }), [
      { amount: 500 },
    ]);

    expect(progress.reached).toBe(true);
    expect(progress.remaining).toBe(0);
    expect(progress.percentage).toBe(100);
  });

  it("tolera diferença de centavo no alvo", () => {
    const progress = calculateGoalProgress(
      makeGoal({ target_amount: 999.99 }),
      [{ amount: 1000 }],
    );

    expect(progress.reached).toBe(true);
  });

  it("permite ultrapassar o alvo sem remaining negativo", () => {
    const progress = calculateGoalProgress(makeGoal({ target_amount: 100 }), [
      { amount: 150 },
    ]);

    expect(progress.reached).toBe(true);
    expect(progress.remaining).toBe(0);
    expect(progress.percentage).toBe(150);
  });

  it("retorna 0% quando o alvo não é positivo", () => {
    const progress = calculateGoalProgress(makeGoal({ target_amount: 0 }), [
      { amount: 50 },
    ]);

    expect(progress.share).toBe(0);
    expect(progress.percentage).toBe(0);
    expect(progress.reached).toBe(false);
  });

  it("meta sem contribuições fica em 0%", () => {
    const progress = calculateGoalProgress(makeGoal(), []);

    expect(progress.contributed).toBe(0);
    expect(progress.remaining).toBe(1000);
    expect(progress.reached).toBe(false);
  });
});

describe("groupContributionsByGoal", () => {
  it("agrupa por goal_id", () => {
    const grouped = groupContributionsByGoal([
      makeContribution({ id: "k1", goal_id: "g1" }),
      makeContribution({ id: "k2", goal_id: "g2" }),
      makeContribution({ id: "k3", goal_id: "g1" }),
    ]);

    expect(grouped.get("g1")).toHaveLength(2);
    expect(grouped.get("g2")).toHaveLength(1);
  });
});

describe("calculateGoalProgresses", () => {
  it("combina metas e contribuições preservando a ordem", () => {
    const progresses = calculateGoalProgresses(
      [makeGoal({ id: "g1" }), makeGoal({ id: "g2", title: "Reserva" })],
      [
        makeContribution({ goal_id: "g2", amount: 200 }),
        makeContribution({ goal_id: "g1", amount: 50 }),
      ],
    );

    expect(progresses.map((progress) => progress.id)).toEqual(["g1", "g2"]);
    expect(progresses[0].contributed).toBe(50);
    expect(progresses[1].contributed).toBe(200);
  });

  it("metas sem contribuição ficam com zero", () => {
    const [progress] = calculateGoalProgresses([makeGoal()], []);
    expect(progress.contributed).toBe(0);
  });
});

describe("isGoalStatus", () => {
  it("aceita apenas os estados conhecidos", () => {
    expect(isGoalStatus("active")).toBe(true);
    expect(isGoalStatus("completed")).toBe(true);
    expect(isGoalStatus("archived")).toBe(true);
    expect(isGoalStatus("ended")).toBe(false);
  });
});

describe("sortGoalsForDisplay", () => {
  it("coloca ativas antes de concluídas e arquivadas", () => {
    const sorted = sortGoalsForDisplay([
      makeGoal({ id: "g3", status: "archived" }),
      makeGoal({ id: "g1", status: "active" }),
      makeGoal({ id: "g2", status: "completed" }),
    ]);

    expect(sorted.map((goal) => goal.id)).toEqual(["g1", "g2", "g3"]);
  });
});

describe("summarizeGoals", () => {
  it("conta por estado", () => {
    expect(
      summarizeGoals([
        makeGoal({ status: "active" }),
        makeGoal({ status: "active" }),
        makeGoal({ status: "completed" }),
        makeGoal({ status: "archived" }),
      ]),
    ).toEqual({ total: 4, active: 2, completed: 1, archived: 1 });
  });
});
