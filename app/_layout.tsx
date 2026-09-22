import { Stack } from "expo-router/stack";
import { AuthProvider } from "../src/providers/AuthProvider";
import { CoupleProvider } from "../src/providers/CoupleProvider";
import { FinanceProvider } from "../src/providers/FinanceProvider";
import { useAuth } from "../src/lib/auth-context";
import { View, ActivityIndicator, Text, Pressable } from "react-native";
import { styles } from "../src/theme/layout.styles";
import { useAppFonts } from "../src/theme/fonts";
import { colors } from "../src/theme";

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
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
  const { loading, bootstrapStatus, bootstrapError, retryBootstrap } =
    useAuth();

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
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Fonts are loaded once here. On error we keep the app usable with the
  // platform fallback font instead of blocking the UI.
  const [fontsLoaded, fontError] = useAppFonts();

  if (!fontsLoaded && !fontError) {
    return <LoadingScreen />;
  }

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
