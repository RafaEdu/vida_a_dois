import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../../theme";
import { AppText } from "../../../components/ui";

export interface FormBannerProps {
  message?: string | null;
  tone?: "error" | "info";
  style?: StyleProp<ViewStyle>;
}

/** Form-level feedback banner (persistence errors, missing couple, etc.). */
export function FormBanner({
  message,
  tone = "error",
  style,
}: FormBannerProps) {
  if (!message) return null;

  const isError = tone === "error";

  return (
    <View style={[styles.base, isError ? styles.error : styles.info, style]}>
      <MaterialIcons
        name={isError ? "error-outline" : "info-outline"}
        size={18}
        color={isError ? colors.danger : colors.primary}
      />
      <AppText
        variant="bodySmall"
        color={isError ? "danger" : "text"}
        style={styles.text}
      >
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  error: {
    backgroundColor: colors.dangerSoft,
  },
  info: {
    backgroundColor: colors.primarySoft,
  },
  text: {
    flex: 1,
  },
});
