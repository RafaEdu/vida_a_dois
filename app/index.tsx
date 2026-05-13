import { Redirect } from "expo-router";
import { useAuth } from "../src/lib/auth-context";

export default function Index() {
  const { user, userState } = useAuth();

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  if (!user.email_confirmed_at) {
    return <Redirect href="/verify-email" />;
  }

  if (userState === "profile_incomplete") {
    return <Redirect href="/profile-setup" />;
  }

  if (userState === "awaiting_partner") {
    return <Redirect href="/link-partner" />;
  }

  return <Redirect href="/home" />;
}
