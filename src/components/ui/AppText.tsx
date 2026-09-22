import { Text, type TextProps, type TextStyle } from "react-native";
import {
  colors,
  typography,
  type ColorToken,
  type TypographyVariant,
} from "../../theme";

export interface AppTextProps extends TextProps {
  /** Typographic scale variant. Defaults to `body`. */
  variant?: TypographyVariant;
  /** Semantic color token. Defaults to `text`. */
  color?: ColorToken;
  align?: TextStyle["textAlign"];
  /** Tabular figures for financial/percentage values. */
  tabular?: boolean;
  /** Uppercase micro-labels. */
  caps?: boolean;
}

export function AppText({
  variant = "body",
  color = "text",
  align,
  tabular = false,
  caps = false,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: colors[color] },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ["tabular-nums"] } : null,
        caps ? { textTransform: "uppercase" } : null,
        style,
      ]}
    />
  );
}
