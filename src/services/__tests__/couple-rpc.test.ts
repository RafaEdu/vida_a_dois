import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { CloseMonthResult } from "../../types/domain";
import {
  acceptInvitation,
  closeMonth,
  linkPartner,
  rejectInvitation,
} from "../couple";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

const rpcMock = supabase.rpc as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mock: { calls: unknown[][] };
};

function makeClosing(
  overrides: Partial<CloseMonthResult> = {},
): CloseMonthResult {
  return {
    success: true,
    already_closed: false,
    id: "cl1",
    year_month: "2026-09",
    total_incomes: 1000,
    total_expenses: 400,
    monthly_budget: 500,
    split_ratio_a: 50,
    split_ratio_b: 50,
    shared_balance_before: 0,
    month_delta: 600,
    shared_balance_after: 600,
    closed_by: "u1",
    closed_at: "2026-09-30T00:00:00.000Z",
    last_closed_month: "2026-09",
    ...overrides,
  };
}

beforeEach(() => {
  rpcMock.mockReset();
});

describe("linkPartner", () => {
  it("vincula sem enviar identidade do cliente (só o convite)", async () => {
    rpcMock.mockResolvedValue({ data: { status: "linked" }, error: null });

    const result = await linkPartner("ABCD1234");

    expect(result.error).toBeUndefined();
    expect(rpcMock.mock.calls[0]).toEqual([
      "link_partner",
      { p_invite_code: "ABCD1234" },
    ]);
  });

  it("devolve erro de domínio quando já existe vínculo aberto", async () => {
    rpcMock.mockResolvedValue({
      data: { error: "Voce ja esta em um casal." },
      error: null,
    });

    const result = await linkPartner("ABCD1234");

    expect(result.error).toBe("Voce ja esta em um casal.");
  });

  it("classifica erro técnico da RPC", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied" },
    });

    const result = await linkPartner("ABCD1234");

    expect(result.error).toBe("permission denied");
  });
});

describe("acceptInvitation / rejectInvitation", () => {
  it("aceita o convite apenas com o couple_id", async () => {
    rpcMock.mockResolvedValue({ data: { status: "active" }, error: null });

    const accepted = await acceptInvitation("c1");

    expect(accepted.error).toBeUndefined();
    expect(rpcMock.mock.calls[0]).toEqual([
      "accept_invitation",
      { p_couple_id: "c1" },
    ]);
  });

  it("recusa o convite apenas com o couple_id", async () => {
    rpcMock.mockResolvedValue({ data: { status: "rejected" }, error: null });

    const rejected = await rejectInvitation("c1");

    expect(rejected.error).toBeUndefined();
    expect(rpcMock.mock.calls[0]).toEqual([
      "reject_invitation",
      { p_couple_id: "c1" },
    ]);
  });
});

describe("closeMonth", () => {
  it("chama a RPC close_month com o vínculo e devolve o snapshot", async () => {
    const closing = makeClosing();
    rpcMock.mockResolvedValue({ data: closing, error: null });

    const { error, result } = await closeMonth("c1");

    expect(error).toBeUndefined();
    expect(rpcMock.mock.calls[0]).toEqual([
      "close_month",
      { p_couple_id: "c1" },
    ]);
    expect(result).toEqual(closing);
  });

  it("trata refechamento idempotente como sucesso com o snapshot existente", async () => {
    const closing = makeClosing({ already_closed: true });
    rpcMock.mockResolvedValue({ data: closing, error: null });

    const { error, result } = await closeMonth("c1");

    expect(error).toBeUndefined();
    expect(result?.already_closed).toBe(true);
  });

  it("devolve a mensagem de domínio da RPC", async () => {
    rpcMock.mockResolvedValue({
      data: { error: "Nenhum vinculo ativo encontrado." },
      error: null,
    });

    const { error, result } = await closeMonth("c1");

    expect(result).toBeUndefined();
    expect(error).toBe("Nenhum vinculo ativo encontrado.");
  });
});
