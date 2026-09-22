import { StyleSheet, View } from "react-native";
import { AppText } from "../../../components/ui";
import { spacing } from "../../../theme";

export interface OnboardingHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional micro-label for the current onboarding step. */
  step?: string;
}

export function OnboardingHeader({
  title,
  subtitle,
  step,
}: OnboardingHeaderProps) {
  return (
    <View style={styles.header}>
      {step ? (
        <AppText variant="labelCaps" color="primary">
          {step}
        </AppText>
      ) : null}
      <AppText variant="h1" align="center" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color="textSecondary" align="center">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: spacing.sm,
  },
});
