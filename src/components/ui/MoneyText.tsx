import type { StyleProp, TextStyle } from "react-native";
import { formatCurrency } from "../../utils/currency";
import type { ColorToken, TypographyVariant } from "../../theme";
import { AppText } from "./AppText";

export interface MoneyTextProps {
  value: number | null | undefined;
  variant?: TypographyVariant;
  color?: ColorToken;
  /** Force a leading `+`/`-` sign. Defaults to `auto`. */
  signed?: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function MoneyText({
  value,
  variant = "bodyMedium",
  color = "text",
  signed = false,
  style,
  accessibilityLabel,
}: MoneyTextProps) {
  const formatted = formatCurrency(value);
  const text = signed ? withSign(formatted, value) : formatted;

  return (
    <AppText
      variant={variant}
      color={color}
      tabular
      style={style}
      accessibilityLabel={accessibilityLabel ?? text}
    >
      {text}
    </AppText>
  );
}

function withSign(formatted: string, value: number | null | undefined): string {
  if (value == null || value === 0) return formatted;
  return value > 0 ? `+${formatted}` : formatted;
}
