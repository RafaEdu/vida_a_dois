import type { User } from "@supabase/supabase-js";
import type { Couple, Profile, UserState } from "../types/domain";

export type BootstrapRoute =
  "sign-in" | "verify-email" | "profile-setup" | "link-partner" | "home";

export function deriveUserState(
  profile: Profile | null,
  couple: Couple | null,
): UserState {
  if (!profile) return "profile_incomplete";
  if (!couple) return "awaiting_partner";
  if (couple.status === "pending") return "awaiting_partner";
  return "linked";
}

export function deriveBootstrapRoute(
  user: Pick<User, "email_confirmed_at"> | null,
  userState: UserState,
): BootstrapRoute | null {
  if (!user) return "sign-in";
  if (!user.email_confirmed_at) return "verify-email";
  if (userState === "profile_incomplete") return "profile-setup";
  if (userState === "awaiting_partner") return "link-partner";
  if (userState === "linked") return "home";
  return null;
}

export type RouteGroup = "auth" | "onboarding" | "app";

export function getRouteGroup(route: BootstrapRoute): RouteGroup {
  switch (route) {
    case "sign-in":
    case "verify-email":
      return "auth";
    case "profile-setup":
    case "link-partner":
      return "onboarding";
    case "home":
      return "app";
  }
}

/**
 * Decide se o layout de um grupo deve expulsar a rota atual.
 * Retorna a rota canônica de destino ou `null` quando a rota atual é permitida.
 */
export function deriveGuardRedirect(params: {
  canonical: BootstrapRoute | null;
  pathname: string;
  group: RouteGroup;
}): BootstrapRoute | null {
  const { canonical, pathname, group } = params;

  if (!canonical) return null;

  const canonicalGroup = getRouteGroup(canonical);

  if (group === "auth") {
    if (canonicalGroup !== "auth") return canonical;
    if (canonical === "verify-email" && pathname !== "/verify-email") {
      return "verify-email";
    }
    return null;
  }

  if (group === "onboarding") {
    if (canonicalGroup === "auth") return canonical;
    // O vínculo concluído é tratado pela própria tela antes de ir para a Home.
    if (canonical === "home") return null;
    if (pathname !== `/${canonical}`) return canonical;
    return null;
  }

  if (canonical !== "home") return canonical;
  return null;
}
