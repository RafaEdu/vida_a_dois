import { describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/domain";
import { fetchProfile, updateProfile } from "../profile";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

interface FromChain {
  update: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "u1",
    full_name: "Rafael Souza",
    birth_date: "1990-02-01",
    monthly_income: 5000,
    invite_code: "A7F3B2C1",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Profile;
}

function mockFromChain(result: { data: unknown; error: unknown }): FromChain {
  const maybeSingle = jest.fn(async () => result);
  const single = jest.fn(async () => result);
  const select = jest.fn(() => ({ eq, single, maybeSingle }));
  const eq = jest.fn(() => ({ select, maybeSingle }));
  const update = jest.fn(() => ({ eq }));

  const fromMock = supabase.from as unknown as {
    mockImplementation: (fn: () => unknown) => void;
  };
  fromMock.mockImplementation(() => ({ update, select }));

  return { update, select, eq, single, maybeSingle };
}

describe("fetchProfile", () => {
  it("busca o perfil pelo id do usuário", async () => {
    const profile = makeProfile();
    const chain = mockFromChain({ data: profile, error: null });

    const result = await fetchProfile("u1");

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("u1");
    expect(chain.eq).toHaveBeenCalledWith("id", "u1");
  });

  it("classifica erro ao carregar o perfil", async () => {
    mockFromChain({
      data: null,
      error: { message: "permission denied" },
    });

    const result = await fetchProfile("u1");

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("permission denied");
  });
});

describe("updateProfile", () => {
  it("atualiza somente o perfil do próprio usuário", async () => {
    const updated = makeProfile({ full_name: "Rafael Souza Lima" });
    const chain = mockFromChain({ data: updated, error: null });

    const result = await updateProfile("u1", {
      full_name: "Rafael Souza Lima",
      monthly_income: 6000,
    });

    expect(result.error).toBeUndefined();
    expect(result.profile?.full_name).toBe("Rafael Souza Lima");
    expect(chain.update).toHaveBeenCalledWith({
      full_name: "Rafael Souza Lima",
      monthly_income: 6000,
    });
    expect(chain.eq).toHaveBeenCalledWith("id", "u1");
  });

  it("devolve a mensagem de erro do banco", async () => {
    mockFromChain({
      data: null,
      error: { message: "new row violates row-level security policy" },
    });

    const result = await updateProfile("u1", {
      full_name: "Rafael",
      monthly_income: null,
    });

    expect(result.profile).toBeUndefined();
    expect(result.error).toBe("new row violates row-level security policy");
  });
});
