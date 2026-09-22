import { describe, expect, it } from "@jest/globals";
import { formatInviteCode } from "../model";

describe("formatInviteCode", () => {
  it("formata um código de 8 caracteres com separador", () => {
    expect(formatInviteCode("A7F3B2C1")).toBe("A7F3-B2C1");
  });

  it("normaliza maiúsculas e ignora separadores existentes", () => {
    expect(formatInviteCode("a7f3-b2c1")).toBe("A7F3-B2C1");
  });

  it("retorna o código parcial sem separador", () => {
    expect(formatInviteCode("abc")).toBe("ABC");
  });

  it("retorna um placeholder quando não há código", () => {
    expect(formatInviteCode(null)).toBe("— — —");
    expect(formatInviteCode(undefined)).toBe("— — —");
    expect(formatInviteCode("")).toBe("— — —");
  });
});
