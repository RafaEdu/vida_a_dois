import { useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { colors } from "../../theme";
import { formatBirthDateInput, formatDateInput } from "../../utils/date";
import { inputStyles } from "./inputStyles";

type DateInputProps = Omit<
  TextInputProps,
  "value" | "onChangeText" | "keyboardType" | "maxLength"
> & {
  value: string;
  onChangeText: (text: string) => void;
  variant?: "iso" | "br";
  invalid?: boolean;
};

export function DateInput({
  value,
  onChangeText,
  variant = "iso",
  invalid = false,
  style,
  placeholder,
  onFocus,
  onBlur,
  ...rest
}: DateInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    onChangeText(
      variant === "br" ? formatBirthDateInput(text) : formatDateInput(text),
    );
  };

  return (
    <TextInput
      style={[
        inputStyles.base,
        focused ? inputStyles.focused : null,
        invalid ? inputStyles.invalid : null,
        style,
      ]}
      value={value}
      onChangeText={handleChange}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      keyboardType="number-pad"
      maxLength={10}
      placeholder={
        placeholder ?? (variant === "br" ? "DD/MM/AAAA" : "AAAA-MM-DD")
      }
      placeholderTextColor={colors.textSecondary}
      {...rest}
    />
  );
}
