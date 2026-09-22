import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../theme";
import { AppText } from "../ui";

interface FormErrorProps {
  message?: string | null;
  variant?: "box" | "plain";
}

/** Form-level error feedback (submit/persistence failures). */
export function FormError({ message, variant = "box" }: FormErrorProps) {
  if (!message) return null;

  if (variant === "plain") {
    return (
      <View style={styles.plain}>
        <AppText variant="bodySmall" color="danger" selectable>
          {message}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <MaterialIcons name="error-outline" size={18} color={colors.danger} />
      <AppText
        variant="bodySmall"
        color="danger"
        style={styles.text}
        selectable
      >
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  text: {
    flex: 1,
  },
  plain: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
