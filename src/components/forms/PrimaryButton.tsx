import type { ComponentProps } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "../ui";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /**
   * Kept for the legacy call sites that still pass them. State feedback is now
   * handled by the canonical `Button`, so these are intentionally ignored.
   */
  disabledStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  icon,
  style,
  textStyle,
}: PrimaryButtonProps) {
  return (
    <Button
      title={title}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      fullWidth
      style={style}
      textStyle={textStyle}
    />
  );
}
