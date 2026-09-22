import { describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/domain";
import {
  createAvatarSignedUrl,
  fetchProfile,
  removeAvatarObject,
  updateAvatarPath,
  updateProfile,
  uploadAvatarObject,
} from "../profile";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
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
    avatar_path: null,
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
      birth_date: "1990-02-01",
      monthly_income: 6000,
    });

    expect(result.error).toBeUndefined();
    expect(result.profile?.full_name).toBe("Rafael Souza Lima");
    expect(chain.update).toHaveBeenCalledWith({
      full_name: "Rafael Souza Lima",
      birth_date: "1990-02-01",
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
      birth_date: "1990-02-01",
      monthly_income: null,
    });

    expect(result.profile).toBeUndefined();
    expect(result.error).toBe("new row violates row-level security policy");
  });
});

describe("avatar storage", () => {
  interface StorageChain {
    upload: jest.Mock;
    remove: jest.Mock;
    createSignedUrl: jest.Mock;
  }

  function mockStorage(result: {
    data?: unknown;
    error?: unknown;
  }): StorageChain {
    const upload = jest.fn(async () => result);
    const remove = jest.fn(async () => result);
    const createSignedUrl = jest.fn(async () => result);

    const storageFrom = supabase.storage.from as unknown as {
      mockImplementation: (fn: (bucket: string) => unknown) => void;
    };
    storageFrom.mockImplementation(() => ({ upload, remove, createSignedUrl }));

    return { upload, remove, createSignedUrl };
  }

  it("atualiza apenas o avatar_path do próprio usuário", async () => {
    const updated = makeProfile({ avatar_path: "u1/avatar-1.png" });
    const chain = mockFromChain({ data: updated, error: null });

    const result = await updateAvatarPath("u1", "u1/avatar-1.png");

    expect(result.profile?.avatar_path).toBe("u1/avatar-1.png");
    expect(chain.update).toHaveBeenCalledWith({
      avatar_path: "u1/avatar-1.png",
    });
    expect(chain.eq).toHaveBeenCalledWith("id", "u1");
  });

  it("faz upload do objeto no bucket dedicado", async () => {
    const storage = mockStorage({
      data: { path: "u1/avatar-1.png" },
      error: null,
    });

    const result = await uploadAvatarObject(
      "u1/avatar-1.png",
      new ArrayBuffer(4),
      "image/png",
    );

    expect(result.error).toBeUndefined();
    expect(storage.upload).toHaveBeenCalledWith(
      "u1/avatar-1.png",
      expect.any(ArrayBuffer),
      { contentType: "image/png", upsert: false },
    );
  });

  it("remove o objeto do bucket", async () => {
    const storage = mockStorage({ data: null, error: null });

    const result = await removeAvatarObject("u1/avatar-1.png");

    expect(result.error).toBeUndefined();
    expect(storage.remove).toHaveBeenCalledWith(["u1/avatar-1.png"]);
  });

  it("devolve a URL assinada quando disponível", async () => {
    mockStorage({
      data: { signedUrl: "https://example.test/avatar" },
      error: null,
    });

    await expect(createAvatarSignedUrl("u1/avatar-1.png")).resolves.toBe(
      "https://example.test/avatar",
    );
  });

  it("devolve null quando não há permissão/objeto", async () => {
    mockStorage({ data: null, error: { message: "not found" } });

    await expect(createAvatarSignedUrl("u2/avatar-1.png")).resolves.toBeNull();
  });
});
