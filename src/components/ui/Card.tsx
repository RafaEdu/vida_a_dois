import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import {
  colors,
  radius,
  shadows,
  spacing,
  type SpacingToken,
} from "../../theme";

export type CardVariant = "default" | "subtle" | "outline" | "inverse";

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  /** Apply default inner padding. Defaults to true. */
  padded?: boolean;
  /** Padding token used when `padded` is true. Defaults to `lg`. */
  padding?: SpacingToken;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  subtle: {
    backgroundColor: colors.surfaceSubtle,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  inverse: {
    backgroundColor: colors.primaryDark,
    ...shadows.card,
  },
};

export function Card({
  children,
  variant = "default",
  padded = true,
  padding = "lg",
  style,
  testID,
}: CardProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        variantStyles[variant],
        padded ? { padding: spacing[padding] } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
  },
});
