import { Stack } from "expo-router/stack";
import { AuthProvider, useAuth } from "../src/lib/auth-context";
import { View, ActivityIndicator, Text } from "react-native";

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" }}>
      <ActivityIndicator size="large" color="#FF6B6B" />
      <Text style={{ marginTop: 16, color: "#666", fontSize: 14 }}>Carregando...</Text>
    </View>
  );
}

function AppNavigator() {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="sign-up" options={{ title: "Criar conta", animationTypeForReplace: "push" }} />
      <Stack.Screen name="sign-in" options={{ title: "Entrar" }} />
      <Stack.Screen name="verify-email" options={{ title: "Verificar e-mail", gestureEnabled: false }} />
      <Stack.Screen name="profile-setup" options={{ title: "Perfil", gestureEnabled: false }} />
      <Stack.Screen name="link-partner" options={{ title: "Vincular parceiro", gestureEnabled: false }} />
      <Stack.Screen name="home" options={{ title: "Vida a Dois", gestureEnabled: false }} />
      <Stack.Screen name="profile" options={{ title: "Meu perfil", presentation: "modal" }} />
      <Stack.Screen name="expense/new" options={{ title: "Nova despesa" }} />
      <Stack.Screen name="income/new" options={{ title: "Nova receita" }} />
      <Stack.Screen name="cost-plan" options={{ title: "Plano de custos" }} />
      <Stack.Screen name="cost-plan/edit" options={{ title: "Editar plano" }} />
      <Stack.Screen name="monthly-closing" options={{ title: "Fechamento do mês" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
