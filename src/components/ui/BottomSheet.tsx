import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing } from "../../theme";
import { AppText } from "./AppText";

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Lightweight bottom sheet built on the core `Modal`. Used for short,
 * independent tasks (filters, row actions) without adding a dependency.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  style,
  testID,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <View
          testID={testID}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.lg },
            style,
          ]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <AppText variant="h3">{title}</AppText>
              {subtitle ? (
                <AppText
                  variant="bodySmall"
                  color="textSecondary"
                  numberOfLines={2}
                >
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    ...shadows.modal,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  header: {
    gap: spacing.xs,
  },
});
