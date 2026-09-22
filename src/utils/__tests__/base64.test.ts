import { describe, expect, it } from "@jest/globals";
import { base64ToUint8Array } from "../base64";

describe("base64ToUint8Array", () => {
  it("decodifica bytes simples", () => {
    const encoded = Buffer.from("Oi", "utf8").toString("base64");
    expect(Array.from(base64ToUint8Array(encoded))).toEqual([79, 105]);
  });

  it("decodifica conteúdo binário preservando os bytes", () => {
    const source = Buffer.from([0, 1, 2, 253, 254, 255]);
    const encoded = source.toString("base64");
    expect(Array.from(base64ToUint8Array(encoded))).toEqual([
      0, 1, 2, 253, 254, 255,
    ]);
  });

  it("ignora whitespace e padding", () => {
    const encoded = Buffer.from("vida a dois", "utf8").toString("base64");
    const withWhitespace = `\n ${encoded.slice(0, 4)} \t${encoded.slice(4)}\n`;
    expect(Array.from(base64ToUint8Array(withWhitespace))).toEqual(
      Array.from(Buffer.from("vida a dois", "utf8")),
    );
  });

  it("devolve vazio para entrada vazia", () => {
    expect(base64ToUint8Array("").length).toBe(0);
  });
});
