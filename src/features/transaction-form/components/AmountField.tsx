import { useState } from "react";
import { TextInput } from "react-native";
import { colors } from "../../../theme";
import { formatCurrencyInput } from "../../../utils/currency";
import { inputStyles } from "./inputStyles";

export interface AmountFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
}

/** Hero currency input: masked BRL value shown with the display type scale. */
export function AmountField({
  value,
  onChangeText,
  onBlur,
  invalid = false,
  autoFocus = false,
  accessibilityLabel = "Valor",
}: AmountFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      value={value}
      onChangeText={(text) => onChangeText(formatCurrencyInput(text))}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      keyboardType="number-pad"
      placeholder="R$ 0,00"
      placeholderTextColor={colors.textSecondary}
      accessibilityLabel={accessibilityLabel}
      autoFocus={autoFocus}
      style={[
        inputStyles.amount,
        focused ? inputStyles.focused : null,
        invalid ? inputStyles.invalid : null,
      ]}
    />
  );
}
