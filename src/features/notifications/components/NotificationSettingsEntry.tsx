import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Card } from "../../../components/ui";

/**
 * Entrada individual para as preferências de notificação. Fica na área do
 * perfil porque a configuração é por pessoa, não do casal.
 */
export function NotificationSettingsEntry() {
  return (
    <Card padded={false} style={styles.card}>
      <Pressable
        onPress={() => router.push("/notification-settings")}
        accessibilityRole="button"
        accessibilityLabel="Notificações"
        accessibilityHint="Abre suas preferências de notificação"
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons
            name="notifications-none"
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.text}>
          <AppText variant="bodySemibold">Notificações</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Lembretes e avisos no seu aparelho
          </AppText>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={colors.textSecondary}
        />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    minHeight: 64,
  },
  pressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
