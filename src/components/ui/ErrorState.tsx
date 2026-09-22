import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing } from "../../theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  title = "Algo deu errado",
  message,
  retryLabel = "Tentar novamente",
  onRetry,
  style,
}: ErrorStateProps) {
  return (
    <View accessibilityRole="alert" style={[styles.base, style]}>
      <View style={styles.iconCircle}>
        <MaterialIcons name="error-outline" size={28} color={colors.danger} />
      </View>
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="bodySmall"
          color="textSecondary"
          align="center"
          style={styles.message}
        >
          {message}
        </AppText>
      ) : null}
      {onRetry ? (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="secondary"
          size="md"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dangerSoft,
    marginBottom: spacing.sm,
  },
  message: {
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.md,
  },
});
