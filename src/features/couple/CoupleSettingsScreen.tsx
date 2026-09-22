import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useCouple } from "../../providers/CoupleProvider";
import { colors, spacing } from "../../theme";
import {
  AppText,
  Button,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
} from "../../components/ui";

/**
 * "Configurações do vínculo" do casal. Concentra ajustes do relacionamento e a
 * zona sensível (encerrar vínculo), mantendo a ação destrutiva longe das ações
 * comuns da tela Casal.
 */
export function CoupleSettingsScreen() {
  const { couple } = useCouple();

  if (!couple || couple.status !== "active") {
    return (
      <Screen edges={["left", "right"]}>
        <EmptyState
          icon="link-off"
          title="Sem vínculo ativo"
          description="As configurações do vínculo ficam disponíveis apenas enquanto o casal está ativo."
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <AppText variant="bodySmall" color="textSecondary">
        Ajustes do vínculo compartilhado. O que for alterado aqui afeta as duas
        pessoas.
      </AppText>

      <View style={styles.section}>
        <SectionHeader
          title="Zona sensível"
          subtitle="Ações que afetam o vínculo por completo"
        />

        <Card variant="outline" style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <MaterialIcons name="link-off" size={20} color={colors.danger} />
            <AppText variant="bodySemibold" color="danger">
              Encerrar vínculo
            </AppText>
          </View>

          <AppText variant="bodySmall" color="textSecondary">
            Encerra o vínculo compartilhado entre você e seu parceiro. O
            histórico financeiro é preservado e cada pessoa continua com a
            própria conta.
          </AppText>

          <Button
            title="Encerrar vínculo"
            variant="danger"
            icon="link-off"
            fullWidth
            onPress={() => router.push("/end-relationship")}
            accessibilityLabel="Encerrar vínculo do casal"
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  dangerCard: {
    gap: spacing.md,
    borderColor: colors.dangerSoft,
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
