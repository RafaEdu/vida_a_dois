import { StyleSheet } from "react-native";
import { colors, fontFamilies, radius, spacing } from "../../theme";

// Canonical text input surface shared by auth/onboarding/couple forms.
// Screens may extend it through the `style` prop of each field component.
export const inputStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
    fontFamily: fontFamilies.inter.medium,
    fontSize: 16,
    color: colors.text,
  },
  focused: {
    borderColor: colors.primary,
  },
  invalid: {
    borderColor: colors.danger,
  },
  // Hero currency input used by the transaction forms.
  amount: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 72,
    fontFamily: fontFamilies.jakarta.bold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
  },
});
