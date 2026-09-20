import { describe, expect, it } from "@jest/globals";
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
  parseDecimalInput,
} from "../currency";

describe("formatCurrency", () => {
  it("formata um valor em reais", () => {
    expect(formatCurrency(1234.56)).toContain("1.234,56");
  });

  it("formata zero", () => {
    expect(formatCurrency(0)).toContain("0,00");
  });

  it("trata null e undefined como zero", () => {
    expect(formatCurrency(null)).toContain("0,00");
    expect(formatCurrency(undefined)).toContain("0,00");
  });

  it("trata valor não finito como zero", () => {
    expect(formatCurrency(Number.NaN)).toContain("0,00");
  });
});

describe("formatCurrencyInput", () => {
  it("mantém vazio quando não há dígitos", () => {
    expect(formatCurrencyInput("")).toBe("");
  });

  it("interpreta os dígitos como centavos", () => {
    expect(formatCurrencyInput("1234")).toContain("12,34");
  });
});

describe("parseCurrencyInput", () => {
  it("converte entrada em centavos", () => {
    expect(parseCurrencyInput("1234")).toBe(12.34);
    expect(parseCurrencyInput("R$ 12,34")).toBe(12.34);
  });

  it("retorna zero para entrada vazia", () => {
    expect(parseCurrencyInput("")).toBe(0);
  });
});

describe("parseDecimalInput", () => {
  it("aceita vírgula como separador decimal", () => {
    expect(parseDecimalInput("12,34")).toBe(12.34);
  });

  it("aceita ponto como separador decimal", () => {
    expect(parseDecimalInput("12.34")).toBe(12.34);
  });

  it("aceita separador de milhar brasileiro", () => {
    expect(parseDecimalInput("1.234,56")).toBe(1234.56);
  });

  it("aceita separador de milhar com ponto decimal", () => {
    expect(parseDecimalInput("1,234.56")).toBe(1234.56);
  });

  it("mantém ponto único como decimal", () => {
    expect(parseDecimalInput("1.234")).toBe(1.234);
  });

  it("retorna zero para entrada vazia ou inválida", () => {
    expect(parseDecimalInput("")).toBe(0);
    expect(parseDecimalInput("abc")).toBe(0);
  });
});
