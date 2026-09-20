import { Stack } from "expo-router/stack";
import { AuthProvider } from "../src/providers/AuthProvider";
import { CoupleProvider } from "../src/providers/CoupleProvider";
import { FinanceProvider } from "../src/providers/FinanceProvider";
import { useAuth } from "../src/lib/auth-context";
import { View, ActivityIndicator, Text, Pressable } from "react-native";
import { styles } from "../src/theme/layout.styles";

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#FF6B6B" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

function BootstrapErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.loading}>
      <Text style={styles.errorTitle}>
        Não foi possível carregar seus dados.
      </Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={styles.retryButton}
        accessibilityRole="button"
        accessibilityLabel="Tentar carregar novamente"
      >
        <Text style={styles.retryButtonText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

function AppNavigator() {
  const { loading, bootstrapStatus, bootstrapError, retryBootstrap } = useAuth();

  if (loading) return <LoadingScreen />;

  if (bootstrapStatus === "error") {
    return (
      <BootstrapErrorScreen
        message={bootstrapError ?? "Erro inesperado ao inicializar."}
        onRetry={retryBootstrap}
      />
    );
  }

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
      <Stack.Screen name="expenses" options={{ title: "Histórico" }} />
      <Stack.Screen name="expense/new" options={{ title: "Nova despesa", headerShown: false }} />
      <Stack.Screen name="income/new" options={{ title: "Nova receita", headerShown: false }} />
      <Stack.Screen name="cost-plan" options={{ title: "Plano de custos" }} />
      <Stack.Screen name="cost-plan/edit" options={{ title: "Editar plano" }} />
      <Stack.Screen name="monthly-closing" options={{ title: "Fechamento do mês" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CoupleProvider>
        <FinanceProvider>
          <AppNavigator />
        </FinanceProvider>
      </CoupleProvider>
    </AuthProvider>
  );
}
