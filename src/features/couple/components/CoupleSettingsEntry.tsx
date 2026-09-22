import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Card } from "../../../components/ui";

/**
 * Entrada para "Configurações do vínculo" na tela Casal. Fica separada das
 * demais ações para que a zona sensível (encerrar) não fique ao lado de ações
 * comuns.
 */
export function CoupleSettingsEntry() {
  return (
    <Card padded={false} style={styles.card}>
      <Pressable
        onPress={() => router.push("/couple-settings")}
        accessibilityRole="button"
        accessibilityLabel="Configurações do vínculo"
        accessibilityHint="Abre as opções do vínculo do casal"
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name="settings" size={22} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <AppText variant="bodySemibold">Configurações do vínculo</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Ajustes e opções do casal
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
