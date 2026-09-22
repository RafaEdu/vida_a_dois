import { describe, expect, it } from "@jest/globals";
import type { Couple } from "../../../types/domain";
import {
  buildCoupleDisplayName,
  deriveCoupleLinkSummary,
  isEndRelationshipConfirmationValid,
} from "../model";

function couple(overrides: Partial<Couple> = {}): Couple {
  return {
    id: "couple-1",
    user_a: "user-a",
    user_b: "user-b",
    status: "active",
    linked_at: "2026-07-21T12:00:00.000Z",
    created_at: "2026-07-21T12:00:00.000Z",
    ended_at: null,
    ended_by: null,
    last_closed_month: null,
    monthly_budget: 0,
    shared_balance: 0,
    split_ratio_a: 50,
    split_ratio_b: 50,
    ...overrides,
  };
}

describe("deriveCoupleLinkSummary", () => {
  const now = new Date(2026, 8, 21, 12, 0, 0);

  it("marks an active couple as linked with elapsed time", () => {
    const summary = deriveCoupleLinkSummary(couple(), now);
    expect(summary.statusLabel).toBe("Vínculo ativo");
    expect(summary.statusTone).toBe("success");
    expect(summary.elapsedLabel).toBe("há 2 meses");
  });

  it("does not invent elapsed time when linked_at is missing", () => {
    const summary = deriveCoupleLinkSummary(couple({ linked_at: null }), now);
    expect(summary.statusTone).toBe("success");
    expect(summary.elapsedLabel).toBeNull();
  });

  it("marks a pending couple as pending", () => {
    const summary = deriveCoupleLinkSummary(couple({ status: "pending" }), now);
    expect(summary.statusLabel).toBe("Vínculo pendente");
    expect(summary.statusTone).toBe("warning");
    expect(summary.elapsedLabel).toBeNull();
  });

  it("handles a missing couple", () => {
    const summary = deriveCoupleLinkSummary(null, now);
    expect(summary.statusLabel).toBe("Sem vínculo");
    expect(summary.elapsedLabel).toBeNull();
  });
});

describe("buildCoupleDisplayName", () => {
  it("combina os primeiros nomes dos dois parceiros", () => {
    expect(buildCoupleDisplayName("Rafael Souza", "Eduardo Lima")).toBe(
      "Rafael & Eduardo",
    );
  });

  it("usa apenas o nome disponível", () => {
    expect(buildCoupleDisplayName("Rafael Souza", null)).toBe("Rafael");
    expect(buildCoupleDisplayName(null, "Eduardo Lima")).toBe("Eduardo");
  });

  it("usa um rótulo neutro quando não há nomes", () => {
    expect(buildCoupleDisplayName(null, null)).toBe("Nosso casal");
  });
});

describe("isEndRelationshipConfirmationValid", () => {
  it("exige o checkbox marcado e a frase exata", () => {
    expect(
      isEndRelationshipConfirmationValid({
        acknowledged: true,
        typedPhrase: "ENCERRAR VÍNCULO",
      }),
    ).toBe(true);
  });

  it("rejeita quando o checkbox não está marcado", () => {
    expect(
      isEndRelationshipConfirmationValid({
        acknowledged: false,
        typedPhrase: "ENCERRAR VÍNCULO",
      }),
    ).toBe(false);
  });

  it("rejeita frase diferente", () => {
    expect(
      isEndRelationshipConfirmationValid({
        acknowledged: true,
        typedPhrase: "encerrar",
      }),
    ).toBe(false);
  });

  it("tolera espaços nas bordas e diferença de caixa", () => {
    expect(
      isEndRelationshipConfirmationValid({
        acknowledged: true,
        typedPhrase: "  encerrar vínculo  ",
      }),
    ).toBe(true);
  });
});
