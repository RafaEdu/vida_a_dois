import { describe, expect, it } from "@jest/globals";
import { getFirstName } from "../name";

describe("getFirstName", () => {
  it("retorna o primeiro nome de um nome completo", () => {
    expect(getFirstName("Rafaela Souza Lima")).toBe("Rafaela");
  });

  it("lida com espaços extras", () => {
    expect(getFirstName("  Eduardo  ")).toBe("Eduardo");
  });

  it("retorna vazio para valores ausentes", () => {
    expect(getFirstName(null)).toBe("");
    expect(getFirstName(undefined)).toBe("");
    expect(getFirstName("   ")).toBe("");
  });
});
