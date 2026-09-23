import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Card } from "../../../components/ui";

/**
 * Entrada para o feed de atividade na tela Casal. Fica junto das informações
 * compartilhadas do vínculo, nunca na área individual.
 */
export function ActivityEntry() {
  return (
    <Card padded={false} style={styles.card}>
      <Pressable
        onPress={() => router.push("/activity")}
        accessibilityRole="button"
        accessibilityLabel="Atividade do casal"
        accessibilityHint="Abre o histórico de eventos compartilhados do casal"
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name="history" size={22} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <AppText variant="bodySemibold">Atividade do casal</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Eventos importantes do nosso vínculo
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
