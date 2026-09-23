import { describe, expect, it } from "@jest/globals";
import {
  resolveContributionAuthorLabel,
  resolveGoalProgressHint,
  resolveGoalProgressTone,
  resolveGoalStatusBadgeTone,
  resolveGoalStatusLabel,
  resolveGoalTargetDateLabel,
} from "../model";
import { formatCurrency } from "../../../utils/currency";
import type { GoalProgress } from "../../../domain/finance/goals";

function makeProgress(overrides: Partial<GoalProgress> = {}): GoalProgress {
  return {
    id: "g1",
    title: "Viagem",
    target: 1000,
    contributed: 250,
    remaining: 750,
    share: 0.25,
    percentage: 25,
    reached: false,
    ...overrides,
  };
}

describe("resolveGoalStatusLabel", () => {
  it("traduz o estado da meta", () => {
    expect(resolveGoalStatusLabel("active")).toBe("Ativa");
    expect(resolveGoalStatusLabel("completed")).toBe("Concluída");
    expect(resolveGoalStatusLabel("archived")).toBe("Arquivada");
  });
});

describe("resolveGoalStatusBadgeTone", () => {
  it("mapeia o estado para o tom do selo", () => {
    expect(resolveGoalStatusBadgeTone("active")).toBe("primary");
    expect(resolveGoalStatusBadgeTone("completed")).toBe("success");
    expect(resolveGoalStatusBadgeTone("archived")).toBe("neutral");
  });
});

describe("resolveGoalProgressTone", () => {
  it("usa success apenas quando a meta foi atingida", () => {
    expect(resolveGoalProgressTone(makeProgress())).toBe("primary");
    expect(resolveGoalProgressTone(makeProgress({ reached: true }))).toBe(
      "success",
    );
  });
});

describe("resolveGoalProgressHint", () => {
  it("mostra quanto falta", () => {
    expect(resolveGoalProgressHint(makeProgress())).toBe(
      `Faltam ${formatCurrency(750)}`,
    );
  });

  it("indica meta atingida exatamente", () => {
    expect(
      resolveGoalProgressHint(
        makeProgress({ contributed: 1000, remaining: 0, reached: true }),
      ),
    ).toBe("Meta atingida");
  });

  it("indica quanto passou do alvo", () => {
    expect(
      resolveGoalProgressHint(
        makeProgress({ contributed: 1100, remaining: 0, reached: true }),
      ),
    ).toBe(`Meta atingida, ${formatCurrency(100)} acima do alvo`);
  });
});

describe("resolveGoalTargetDateLabel", () => {
  it("formata a data alvo", () => {
    expect(resolveGoalTargetDateLabel("2026-12-31")).toBe("Alvo em 31/12/2026");
  });

  it("retorna nulo sem data", () => {
    expect(resolveGoalTargetDateLabel(null)).toBeNull();
    expect(resolveGoalTargetDateLabel("")).toBeNull();
  });
});

describe("resolveContributionAuthorLabel", () => {
  it("identifica você e o parceiro", () => {
    expect(resolveContributionAuthorLabel("u1", "u1", "Ana", "u2", "Bia")).toBe(
      "Ana",
    );
    expect(resolveContributionAuthorLabel("u2", "u1", "Ana", "u2", "Bia")).toBe(
      "Bia",
    );
  });

  it("usa rótulos neutros quando falta nome", () => {
    expect(resolveContributionAuthorLabel("u1", "u1", "", "u2", "Bia")).toBe(
      "Você",
    );
    expect(resolveContributionAuthorLabel("u2", "u1", "Ana", "u2", "")).toBe(
      "Seu parceiro",
    );
    expect(resolveContributionAuthorLabel("u9", "u1", "Ana", "u2", "Bia")).toBe(
      "Participante",
    );
  });
});
