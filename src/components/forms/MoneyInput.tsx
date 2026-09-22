import { TextInput, type TextInputProps } from "react-native";
import { colors } from "../../theme";
import { formatCurrencyInput } from "../../utils/currency";
import { inputStyles } from "./inputStyles";

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
      style={[inputStyles.base, style]}
      value={value}
      onChangeText={handleChange}
      keyboardType={variant === "currency" ? "number-pad" : "decimal-pad"}
      placeholder={placeholder ?? (variant === "currency" ? "R$ 0,00" : "0,00")}
      placeholderTextColor={colors.textSecondary}
      {...rest}
    />
  );
}
