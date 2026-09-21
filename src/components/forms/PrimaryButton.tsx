import type { ComponentProps } from "react";
import {
  Pressable,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { formStyles } from "../../styles/forms";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
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
  disabledStyle,
  pressedStyle,
}: PrimaryButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      style={({ pressed }) => [
        formStyles.button,
        style,
        isDisabled && (disabledStyle ?? formStyles.buttonDisabled),
        pressed && (pressedStyle ?? formStyles.buttonPressed),
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {icon ? (
        <MaterialIcons name={icon} size={20} color={C.onPrimary} />
      ) : null}
      <Text style={[formStyles.buttonText, textStyle]}>{title}</Text>
    </Pressable>
  );
}
