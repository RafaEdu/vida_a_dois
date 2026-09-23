import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Card } from "../../../components/ui";

/**
 * Entrada individual para o histórico de relacionamentos. Fica na área do
 * perfil porque o histórico pertence à pessoa, não apenas ao vínculo atual.
 */
export function RelationshipHistoryEntry() {
  return (
    <Card padded={false} style={styles.card}>
      <Pressable
        onPress={() => router.push("/relationship-history")}
        accessibilityRole="button"
        accessibilityLabel="Histórico de relacionamentos"
        accessibilityHint="Abre seus vínculos atuais e encerrados"
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name="diversity-3" size={22} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <AppText variant="bodySemibold">Histórico de relacionamentos</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Vínculos atuais e encerrados, somente leitura
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
