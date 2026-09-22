import { useEffect, useState, type ComponentProps } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  maxContentWidth,
  minTouchTarget,
  radius,
  shadows,
  spacing,
} from "../../theme";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { hapticSelection } from "../../utils/haptics";
import { AppText } from "../ui";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

interface ActionRowProps {
  icon: IconName;
  label: string;
  description: string;
  onPress: () => void;
}

function ActionRow({ icon, label, description, onPress }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.rowIcon}>
        <MaterialIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="bodySemibold">{label}</AppText>
        <AppText variant="bodySmall" color="textSecondary">
          {description}
        </AppText>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

/**
 * Global "new transaction" floating action button. It is a single action, not
 * a fifth tab, and offers only the transaction types the domain supports.
 */
export function GlobalFab() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const [open, setOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const goTo = (href: "/expense/new" | "/income/new") => {
    setOpen(false);
    void hapticSelection();
    router.push(href);
  };

  const hidden = keyboardVisible;
  const fabRight =
    width > maxContentWidth
      ? (width - maxContentWidth) / 2 + spacing.lg
      : spacing.lg;

  return (
    <>
      <View
        pointerEvents={hidden ? "none" : "box-none"}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Novo lançamento"
          style={({ pressed }) => [
            styles.fab,
            { bottom: insets.bottom + 64, right: fabRight },
            hidden ? styles.fabHidden : null,
            pressed ? styles.fabPressed : null,
          ]}
        >
          <MaterialIcons name="add" size={28} color={colors.onPrimary} />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType={reduceMotion ? "none" : "fade"}
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={styles.handle} />
            <AppText variant="h3" style={styles.sheetTitle}>
              Novo lançamento
            </AppText>

            <ActionRow
              icon="arrow-upward"
              label="Despesa"
              description="Registrar um gasto do casal"
              onPress={() => goTo("/expense/new")}
            />
            <ActionRow
              icon="arrow-downward"
              label="Receita"
              description="Registrar uma entrada ou salário"
              onPress={() => goTo("/income/new")}
            />

            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              style={({ pressed }) => [
                styles.cancel,
                pressed ? styles.cancelPressed : null,
              ]}
            >
              <AppText variant="bodySemibold" color="textSecondary">
                Cancelar
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.floating,
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabHidden: {
    opacity: 0,
  },
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
    ...shadows.modal,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: minTouchTarget,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  cancel: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: minTouchTarget,
    marginTop: spacing.sm,
  },
  cancelPressed: {
    opacity: 0.7,
  },
});
