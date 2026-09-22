import type { TextStyle } from "react-native";

// Font family names. Values must match the keys loaded in `src/theme/fonts.ts`
// (`Plus Jakarta Sans` for titles/metrics, `Inter` for body/forms).
export const fontFamilies = {
  jakarta: {
    semibold: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
  },
  inter: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
} as const;

export type TypographyVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyMedium"
  | "bodySemibold"
  | "bodySmall"
  | "bodySmallMedium"
  | "label"
  | "labelCaps";

// Weight is embedded in the loaded font file, so we intentionally omit
// `fontWeight` to avoid Android falling back to a synthetic weight.
export const typography: Record<TypographyVariant, TextStyle> = {
  display: {
    fontFamily: fontFamilies.jakarta.bold,
    fontSize: 32,
    lineHeight: 38,
  },
  h1: { fontFamily: fontFamilies.jakarta.bold, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fontFamilies.jakarta.bold, fontSize: 20, lineHeight: 26 },
  h3: {
    fontFamily: fontFamilies.jakarta.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilies.inter.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamilies.inter.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemibold: {
    fontFamily: fontFamilies.inter.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fontFamilies.inter.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmallMedium: {
    fontFamily: fontFamilies.inter.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: fontFamilies.inter.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
  labelCaps: {
    fontFamily: fontFamilies.inter.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
};
