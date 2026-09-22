import type { ComponentProps } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing } from "../../theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  description,
  icon = "inbox",
  actionLabel,
  onActionPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.base, style]}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={icon} size={28} color={colors.primary} />
      </View>
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText
          variant="bodySmall"
          color="textSecondary"
          align="center"
          style={styles.description}
        >
          {description}
        </AppText>
      ) : null}
      {actionLabel && onActionPress ? (
        <Button
          title={actionLabel}
          onPress={onActionPress}
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
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.sm,
  },
  description: {
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.md,
  },
});
