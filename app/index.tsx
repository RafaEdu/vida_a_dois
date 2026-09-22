import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { useAuth } from "../src/lib/auth-context";
import { deriveBootstrapRoute } from "../src/lib/user-state";

export default function Index() {
  const { user, userState } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    const route = deriveBootstrapRoute(user, userState);
    if (route) {
      hasRedirected.current = true;
      router.replace(`/${route}`);
    }
  }, [user, userState]);

  return null;
}
