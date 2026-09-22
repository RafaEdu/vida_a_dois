import { describe, expect, it } from "@jest/globals";
import {
  AVATAR_MAX_BYTES,
  buildAvatarObjectPath,
  decodeAvatarBase64,
  estimateBase64Bytes,
  resolveAvatarMimeType,
  validateAvatarAsset,
} from "../avatar";

const SMALL_BASE64 = Buffer.from([1, 2, 3, 4]).toString("base64");

describe("resolveAvatarMimeType", () => {
  it("aceita mime permitido", () => {
    expect(resolveAvatarMimeType({ mimeType: "image/png" })).toBe("image/png");
  });

  it("deduz o formato pela extensão quando o mime não vem", () => {
    expect(resolveAvatarMimeType({ uri: "file:///x/photo.JPG" })).toBe(
      "image/jpeg",
    );
  });

  it("rejeita formato não suportado", () => {
    expect(resolveAvatarMimeType({ mimeType: "image/heic" })).toBeNull();
  });
});

describe("validateAvatarAsset", () => {
  it("aceita imagem pequena e válida", () => {
    const result = validateAvatarAsset({
      base64: SMALL_BASE64,
      mimeType: "image/jpeg",
    });
    expect(result.error).toBeUndefined();
    expect(result.value?.mimeType).toBe("image/jpeg");
  });

  it("rejeita quando falta o conteúdo", () => {
    const result = validateAvatarAsset({ mimeType: "image/png" });
    expect(result.error).toBeDefined();
    expect(result.value).toBeUndefined();
  });

  it("rejeita imagem acima do limite", () => {
    const result = validateAvatarAsset({
      base64: SMALL_BASE64,
      mimeType: "image/png",
      fileSize: AVATAR_MAX_BYTES + 1,
    });
    expect(result.error).toBeDefined();
  });

  it("rejeita formato não suportado", () => {
    const result = validateAvatarAsset({
      base64: SMALL_BASE64,
      mimeType: "image/heic",
    });
    expect(result.error).toBeDefined();
  });
});

describe("estimateBase64Bytes", () => {
  it("estima o tamanho do binário a partir do base64", () => {
    expect(estimateBase64Bytes(SMALL_BASE64)).toBe(4);
  });
});

describe("buildAvatarObjectPath", () => {
  it("usa o id do usuário como prefixo e extensão coerente", () => {
    expect(buildAvatarObjectPath("u1", "image/png", 123)).toBe(
      "u1/avatar-123.png",
    );
    expect(buildAvatarObjectPath("u2", "image/jpeg", 456)).toBe(
      "u2/avatar-456.jpg",
    );
  });
});

describe("decodeAvatarBase64", () => {
  it("converte base64 em ArrayBuffer com os mesmos bytes", () => {
    const buffer = decodeAvatarBase64(SMALL_BASE64);
    expect(Array.from(new Uint8Array(buffer))).toEqual([1, 2, 3, 4]);
  });
});
