import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { spacing } from "../../theme";
import { AppText } from "./AppText";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Simple text action rendered on the right. */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Custom action node (takes precedence over `actionLabel`). */
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  action,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.base, style]}>
      <View style={styles.textGroup}>
        <AppText variant="h3">{title}</AppText>
        {subtitle ? (
          <AppText
            variant="bodySmall"
            color="textSecondary"
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {action ??
        (actionLabel ? (
          <Pressable
            onPress={onActionPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            style={({ pressed }) => (pressed ? styles.pressed : null)}
          >
            <AppText variant="bodySmallMedium" color="primary">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  textGroup: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
