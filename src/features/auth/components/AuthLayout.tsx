import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AppText, Screen } from "../../../components/ui";
import { colors, radius, spacing } from "../../../theme";

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Shared frame for the auth screens: brand mark, headline and a scrollable
 * form that keeps the CTA above the keyboard. No bottom tabs live here.
 */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen
        scroll
        padded
        edges={["top", "left", "right", "bottom"]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.brand}>
          <View style={styles.mark}>
            <MaterialIcons name="favorite" size={22} color={colors.onPrimary} />
          </View>
          <AppText variant="h1" align="center">
            {title}
          </AppText>
          <AppText variant="body" color="textSecondary" align="center">
            {subtitle}
          </AppText>
        </View>

        <View style={styles.form}>{children}</View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
});
