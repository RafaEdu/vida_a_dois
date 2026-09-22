import type { ComponentProps } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type ColorToken } from "../../theme";
import { AppText } from "./AppText";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "partnerA"
  | "partnerB"
  | "shared";

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const toneStyles: Record<BadgeTone, { background: string; text: ColorToken }> =
  {
    neutral: { background: colors.surfaceMuted, text: "textSecondary" },
    primary: { background: colors.primarySoft, text: "primary" },
    success: { background: colors.successSoft, text: "success" },
    warning: { background: colors.warningSoft, text: "warning" },
    danger: { background: colors.dangerSoft, text: "danger" },
    partnerA: { background: colors.partnerASoft, text: "partnerA" },
    partnerB: { background: colors.partnerBSoft, text: "partnerB" },
    shared: { background: colors.sharedSoft, text: "shared" },
  };

export function Badge({
  label,
  tone = "neutral",
  icon,
  style,
  testID,
}: BadgeProps) {
  const { background, text } = toneStyles[tone];
  const foreground = colors[text];

  return (
    <View
      testID={testID}
      style={[styles.base, { backgroundColor: background }, style]}
    >
      {icon ? <MaterialIcons name={icon} size={12} color={foreground} /> : null}
      <AppText variant="label" color={text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});
