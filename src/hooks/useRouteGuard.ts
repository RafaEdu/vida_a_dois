import { useEffect } from "react";
import { router, usePathname } from "expo-router";
import { useAuth } from "../lib/auth-context";
import {
  deriveBootstrapRoute,
  deriveGuardRedirect,
  type RouteGroup,
} from "../lib/user-state";

export function useRouteGuard(group: RouteGroup) {
  const { user, userState } = useAuth();
  const pathname = usePathname();

  const redirect = deriveGuardRedirect({
    canonical: deriveBootstrapRoute(user, userState),
    pathname,
    group,
  });

  useEffect(() => {
    if (redirect) router.replace(`/${redirect}`);
  }, [redirect]);
}
