import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing } from "../../../theme";
import { AppText } from "../../../components/ui";

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Canonical form field: micro-label, control, optional hint and error. */
export function Field({ label, hint, error, children, style }: FieldProps) {
  return (
    <View style={[styles.field, style]}>
      <AppText variant="labelCaps" color="textSecondary">
        {label}
      </AppText>
      {children}
      {error ? (
        <View style={styles.errorRow}>
          <MaterialIcons name="error-outline" size={14} color={colors.danger} />
          <AppText variant="bodySmall" color="danger" style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText variant="bodySmall" color="textSecondary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
  },
});
