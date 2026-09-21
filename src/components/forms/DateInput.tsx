import { TextInput, type TextInputProps } from "react-native";
import { C } from "../../theme/colors";
import { formStyles } from "../../styles/forms";
import { formatBirthDateInput, formatDateInput } from "../../utils/date";

type DateInputProps = Omit<
  TextInputProps,
  "value" | "onChangeText" | "keyboardType" | "maxLength"
> & {
  value: string;
  onChangeText: (text: string) => void;
  variant?: "iso" | "br";
};

export function DateInput({
  value,
  onChangeText,
  variant = "iso",
  style,
  placeholder,
  ...rest
}: DateInputProps) {
  const handleChange = (text: string) => {
    onChangeText(
      variant === "br" ? formatBirthDateInput(text) : formatDateInput(text),
    );
  };

  return (
    <TextInput
      style={[formStyles.input, style]}
      value={value}
      onChangeText={handleChange}
      keyboardType="number-pad"
      maxLength={10}
      placeholder={
        placeholder ?? (variant === "br" ? "DD/MM/AAAA" : "AAAA-MM-DD")
      }
      placeholderTextColor={C.outlineVariant}
      {...rest}
    />
  );
}
