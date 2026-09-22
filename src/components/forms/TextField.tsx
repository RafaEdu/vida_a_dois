import { useState } from "react";
import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { colors } from "../../theme";
import { inputStyles } from "./inputStyles";

export type TextFieldProps = Omit<TextInputProps, "style"> & {
  value: string;
  onChangeText: (text: string) => void;
  invalid?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Canonical single-line text input with focus/invalid states. */
export function TextField({
  value,
  onChangeText,
  invalid = false,
  onFocus,
  onBlur,
  placeholder,
  style,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...rest}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        inputStyles.base,
        focused ? inputStyles.focused : null,
        invalid ? inputStyles.invalid : null,
        style,
      ]}
    />
  );
}
