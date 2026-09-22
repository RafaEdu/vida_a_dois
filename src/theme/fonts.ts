import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { fontFamilies } from "./typography";

// Single source of truth for font loading. Loaded once from the root layout so
// that no screen needs to load fonts on its own.
export const appFontAssets = {
  [fontFamilies.jakarta.semibold]: PlusJakartaSans_600SemiBold,
  [fontFamilies.jakarta.bold]: PlusJakartaSans_700Bold,
  [fontFamilies.inter.regular]: Inter_400Regular,
  [fontFamilies.inter.medium]: Inter_500Medium,
  [fontFamilies.inter.semibold]: Inter_600SemiBold,
  [fontFamilies.inter.bold]: Inter_700Bold,
} as const;

export function useAppFonts(): [boolean, Error | null] {
  return useFonts(appFontAssets);
}
