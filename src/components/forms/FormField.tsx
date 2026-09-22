import type { ReactNode } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing } from "../../theme";
import { AppText } from "../ui";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  /** Helper text shown when there is no error. */
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
}

/** Canonical form field: micro-label, control, optional hint and error. */
export function FormField({
  label,
  children,
  error,
  hint,
  containerStyle,
  labelStyle,
  errorStyle,
}: FormFieldProps) {
  return (
    <View style={[styles.field, containerStyle]}>
      <AppText variant="labelCaps" color="textSecondary" style={labelStyle}>
        {label}
      </AppText>
      {children}
      {error ? (
        <View style={styles.errorRow}>
          <MaterialIcons name="error-outline" size={14} color={colors.danger} />
          <AppText
            variant="bodySmall"
            color="danger"
            style={[styles.errorText, errorStyle]}
            selectable
          >
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
