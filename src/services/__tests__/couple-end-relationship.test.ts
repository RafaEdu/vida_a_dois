import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import { endRelationship } from "../couple";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

const rpcMock = supabase.rpc as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
};

beforeEach(() => {
  rpcMock.mockReset();
});

describe("endRelationship", () => {
  it("chama a RPC sem couple_id e tem sucesso no encerramento", async () => {
    rpcMock.mockResolvedValue({
      data: { status: "ended", couple_id: "c1" },
      error: null,
    });

    const result = await endRelationship();

    expect(result.error).toBeUndefined();
    expect(supabase.rpc).toHaveBeenCalledWith("end_relationship");
  });

  it("trata o encerramento repetido como sucesso idempotente", async () => {
    rpcMock.mockResolvedValue({
      data: { status: "already_ended" },
      error: null,
    });

    const result = await endRelationship();

    expect(result.error).toBeUndefined();
  });

  it("devolve o erro de domínio retornado pela RPC", async () => {
    rpcMock.mockResolvedValue({
      data: { error: "Nenhum vinculo ativo encontrado." },
      error: null,
    });

    const result = await endRelationship();

    expect(result.error).toBe("Nenhum vinculo ativo encontrado.");
  });

  it("devolve mensagem amigável quando a RPC falha", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "Network request failed", code: "" },
    });

    const result = await endRelationship();

    expect(result.error).toBeTruthy();
  });

  it("rejeita resposta sem status esperado", async () => {
    rpcMock.mockResolvedValue({ data: { status: "unexpected" }, error: null });

    const result = await endRelationship();

    expect(result.error).toBe("Não foi possível encerrar o vínculo.");
  });
});
