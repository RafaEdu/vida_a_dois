import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, type ColorToken } from "../../theme";
import { AppText } from "./AppText";

export type AvatarTone = "primary" | "partnerA" | "partnerB" | "neutral";
export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  initials: string;
  tone?: AvatarTone;
  size?: AvatarSize;
  /** When provided the avatar becomes an accessible button. */
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const dimensions: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const textVariant: Record<
  AvatarSize,
  "label" | "bodySmallMedium" | "bodyMedium" | "h3"
> = {
  sm: "label",
  md: "bodySmallMedium",
  lg: "bodyMedium",
  xl: "h3",
};

const toneStyles: Record<
  AvatarTone,
  { background: string; text: ColorToken }
> = {
  primary: { background: colors.primarySoft, text: "primary" },
  partnerA: { background: colors.partnerASoft, text: "partnerA" },
  partnerB: { background: colors.partnerBSoft, text: "partnerB" },
  neutral: { background: colors.surfaceMuted, text: "textSecondary" },
};

export function Avatar({
  initials,
  tone = "primary",
  size = "md",
  onPress,
  accessibilityLabel,
  style,
  testID,
}: AvatarProps) {
  const dimension = dimensions[size];
  const toneStyle = toneStyles[tone];

  const content = (
    <View
      testID={testID}
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius.full,
          backgroundColor: toneStyle.background,
        },
        style,
      ]}
    >
      <AppText variant={textVariant[size]} color={toneStyle.text}>
        {initials}
      </AppText>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? "Avatar"}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
});
