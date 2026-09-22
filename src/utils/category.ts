import type { ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";

export type CategoryIconName = ComponentProps<typeof MaterialIcons>["name"];

/**
 * Maps a category label to a Material icon. Kept intentionally simple so the
 * same iconography is reused across Home, Transactions and forms.
 */
export function getCategoryIcon(category: string): CategoryIconName {
  const lower = category.toLowerCase();

  if (
    lower.includes("aluguel") ||
    lower.includes("financiamento") ||
    lower.includes("condomínio")
  ) {
    return "home";
  }
  if (
    lower.includes("supermercado") ||
    lower.includes("alimentação") ||
    lower.includes("mercado") ||
    lower.includes("restaurante")
  ) {
    return "shopping-cart";
  }
  if (lower.includes("transporte") || lower.includes("combustível")) {
    return "local-gas-station";
  }
  if (
    lower.includes("saúde") ||
    lower.includes("farmácia") ||
    lower.includes("plano")
  ) {
    return "local-hospital";
  }
  if (lower.includes("streaming") || lower.includes("internet")) {
    return "wifi";
  }
  if (
    lower.includes("energia") ||
    lower.includes("água") ||
    lower.includes("gás")
  ) {
    return "bolt";
  }
  if (lower.includes("lazer") || lower.includes("entretenimento")) {
    return "celebration";
  }
  if (lower.includes("educação")) return "school";
  if (lower.includes("vestuário")) return "checkroom";
  if (lower.includes("pet")) return "pets";

  return "receipt";
}
