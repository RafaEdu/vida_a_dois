import { describe, expect, it } from "@jest/globals";
import {
  deriveBootstrapStatus,
  deriveCoupleLoadStatus,
  deriveFinanceLoadStatus,
  isBootstrapLoading,
} from "../bootstrap";

describe("deriveCoupleLoadStatus", () => {
  it("retorna ready quando não há usuário", () => {
    expect(
      deriveCoupleLoadStatus({
        userId: null,
        loadedUserId: null,
        internalStatus: "loading",
      }),
    ).toBe("ready");
  });

  it("retorna loading enquanto o usuário ainda não foi carregado", () => {
    expect(
      deriveCoupleLoadStatus({
        userId: "u1",
        loadedUserId: null,
        internalStatus: "ready",
      }),
    ).toBe("loading");
  });

  it("retorna loading para um usuário diferente do carregado", () => {
    expect(
      deriveCoupleLoadStatus({
        userId: "u2",
        loadedUserId: "u1",
        internalStatus: "ready",
      }),
    ).toBe("loading");
  });

  it("retorna ready quando o usuário carregado é o atual", () => {
    expect(
      deriveCoupleLoadStatus({
        userId: "u1",
        loadedUserId: "u1",
        internalStatus: "ready",
      }),
    ).toBe("ready");
  });

  it("preserva o estado de erro", () => {
    expect(
      deriveCoupleLoadStatus({
        userId: "u1",
        loadedUserId: "u1",
        internalStatus: "error",
      }),
    ).toBe("error");
  });
});

describe("deriveFinanceLoadStatus", () => {
  it("retorna idle sem casal ativo", () => {
    expect(
      deriveFinanceLoadStatus({
        coupleId: null,
        coupleStatus: null,
        loadedCoupleId: null,
      }),
    ).toBe("idle");
  });

  it("retorna idle para casal pendente", () => {
    expect(
      deriveFinanceLoadStatus({
        coupleId: "c1",
        coupleStatus: "pending",
        loadedCoupleId: null,
      }),
    ).toBe("idle");
  });

  it("retorna loading para casal ativo ainda não carregado", () => {
    expect(
      deriveFinanceLoadStatus({
        coupleId: "c1",
        coupleStatus: "active",
        loadedCoupleId: null,
      }),
    ).toBe("loading");
  });

  it("retorna ready quando o snapshot do casal já foi carregado", () => {
    expect(
      deriveFinanceLoadStatus({
        coupleId: "c1",
        coupleStatus: "active",
        loadedCoupleId: "c1",
      }),
    ).toBe("ready");
  });
});

describe("deriveBootstrapStatus", () => {
  it("prioriza erro sobre carregamento", () => {
    expect(deriveBootstrapStatus("loading", "error")).toBe("error");
    expect(deriveBootstrapStatus("error", "ready")).toBe("error");
  });

  it("retorna loading quando qualquer etapa carrega", () => {
    expect(deriveBootstrapStatus("loading", "ready")).toBe("loading");
    expect(deriveBootstrapStatus("ready", "loading")).toBe("loading");
  });

  it("retorna ready quando tudo terminou", () => {
    expect(deriveBootstrapStatus("ready", "ready")).toBe("ready");
  });
});

describe("isBootstrapLoading", () => {
  it("considera auth, casal e finanças", () => {
    expect(isBootstrapLoading("loading", "ready", "idle")).toBe(true);
    expect(isBootstrapLoading("ready", "loading", "idle")).toBe(true);
    expect(isBootstrapLoading("ready", "ready", "loading")).toBe(true);
    expect(isBootstrapLoading("ready", "ready", "ready")).toBe(false);
    expect(isBootstrapLoading("ready", "ready", "idle")).toBe(false);
  });
});
