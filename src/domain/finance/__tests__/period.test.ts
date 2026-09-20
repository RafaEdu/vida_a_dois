import { describe, expect, it } from "@jest/globals";
import {
  getExpenseYearMonth,
  getIncomeYearMonth,
  isExpenseInYearMonth,
  isIncomeInYearMonth,
} from "../period";

const augustTimestamp = new Date(2026, 7, 10, 12).toISOString();
const septemberTimestamp = new Date(2026, 8, 10, 12).toISOString();

describe("getExpenseYearMonth", () => {
  it("usa o mês de due_date quando existe", () => {
    expect(
      getExpenseYearMonth({
        due_date: "2026-09-15",
        created_at: augustTimestamp,
      }),
    ).toBe("2026-09");
  });

  it("usa o mês de created_at quando não há due_date", () => {
    expect(
      getExpenseYearMonth({
        due_date: null,
        created_at: augustTimestamp,
      }),
    ).toBe("2026-08");
  });

  it("não desloca date-only em UTC-3", () => {
    expect(
      getExpenseYearMonth({
        due_date: "2026-01-01",
        created_at: augustTimestamp,
      }),
    ).toBe("2026-01");
  });
});

describe("isExpenseInYearMonth", () => {
  it("inclui despesa com due_date no mês correto", () => {
    expect(
      isExpenseInYearMonth(
        { due_date: "2026-09-15", created_at: augustTimestamp },
        "2026-09",
      ),
    ).toBe(true);
    expect(
      isExpenseInYearMonth(
        { due_date: "2026-09-15", created_at: augustTimestamp },
        "2026-08",
      ),
    ).toBe(false);
  });

  it("usa created_at para despesa sem vencimento", () => {
    expect(
      isExpenseInYearMonth(
        { due_date: null, created_at: augustTimestamp },
        "2026-08",
      ),
    ).toBe(true);
  });
});

describe("getIncomeYearMonth", () => {
  it("usa o mês de received_at", () => {
    expect(getIncomeYearMonth({ received_at: septemberTimestamp })).toBe(
      "2026-09",
    );
  });
});

describe("isIncomeInYearMonth", () => {
  it("filtra receitas pelo mês de recebimento", () => {
    expect(
      isIncomeInYearMonth({ received_at: septemberTimestamp }, "2026-09"),
    ).toBe(true);
    expect(
      isIncomeInYearMonth({ received_at: septemberTimestamp }, "2026-08"),
    ).toBe(false);
  });
});
