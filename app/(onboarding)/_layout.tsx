import { Stack } from "expo-router/stack";
import { useRouteGuard } from "../../src/hooks/useRouteGuard";

export default function OnboardingLayout() {
  useRouteGuard("onboarding");

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="profile-setup"
        options={{ title: "Perfil", gestureEnabled: false }}
      />
      <Stack.Screen
        name="link-partner"
        options={{ title: "Vincular parceiro", gestureEnabled: false }}
      />
    </Stack>
  );
}
