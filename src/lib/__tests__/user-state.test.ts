import { describe, expect, it } from "@jest/globals";
import {
  deriveBootstrapRoute,
  deriveGuardRedirect,
  deriveUserState,
  getRouteGroup,
} from "../user-state";
import type { Couple, Profile } from "../../types/domain";

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
    ended_at: status === "ended" ? "2026-03-01T00:00:00.000Z" : null,
    ended_by: status === "ended" ? "user-a" : null,
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

  it("não trata vínculo encerrado como linked", () => {
    expect(deriveUserState(makeProfile(), makeCouple("ended"))).toBe(
      "awaiting_partner",
    );
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

describe("getRouteGroup", () => {
  it("agrupa auth, onboarding e app", () => {
    expect(getRouteGroup("sign-in")).toBe("auth");
    expect(getRouteGroup("verify-email")).toBe("auth");
    expect(getRouteGroup("profile-setup")).toBe("onboarding");
    expect(getRouteGroup("link-partner")).toBe("onboarding");
    expect(getRouteGroup("home")).toBe("app");
  });
});

describe("deriveGuardRedirect", () => {
  it("não redireciona quando a rota canônica pertence ao grupo auth", () => {
    expect(
      deriveGuardRedirect({
        canonical: "sign-in",
        pathname: "/sign-up",
        group: "auth",
      }),
    ).toBeNull();
  });

  it("expulsa do grupo auth quando o usuário já avançou", () => {
    expect(
      deriveGuardRedirect({
        canonical: "home",
        pathname: "/sign-in",
        group: "auth",
      }),
    ).toBe("home");
  });

  it("força verify-email quando o e-mail não foi confirmado", () => {
    expect(
      deriveGuardRedirect({
        canonical: "verify-email",
        pathname: "/sign-in",
        group: "auth",
      }),
    ).toBe("verify-email");
    expect(
      deriveGuardRedirect({
        canonical: "verify-email",
        pathname: "/verify-email",
        group: "auth",
      }),
    ).toBeNull();
  });

  it("no onboarding, redireciona apenas quando o passo canônico é outro", () => {
    expect(
      deriveGuardRedirect({
        canonical: "link-partner",
        pathname: "/profile-setup",
        group: "onboarding",
      }),
    ).toBe("link-partner");
    expect(
      deriveGuardRedirect({
        canonical: "profile-setup",
        pathname: "/profile-setup",
        group: "onboarding",
      }),
    ).toBeNull();
    expect(
      deriveGuardRedirect({
        canonical: "sign-in",
        pathname: "/profile-setup",
        group: "onboarding",
      }),
    ).toBe("sign-in");
  });

  it("deixa a tela de vínculo tratar a transição para a Home", () => {
    expect(
      deriveGuardRedirect({
        canonical: "home",
        pathname: "/link-partner",
        group: "onboarding",
      }),
    ).toBeNull();
  });

  it("expulsa do grupo app enquanto o vínculo não estiver ativo", () => {
    expect(
      deriveGuardRedirect({
        canonical: "link-partner",
        pathname: "/home",
        group: "app",
      }),
    ).toBe("link-partner");
    expect(
      deriveGuardRedirect({
        canonical: "home",
        pathname: "/profile",
        group: "app",
      }),
    ).toBeNull();
  });
});
