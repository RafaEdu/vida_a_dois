import type { User } from "@supabase/supabase-js";
import type { Couple, Profile, UserState } from "../types/database";

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
