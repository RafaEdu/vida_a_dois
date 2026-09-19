import { describe, expect, it } from "@jest/globals";
import {
  extractDomainError,
  fail,
  ok,
  rpcToAppError,
  toAppError,
} from "../result";

describe("ok / fail", () => {
  it("ok carrega dados sem erro", () => {
    expect(ok({ id: 1 })).toEqual({ data: { id: 1 }, error: null });
  });

  it("fail carrega erro sem dados", () => {
    const error = { code: "unknown", message: "falhou" } as const;
    expect(fail(error)).toEqual({ data: null, error });
  });
});

describe("toAppError", () => {
  it("classifica falha de rede como network", () => {
    const error = new TypeError("Network request failed");
    expect(toAppError(error).code).toBe("network");
  });

  it("classifica AbortError (timeout) como network", () => {
    const error = new Error("The operation was aborted.");
    error.name = "AbortError";
    expect(toAppError(error).code).toBe("network");
  });

  it("classifica violação de RLS como permission", () => {
    const error = { code: "42501", message: "permission denied" };
    expect(toAppError(error).code).toBe("permission");
  });

  it("classifica violação de constraint como validation", () => {
    const error = { code: "23514", message: "check violation" };
    expect(toAppError(error).code).toBe("validation");
  });

  it("classifica ausência de registro como not_found", () => {
    const error = { code: "PGRST116", message: "no rows" };
    expect(toAppError(error).code).toBe("not_found");
  });

  it("usa mensagem de fallback quando não há erro", () => {
    expect(toAppError(null, "mensagem padrão")).toEqual({
      code: "unknown",
      message: "mensagem padrão",
      cause: null,
    });
  });

  it("preserva a mensagem de erro desconhecido", () => {
    const error = { message: "algo inesperado" };
    const result = toAppError(error);
    expect(result.code).toBe("unknown");
    expect(result.message).toBe("algo inesperado");
  });
});

describe("extractDomainError", () => {
  it("extrai mensagem de domínio de um resultado de RPC", () => {
    expect(extractDomainError({ error: "Convite inválido." })).toBe(
      "Convite inválido.",
    );
  });

  it("retorna null quando não há erro de domínio", () => {
    expect(extractDomainError({ id: "1" })).toBeNull();
    expect(extractDomainError(null)).toBeNull();
  });
});

describe("rpcToAppError", () => {
  it("prioriza a mensagem de domínio retornada pela RPC", () => {
    const result = rpcToAppError(
      { error: "Você não pode vincular a si mesmo." },
      null,
      "fallback",
    );
    expect(result).toEqual({
      code: "validation",
      message: "Você não pode vincular a si mesmo.",
      cause: { error: "Você não pode vincular a si mesmo." },
    });
  });

  it("cai para o erro técnico quando não há mensagem de domínio", () => {
    const result = rpcToAppError(
      null,
      { code: "42501", message: "denied" },
      "fallback",
    );
    expect(result.code).toBe("permission");
    expect(result.message).toBe("denied");
  });
});
