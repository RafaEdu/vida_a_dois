import { describe, expect, it } from "@jest/globals";
import {
  categoryBudgetShare,
  derivePlanningMonthStatus,
  resolveClosingAuthorLabel,
  resolveSettlementHeadline,
} from "../model";
import { formatCurrency } from "../../../utils/currency";

describe("derivePlanningMonthStatus", () => {
  it("marks the current month as active and closable", () => {
    expect(derivePlanningMonthStatus("2026-09", "2026-09", null)).toEqual({
      label: "Planejamento ativo",
      tone: "primary",
      isCurrentMonth: true,
      isClosed: false,
      canCloseMonth: true,
    });
  });

  it("marks a consolidated month as closed and not closable", () => {
    expect(derivePlanningMonthStatus("2026-09", "2026-09", "2026-09")).toEqual({
      label: "Mês encerrado",
      tone: "neutral",
      isCurrentMonth: true,
      isClosed: true,
      canCloseMonth: false,
    });
  });

  it("marks a past month as previous and not closable", () => {
    expect(derivePlanningMonthStatus("2026-08", "2026-09", "2026-09")).toEqual({
      label: "Mês anterior",
      tone: "neutral",
      isCurrentMonth: false,
      isClosed: false,
      canCloseMonth: false,
    });
  });

  it("keeps a past month open if it was never consolidated", () => {
    const status = derivePlanningMonthStatus("2026-08", "2026-09", null);
    expect(status.isClosed).toBe(false);
    expect(status.canCloseMonth).toBe(false);
  });
});

describe("categoryBudgetShare", () => {
  it("computes the share of the budget", () => {
    expect(categoryBudgetShare(250, 1000)).toBe(0.25);
  });

  it("returns zero when there is no budget", () => {
    expect(categoryBudgetShare(250, 0)).toBe(0);
    expect(categoryBudgetShare(250, -100)).toBe(0);
  });

  it("returns zero for invalid amounts", () => {
    expect(categoryBudgetShare(Number.NaN, 1000)).toBe(0);
  });

  it("allows values above one when the category exceeds the budget", () => {
    expect(categoryBudgetShare(1500, 1000)).toBe(1.5);
  });
});

describe("resolveSettlementHeadline", () => {
  it("descreve quando você adiantou", () => {
    const headline = resolveSettlementHeadline(
      { outcome: "self_advanced", amount: 80 },
      "Bia",
    );
    expect(headline.title).toBe(`Você adiantou ${formatCurrency(80)}`);
    expect(headline.description).toContain("Bia");
  });

  it("descreve quando o parceiro adiantou", () => {
    const headline = resolveSettlementHeadline(
      { outcome: "partner_advanced", amount: 42.5 },
      "Bia",
    );
    expect(headline.title).toBe(`Bia adiantou ${formatCurrency(42.5)}`);
  });

  it("descreve o equilíbrio", () => {
    expect(
      resolveSettlementHeadline({ outcome: "balanced", amount: 0 }, "Bia"),
    ).toEqual({
      title: "Tudo equilibrado",
      description: "Cada um pagou exatamente a sua parte no período.",
    });
  });

  it("usa um rótulo neutro quando não há nome do parceiro", () => {
    const headline = resolveSettlementHeadline(
      { outcome: "partner_advanced", amount: 10 },
      "",
    );
    expect(headline.title).toBe(`Seu parceiro adiantou ${formatCurrency(10)}`);
  });
});

describe("resolveClosingAuthorLabel", () => {
  it("names the current user when they closed the month", () => {
    expect(resolveClosingAuthorLabel("u1", "u1", "Ana", "u2", "Bia")).toBe(
      "Ana",
    );
  });

  it("names the partner when they closed the month", () => {
    expect(resolveClosingAuthorLabel("u2", "u1", "Ana", "u2", "Bia")).toBe(
      "Bia",
    );
  });

  it("falls back when there is no id or name", () => {
    expect(resolveClosingAuthorLabel(null, "u1", "Ana", "u2", "Bia")).toBe(
      "Não identificado",
    );
    expect(resolveClosingAuthorLabel("u1", "u1", "", "u2", "Bia")).toBe("Você");
    expect(resolveClosingAuthorLabel("u9", "u1", "Ana", "u2", "Bia")).toBe(
      "Não identificado",
    );
  });
});
