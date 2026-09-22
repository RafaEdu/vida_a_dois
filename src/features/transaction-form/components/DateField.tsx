import { useState } from "react";
import { TextInput } from "react-native";
import { colors } from "../../../theme";
import { formatDateInput } from "../../../utils/date";
import { inputStyles } from "./inputStyles";

export interface DateFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  accessibilityLabel?: string;
}

/**
 * Masked ISO date input (`AAAA-MM-DD`), matching the persisted `date` format.
 * A native date picker is intentionally not added in this phase.
 */
export function DateField({
  value,
  onChangeText,
  onBlur,
  invalid = false,
  accessibilityLabel = "Data",
}: DateFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      value={value}
      onChangeText={(text) => onChangeText(formatDateInput(text))}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      keyboardType="number-pad"
      maxLength={10}
      placeholder="AAAA-MM-DD"
      placeholderTextColor={colors.textSecondary}
      accessibilityLabel={accessibilityLabel}
      style={[
        inputStyles.base,
        focused ? inputStyles.focused : null,
        invalid ? inputStyles.invalid : null,
      ]}
    />
  );
}
