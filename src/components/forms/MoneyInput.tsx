import { TextInput, type TextInputProps } from "react-native";
import { C } from "../../theme/colors";
import { formStyles } from "../../styles/forms";
import { formatCurrencyInput } from "../../utils/currency";

type MoneyInputProps = Omit<
  TextInputProps,
  "value" | "onChangeText" | "keyboardType"
> & {
  value: string;
  onChangeText: (text: string) => void;
  variant?: "decimal" | "currency";
};

export function MoneyInput({
  value,
  onChangeText,
  variant = "decimal",
  style,
  placeholder,
  ...rest
}: MoneyInputProps) {
  const handleChange = (text: string) => {
    onChangeText(variant === "currency" ? formatCurrencyInput(text) : text);
  };

  return (
    <TextInput
      style={[formStyles.input, style]}
      value={value}
      onChangeText={handleChange}
      keyboardType={variant === "currency" ? "number-pad" : "decimal-pad"}
      placeholder={placeholder ?? (variant === "currency" ? "R$ 0,00" : "0,00")}
      placeholderTextColor={C.outlineVariant}
      {...rest}
    />
  );
}
