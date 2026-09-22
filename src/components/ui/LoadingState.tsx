import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, spacing } from "../../theme";
import { AppText } from "./AppText";

export interface LoadingStateProps {
  message?: string;
  /** Lay out inline (row) instead of filling and centering. */
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LoadingState({
  message = "Carregando...",
  inline = false,
  style,
}: LoadingStateProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={[inline ? styles.inline : styles.centered, style]}
    >
      <ActivityIndicator color={colors.primary} />
      {message ? (
        <AppText
          variant="bodySmall"
          color="textSecondary"
          style={styles.message}
        >
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  message: {
    textAlign: "center",
  },
});
