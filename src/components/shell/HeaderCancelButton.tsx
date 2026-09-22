import { Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { spacing } from "../../theme";
import { AppText } from "../ui";

export interface HeaderCancelButtonProps {
  label?: string;
}

/**
 * Navigation-managed cancel action for modal/stack headers. Replaces the
 * artisanal back buttons that used to live inside the screens.
 */
export function HeaderCancelButton({
  label = "Cancelar",
}: HeaderCancelButtonProps) {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.base, pressed ? styles.pressed : null]}
    >
      <AppText variant="bodyMedium" color="primary">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
