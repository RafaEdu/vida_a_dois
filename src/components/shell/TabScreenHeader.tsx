import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, screenPadding, spacing } from "../../theme";
import { AppText } from "../ui";

export interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned action, usually a `Avatar`/`IconButton` pair. */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared header for the four root tab screens. It owns the top safe area so
 * tab screens do not need to handle it individually.
 */
export function TabScreenHeader({
  title,
  subtitle,
  right,
  style,
}: TabScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.base, { paddingTop: insets.top + spacing.md }, style]}>
      <View style={styles.textGroup}>
        <AppText variant="h2" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySmall" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: screenPadding.compact,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  textGroup: {
    flex: 1,
  },
  right: {
    alignItems: "center",
    justifyContent: "center",
  },
});
