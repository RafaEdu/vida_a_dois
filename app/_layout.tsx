import { Stack } from "expo-router/stack";
import { AuthProvider } from "../src/providers/AuthProvider";
import { CoupleProvider } from "../src/providers/CoupleProvider";
import { FinanceProvider } from "../src/providers/FinanceProvider";
import { NotificationProvider } from "../src/providers/NotificationProvider";
import { useAuth } from "../src/lib/auth-context";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Pressable,
} from "react-native";
import { useAppFonts } from "../src/theme/fonts";
import { colors, radius, spacing } from "../src/theme";

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
          <NotificationProvider>
            <AppNavigator />
          </NotificationProvider>
        </FinanceProvider>
      </CoupleProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  errorMessage: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
