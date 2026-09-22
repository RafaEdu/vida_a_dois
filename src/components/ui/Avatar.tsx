import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, type ColorToken } from "../../theme";
import { AppText } from "./AppText";

export type AvatarTone = "primary" | "partnerA" | "partnerB" | "neutral";
export type AvatarSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface AvatarProps {
  initials: string;
  /** Optional image source. Falls back to initials when missing or on error. */
  uri?: string | null;
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
  "2xl": 96,
};

const textVariant: Record<
  AvatarSize,
  "label" | "bodySmallMedium" | "bodyMedium" | "h3" | "h2"
> = {
  sm: "label",
  md: "bodySmallMedium",
  lg: "bodyMedium",
  xl: "h3",
  "2xl": "h2",
};

const toneStyles: Record<AvatarTone, { background: string; text: ColorToken }> =
  {
    primary: { background: colors.primarySoft, text: "primary" },
    partnerA: { background: colors.partnerASoft, text: "onPartnerASoft" },
    partnerB: { background: colors.partnerBSoft, text: "partnerB" },
    neutral: { background: colors.surfaceMuted, text: "textSecondary" },
  };

export function Avatar({
  initials,
  uri,
  tone = "primary",
  size = "md",
  onPress,
  accessibilityLabel,
  style,
  testID,
}: AvatarProps) {
  const dimension = dimensions[size];
  const toneStyle = toneStyles[tone];
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const showImage = Boolean(uri) && uri !== failedUri;

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
      {showImage ? (
        <Image
          source={{ uri: uri as string }}
          style={{
            width: dimension,
            height: dimension,
            borderRadius: radius.full,
          }}
          onError={() => setFailedUri(uri ?? null)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <AppText variant={textVariant[size]} color={toneStyle.text}>
          {initials}
        </AppText>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
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
