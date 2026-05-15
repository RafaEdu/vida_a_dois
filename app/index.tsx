import { useEffect, useRef } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../src/lib/auth-context";

const REGISTRATION_STEP_KEY = "@registration_step";
const REGISTRATION_KEYS = [
  REGISTRATION_STEP_KEY,
  "@profile_draft_name",
  "@profile_draft_birthdate",
  "@profile_draft_income",
];

function getStep(user: any, userState: string): string | null {
  if (!user) return "sign-in";
  if (!user.email_confirmed_at) return "verify-email";
  if (userState === "profile_incomplete") return "profile-setup";
  if (userState === "awaiting_partner") return "link-partner";
  if (userState === "linked") return "home";
  return null;
}

export default function Index() {
  const { user, userState } = useAuth();
  const hasRedirected = useRef(false);
  const prevUserState = useRef(userState);

  useEffect(() => {
    if (hasRedirected.current) return;

    const step = getStep(user, userState);
    if (step) {
      hasRedirected.current = true;
      AsyncStorage.setItem(REGISTRATION_STEP_KEY, step).catch(() => {});
      router.replace(`/${step === "home" ? "home" : step}`);
    }
  }, [user, userState]);

  useEffect(() => {
    if (userState === "linked" && prevUserState.current !== "linked") {
      AsyncStorage.multiRemove(REGISTRATION_KEYS).catch(() => {});
    }
    prevUserState.current = userState;
  }, [userState]);

  return null;
}
