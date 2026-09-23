import { Stack } from "expo-router/stack";
import { useRouteGuard } from "../../src/hooks/useRouteGuard";
import { HeaderCancelButton } from "../../src/components/shell";
import { colors, fontFamilies } from "../../src/theme";

export default function AppLayout() {
  useRouteGuard("app");

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontFamily: fontFamilies.jakarta.semibold,
          color: colors.text,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="expense/new"
        options={{
          presentation: "modal",
          title: "Nova despesa",
          headerLeft: () => <HeaderCancelButton />,
        }}
      />
      <Stack.Screen
        name="income/new"
        options={{
          presentation: "modal",
          title: "Nova receita",
          headerLeft: () => <HeaderCancelButton />,
        }}
      />
      <Stack.Screen
        name="cost-plan/edit"
        options={{ title: "Editar planejamento" }}
      />
      <Stack.Screen
        name="monthly-closing"
        options={{ title: "Fechamento do mês" }}
      />
      <Stack.Screen
        name="closing-history"
        options={{ title: "Histórico de fechamentos" }}
      />
      <Stack.Screen name="closing-detail" options={{ title: "Fechamento" }} />
      <Stack.Screen name="settlement" options={{ title: "Acerto do casal" }} />
      <Stack.Screen name="recurrences" options={{ title: "Recorrências" }} />
      <Stack.Screen
        name="category-budgets"
        options={{ title: "Orçamento por categoria" }}
      />
      <Stack.Screen name="goals" options={{ title: "Metas" }} />
      <Stack.Screen name="goal-detail" options={{ title: "Meta" }} />
      <Stack.Screen name="activity" options={{ title: "Atividade" }} />
      <Stack.Screen
        name="notification-settings"
        options={{ title: "Notificações" }}
      />
      <Stack.Screen
        name="couple-settings"
        options={{ title: "Configurações do vínculo" }}
      />
      <Stack.Screen
        name="end-relationship"
        options={{ title: "Encerrar vínculo" }}
      />
      <Stack.Screen name="profile" options={{ title: "Perfil" }} />
    </Stack>
  );
}
