import { Stack } from "expo-router/stack";
import { useRouteGuard } from "../../src/hooks/useRouteGuard";

export default function AuthLayout() {
  useRouteGuard("auth");

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" options={{ title: "Entrar" }} />
      <Stack.Screen
        name="sign-up"
        options={{ title: "Criar conta", animationTypeForReplace: "push" }}
      />
      <Stack.Screen
        name="verify-email"
        options={{ title: "Verificar e-mail", gestureEnabled: false }}
      />
    </Stack>
  );
}
