import { describe, expect, it } from "@jest/globals";
import type { CoupleActivity } from "../../../types/domain";
import { describeActivity } from "../model";

function makeActivity(overrides: Partial<CoupleActivity> = {}): CoupleActivity {
  return {
    id: "a1",
    couple_id: "c1",
    actor_id: "u1",
    event_type: "expense_paid",
    entity_type: "expense",
    entity_id: "e1",
    metadata: {},
    created_at: "2026-09-22T12:00:00.000Z",
    ...overrides,
  };
}

describe("describeActivity", () => {
  it("descreve despesa paga com valor", () => {
    const descriptor = describeActivity(
      makeActivity({ metadata: { description: "Mercado", amount: 129.9 } }),
    );

    expect(descriptor.title).toBe("Despesa paga");
    expect(descriptor.description).toContain("Mercado");
    expect(descriptor.description).toContain("129,90");
  });

  it("descreve mês fechado", () => {
    const descriptor = describeActivity(
      makeActivity({
        event_type: "month_closed",
        entity_type: "monthly_closing",
        metadata: { year_month: "2026-09" },
      }),
    );

    expect(descriptor.title).toBe("Mês fechado");
    expect(descriptor.description).toContain("Setembro");
  });

  it("descreve orçamento por categoria e orçamento global", () => {
    const category = describeActivity(
      makeActivity({
        event_type: "budget_changed",
        metadata: { category: "Transporte" },
      }),
    );
    expect(category.description).toContain("Transporte");

    const global = describeActivity(
      makeActivity({
        event_type: "budget_changed",
        metadata: { monthly_budget: 2000 },
      }),
    );
    expect(global.description).toContain("orçamento do casal");
  });

  it("descreve mudança de divisão", () => {
    const descriptor = describeActivity(
      makeActivity({
        event_type: "split_changed",
        metadata: { split_ratio_a: 60, split_ratio_b: 40 },
      }),
    );

    expect(descriptor.description).toContain("60% / 40%");
  });

  it("descreve meta concluída", () => {
    const descriptor = describeActivity(
      makeActivity({
        event_type: "goal_completed",
        entity_type: "financial_goal",
        metadata: { title: "Viagem" },
      }),
    );

    expect(descriptor.description).toContain("Viagem");
  });

  it("descreve recorrência encerrada", () => {
    const descriptor = describeActivity(
      makeActivity({
        event_type: "recurrence_ended",
        entity_type: "recurrence_series",
        metadata: { description: "Academia" },
      }),
    );

    expect(descriptor.description).toContain("Academia");
  });

  it("descreve vínculo encerrado", () => {
    const descriptor = describeActivity(
      makeActivity({
        event_type: "relationship_ended",
        entity_type: "couple",
      }),
    );

    expect(descriptor.title).toBe("Vínculo encerrado");
  });

  it("lida com metadata ausente sem quebrar", () => {
    const descriptor = describeActivity(
      makeActivity({ metadata: null as never }),
    );

    expect(descriptor.title).toBe("Despesa paga");
    expect(descriptor.description).toBe("Despesa");
  });
});
