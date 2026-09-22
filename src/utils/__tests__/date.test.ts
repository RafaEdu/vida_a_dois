import { describe, expect, it } from "@jest/globals";
import {
  formatBirthDateInput,
  formatDateFromTimestamp,
  formatDateGroupLabel,
  formatDateInput,
  formatDateOnlyForDisplay,
  formatElapsedSince,
  formatYearMonthLong,
  getCurrentYearMonth,
  getYearMonthFromDateOnly,
  getYearMonthFromTimestamp,
  isValidDateOnly,
  parseBirthDateToISO,
  shiftYearMonth,
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

describe("formatYearMonthLong", () => {
  it("formata o período em português", () => {
    expect(formatYearMonthLong("2025-10")).toBe("Outubro de 2025");
    expect(formatYearMonthLong("2024-01")).toBe("Janeiro de 2024");
  });

  it("retorna vazio para período inválido", () => {
    expect(formatYearMonthLong("2025-13")).toBe("");
    expect(formatYearMonthLong("")).toBe("");
  });
});

describe("shiftYearMonth", () => {
  it("avança e recua meses", () => {
    expect(shiftYearMonth("2025-10", 1)).toBe("2025-11");
    expect(shiftYearMonth("2025-10", -1)).toBe("2025-09");
  });

  it("atravessa a virada de ano", () => {
    expect(shiftYearMonth("2025-12", 1)).toBe("2026-01");
    expect(shiftYearMonth("2025-01", -1)).toBe("2024-12");
  });

  it("retorna o próprio valor para entrada inválida", () => {
    expect(shiftYearMonth("inválido", 1)).toBe("inválido");
  });
});

describe("formatDateFromTimestamp", () => {
  it("formata um timestamp em DD/MM/AAAA no fuso local", () => {
    const timestamp = new Date(2026, 8, 15, 12).toISOString();
    expect(formatDateFromTimestamp(timestamp)).toBe("15/09/2026");
  });

  it("retorna vazio para valores ausentes ou inválidos", () => {
    expect(formatDateFromTimestamp(null)).toBe("");
    expect(formatDateFromTimestamp("inválido")).toBe("");
  });
});

describe("formatElapsedSince", () => {
  const now = new Date(2026, 8, 21, 12, 0, 0);

  it("rotula recém-criado como agora", () => {
    expect(formatElapsedSince(now.toISOString(), now)).toBe("agora");
    expect(
      formatElapsedSince(new Date(2026, 8, 21, 11, 55).toISOString(), now),
    ).toBe("há poucos minutos");
  });

  it("rotula horas e dias", () => {
    expect(
      formatElapsedSince(new Date(2026, 8, 21, 9).toISOString(), now),
    ).toBe("há 3 horas");
    expect(
      formatElapsedSince(new Date(2026, 8, 18, 12).toISOString(), now),
    ).toBe("há 3 dias");
  });

  it("rotula meses e anos", () => {
    expect(
      formatElapsedSince(new Date(2026, 6, 21, 12).toISOString(), now),
    ).toBe("há 2 meses");
    expect(
      formatElapsedSince(new Date(2026, 5, 21, 12).toISOString(), now),
    ).toBe("há 3 meses");
    expect(
      formatElapsedSince(new Date(2025, 5, 21, 12).toISOString(), now),
    ).toBe("há 1 ano e 3 meses");
  });

  it("retorna null para valor ausente ou inválido", () => {
    expect(formatElapsedSince(null, now)).toBeNull();
    expect(formatElapsedSince("inválido", now)).toBeNull();
  });
});

describe("formatDateGroupLabel", () => {
  const today = new Date(2026, 8, 21);

  it("rotula hoje e ontem", () => {
    expect(formatDateGroupLabel("2026-09-21", today)).toBe("Hoje");
    expect(formatDateGroupLabel("2026-09-20", today)).toBe("Ontem");
  });

  it("usa a data canônica para datas anteriores", () => {
    expect(formatDateGroupLabel("2026-09-19", today)).toBe("19/09/2026");
  });

  it("rotula valores ausentes ou inválidos como Sem data", () => {
    expect(formatDateGroupLabel("", today)).toBe("Sem data");
    expect(formatDateGroupLabel("inválido", today)).toBe("Sem data");
  });
});
