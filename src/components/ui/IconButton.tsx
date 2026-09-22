import type { ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, minTouchTarget, radius } from "../../theme";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

export type IconButtonVariant = "ghost" | "soft" | "solid" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps {
  /** Material icon name. */
  icon: IconName;
  onPress?: () => void;
  /** Required for accessibility since the button has no visible label. */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const dimensions: Record<IconButtonSize, number> = {
  sm: 36,
  md: minTouchTarget,
  lg: 52,
};

const iconSizes: Record<IconButtonSize, number> = {
  sm: 18,
  md: 22,
  lg: 26,
};

const variantStyles: Record<IconButtonVariant, ViewStyle> = {
  ghost: { backgroundColor: "transparent" },
  soft: { backgroundColor: colors.surfaceSubtle },
  solid: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.dangerSoft },
};

const foregroundColor: Record<IconButtonVariant, string> = {
  ghost: colors.text,
  soft: colors.primary,
  solid: colors.onPrimary,
  danger: colors.danger,
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = "ghost",
  size = "md",
  disabled = false,
  selected = false,
  style,
  testID,
}: IconButtonProps) {
  const dimension = dimensions[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      hitSlop={size === "sm" ? 4 : 0}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius.full,
        },
        variantStyles[variant],
        selected ? styles.selected : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={iconSizes[size]}
        color={foregroundColor[variant]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
