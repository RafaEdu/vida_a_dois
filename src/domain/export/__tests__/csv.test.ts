import { describe, expect, it } from "@jest/globals";
import {
  CSV_DELIMITER,
  CSV_NEWLINE,
  CSV_UTF8_BOM,
  escapeCsvCell,
  formatCsvBoolean,
  formatCsvDateOnly,
  formatCsvNumber,
  formatCsvTimestamp,
  toCsv,
} from "../csv";

describe("escapeCsvCell", () => {
  it("mantém texto simples sem aspas", () => {
    expect(escapeCsvCell("Mercado")).toBe("Mercado");
  });

  it("trata nulo/indefinido como vazio", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("coloca aspas quando há delimitador, aspas ou quebra de linha", () => {
    expect(escapeCsvCell("a;b")).toBe('"a;b"');
    expect(escapeCsvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(escapeCsvCell("linha1\nlinha2")).toBe('"linha1\nlinha2"');
  });
});

describe("toCsv", () => {
  it("inclui BOM UTF-8, cabeçalho e CRLF", () => {
    const csv = toCsv(["A", "B"], [["1", "2"]]);
    expect(csv.startsWith(CSV_UTF8_BOM)).toBe(true);
    const body = csv.slice(1);
    expect(body).toBe(
      `A${CSV_DELIMITER}B${CSV_NEWLINE}1${CSV_DELIMITER}2${CSV_NEWLINE}`,
    );
  });

  it("escapa células com delimitador", () => {
    const csv = toCsv(["Descrição", "Valor"], [["Mercado; extra", "10,00"]]);
    expect(csv).toContain('"Mercado; extra"');
  });
});

describe("formatCsvNumber", () => {
  it("usa vírgula decimal com duas casas", () => {
    expect(formatCsvNumber(1234.5)).toBe("1234,50");
    expect(formatCsvNumber(0)).toBe("0,00");
  });

  it("trata valores inválidos como zero", () => {
    expect(formatCsvNumber(null)).toBe("0,00");
    expect(formatCsvNumber(Number.NaN)).toBe("0,00");
  });
});

describe("formatCsvTimestamp", () => {
  it("formata timestamp ISO como DD/MM/AAAA", () => {
    expect(formatCsvTimestamp("2026-09-21T12:00:00.000Z")).toMatch(
      /^\d{2}\/\d{2}\/2026$/,
    );
  });

  it("devolve vazio para nulo ou inválido", () => {
    expect(formatCsvTimestamp(null)).toBe("");
    expect(formatCsvTimestamp("não é data")).toBe("");
  });
});

describe("formatCsvDateOnly", () => {
  it("formata AAAA-MM-DD como DD/MM/AAAA", () => {
    expect(formatCsvDateOnly("2026-09-21")).toBe("21/09/2026");
  });

  it("devolve vazio para inválido", () => {
    expect(formatCsvDateOnly("21/09/2026")).toBe("");
  });
});

describe("formatCsvBoolean", () => {
  it("usa Sim/Não", () => {
    expect(formatCsvBoolean(true)).toBe("Sim");
    expect(formatCsvBoolean(false)).toBe("Não");
  });
});
