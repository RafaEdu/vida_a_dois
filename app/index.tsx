import { useEffect, useRef } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../src/lib/auth-context";
import { deriveBootstrapRoute } from "../src/lib/user-state";

const REGISTRATION_STEP_KEY = "@registration_step";
const REGISTRATION_KEYS = [
  REGISTRATION_STEP_KEY,
  "@profile_draft_name",
  "@profile_draft_birthdate",
  "@profile_draft_income",
];

export default function Index() {
  const { user, userState } = useAuth();
  const hasRedirected = useRef(false);
  const prevUserState = useRef(userState);

  useEffect(() => {
    if (hasRedirected.current) return;

    const route = deriveBootstrapRoute(user, userState);
    if (route) {
      hasRedirected.current = true;
      AsyncStorage.setItem(REGISTRATION_STEP_KEY, route).catch(() => {});
      router.replace(`/${route}`);
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
