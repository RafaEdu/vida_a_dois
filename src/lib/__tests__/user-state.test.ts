import { describe, expect, it } from "@jest/globals";
import { deriveBootstrapRoute, deriveUserState } from "../user-state";
import type { Couple, Profile } from "../../types/database";

function makeProfile(): Profile {
  return {
    id: "user-a",
    full_name: "Usuário A",
    birth_date: null,
    monthly_income: null,
    invite_code: "ABCD1234",
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeCouple(status: Couple["status"]): Couple {
  return {
    id: "couple-1",
    user_a: "user-a",
    user_b: "user-b",
    status,
    split_ratio_a: 50,
    split_ratio_b: 50,
    monthly_budget: 0,
    shared_balance: 0,
    last_closed_month: null,
    created_at: "2026-01-01T00:00:00.000Z",
    linked_at: status === "active" ? "2026-01-02T00:00:00.000Z" : null,
  };
}

describe("deriveUserState", () => {
  it("retorna profile_incomplete quando não existe perfil", () => {
    expect(deriveUserState(null, null)).toBe("profile_incomplete");
  });

  it("retorna awaiting_partner quando há perfil mas não há casal", () => {
    expect(deriveUserState(makeProfile(), null)).toBe("awaiting_partner");
  });

  it("retorna awaiting_partner quando o convite está pendente", () => {
    expect(deriveUserState(makeProfile(), makeCouple("pending"))).toBe(
      "awaiting_partner",
    );
  });

  it("retorna linked quando o casal está ativo", () => {
    expect(deriveUserState(makeProfile(), makeCouple("active"))).toBe("linked");
  });
});

describe("deriveBootstrapRoute", () => {
  it("usuário novo sem sessão vai para sign-in", () => {
    expect(deriveBootstrapRoute(null, "unverified")).toBe("sign-in");
  });

  it("usuário com e-mail não verificado vai para verify-email", () => {
    expect(
      deriveBootstrapRoute({ email_confirmed_at: undefined }, "unverified"),
    ).toBe("verify-email");
  });

  it("usuário verificado sem perfil vai para profile-setup", () => {
    expect(
      deriveBootstrapRoute(
        { email_confirmed_at: "2026-01-01T00:00:00.000Z" },
        "profile_incomplete",
      ),
    ).toBe("profile-setup");
  });

  it("usuário com perfil sem casal vai para link-partner", () => {
    expect(
      deriveBootstrapRoute(
        { email_confirmed_at: "2026-01-01T00:00:00.000Z" },
        "awaiting_partner",
      ),
    ).toBe("link-partner");
  });

  it("usuário com convite pendente vai para link-partner", () => {
    expect(
      deriveBootstrapRoute(
        { email_confirmed_at: "2026-01-01T00:00:00.000Z" },
        "awaiting_partner",
      ),
    ).toBe("link-partner");
  });

  it("usuário com casal ativo vai para home", () => {
    expect(
      deriveBootstrapRoute(
        { email_confirmed_at: "2026-01-01T00:00:00.000Z" },
        "linked",
      ),
    ).toBe("home");
  });
});
