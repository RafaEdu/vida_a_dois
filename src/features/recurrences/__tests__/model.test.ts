import { describe, expect, it } from "@jest/globals";
import type { RecurrenceSeries } from "../../../types/domain";
import {
  formatRecurrenceFrequency,
  resolveNextOccurrenceLabel,
  resolveRecurrenceStatus,
  summarizeRecurrences,
} from "../model";

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

describe("resolveRecurrenceStatus", () => {
  it("marks an active series", () => {
    expect(resolveRecurrenceStatus({ active: true })).toEqual({
      active: true,
      label: "Ativa",
      tone: "success",
    });
  });

  it("marks a paused series", () => {
    expect(resolveRecurrenceStatus({ active: false })).toEqual({
      active: false,
      label: "Pausada",
      tone: "neutral",
    });
  });
});

describe("formatRecurrenceFrequency", () => {
  it("translates the monthly frequency", () => {
    expect(formatRecurrenceFrequency("monthly")).toBe("Mensal");
  });

  it("falls back to the raw value for unknown frequencies", () => {
    expect(formatRecurrenceFrequency("weekly")).toBe("weekly");
  });
});

describe("resolveNextOccurrenceLabel", () => {
  it("formats a valid occurrence date", () => {
    expect(resolveNextOccurrenceLabel("2026-10-05")).toBe(
      "Próxima em 05/10/2026",
    );
  });

  it("handles missing or invalid dates", () => {
    expect(resolveNextOccurrenceLabel(null)).toBe("Sem próxima data definida");
    expect(resolveNextOccurrenceLabel("")).toBe("Sem próxima data definida");
    expect(resolveNextOccurrenceLabel("2026-13-40")).toBe(
      "Sem próxima data definida",
    );
  });
});

describe("summarizeRecurrences", () => {
  it("counts active/paused and sums the active monthly amount", () => {
    const summary = summarizeRecurrences([
      makeSeries({ id: "s1", active: true, amount: 1500 }),
      makeSeries({ id: "s2", active: true, amount: 200 }),
      makeSeries({ id: "s3", active: false, amount: 80 }),
    ]);

    expect(summary).toEqual({
      activeCount: 2,
      pausedCount: 1,
      activeMonthlyAmount: 1700,
    });
  });

  it("returns a neutral summary for an empty list", () => {
    expect(summarizeRecurrences([])).toEqual({
      activeCount: 0,
      pausedCount: 0,
      activeMonthlyAmount: 0,
    });
  });
});
