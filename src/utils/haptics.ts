import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Haptics are a progressive enhancement: unsupported platforms (web/tv) and
// hardware without a vibrator should never break the interaction.
function supportsHaptics(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/** Light confirmation after a successful action (create, save, close). */
export async function hapticSuccess(): Promise<void> {
  if (!supportsHaptics()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Best-effort only.
  }
}

/** Subtle tick for a relevant selection (e.g. choosing a transaction type). */
export async function hapticSelection(): Promise<void> {
  if (!supportsHaptics()) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Best-effort only.
  }
}
