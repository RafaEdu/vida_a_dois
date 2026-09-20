import { describe, expect, it } from "@jest/globals";
import {
  formatBirthDateInput,
  formatDateInput,
  formatDateOnlyForDisplay,
  getCurrentYearMonth,
  getYearMonthFromDateOnly,
  getYearMonthFromTimestamp,
  isValidDateOnly,
  parseBirthDateToISO,
} from "../date";

describe("isValidDateOnly", () => {
  it("aceita datas válidas", () => {
    expect(isValidDateOnly("2026-09-01")).toBe(true);
    expect(isValidDateOnly("2024-02-29")).toBe(true);
  });

  it("rejeita dias inexistentes", () => {
    expect(isValidDateOnly("2026-02-30")).toBe(false);
    expect(isValidDateOnly("2023-02-29")).toBe(false);
  });

  it("rejeita mês inválido e formatos inválidos", () => {
    expect(isValidDateOnly("2026-13-01")).toBe(false);
    expect(isValidDateOnly("01/09/2026")).toBe(false);
    expect(isValidDateOnly("")).toBe(false);
  });
});

describe("formatDateOnlyForDisplay", () => {
  it("converte date-only para DD/MM/AAAA", () => {
    expect(formatDateOnlyForDisplay("2026-09-01")).toBe("01/09/2026");
  });

  it("não desloca o dia em UTC-3", () => {
    expect(formatDateOnlyForDisplay("2026-01-01")).toBe("01/01/2026");
  });

  it("retorna vazio para ausência de data", () => {
    expect(formatDateOnlyForDisplay(null)).toBe("");
    expect(formatDateOnlyForDisplay("")).toBe("");
  });
});

describe("formatDateInput", () => {
  it("mascara dígitos em AAAA-MM-DD", () => {
    expect(formatDateInput("20260901")).toBe("2026-09-01");
    expect(formatDateInput("2026")).toBe("2026");
  });
});

describe("formatBirthDateInput", () => {
  it("mascara dígitos em DD/MM/AAAA", () => {
    expect(formatBirthDateInput("10051990")).toBe("10/05/1990");
  });
});

describe("parseBirthDateToISO", () => {
  it("converte DD/MM/AAAA para AAAA-MM-DD", () => {
    expect(parseBirthDateToISO("10/05/1990")).toBe("1990-05-10");
  });

  it("rejeita data de calendário inválida", () => {
    expect(parseBirthDateToISO("31/02/1990")).toBeNull();
  });

  it("rejeita formato inválido", () => {
    expect(parseBirthDateToISO("1990-05-10")).toBeNull();
  });
});

describe("getYearMonthFromDateOnly", () => {
  it("extrai o período YYYY-MM sem depender de timezone", () => {
    expect(getYearMonthFromDateOnly("2026-09-01")).toBe("2026-09");
    expect(getYearMonthFromDateOnly("2026-01-01")).toBe("2026-01");
  });
});

describe("getYearMonthFromTimestamp", () => {
  it("extrai o período de um timestamp", () => {
    const timestamp = new Date(2026, 8, 15, 12).toISOString();
    expect(getYearMonthFromTimestamp(timestamp)).toBe("2026-09");
  });

  it("retorna vazio para timestamp inválido", () => {
    expect(getYearMonthFromTimestamp("inválido")).toBe("");
  });
});

describe("getCurrentYearMonth", () => {
  it("retorna o período atual no formato YYYY-MM", () => {
    expect(getCurrentYearMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});
