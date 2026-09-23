import { Pressable, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing } from "../../../theme";
import { AppText, Avatar, Badge, Card } from "../../../components/ui";
import { getInitials } from "../../../utils/initials";
import type { Couple, PartnerInfo } from "../../../types/domain";
import { resolveRelationshipPeriod, resolveRelationshipStatus } from "../model";

interface RelationshipCardProps {
  couple: Couple;
  partner: PartnerInfo | null;
  /** Avatar do parceiro quando a imagem é acessível (vínculo ativo). */
  avatarUrl?: string | null;
  onPress: () => void;
}

/** Item do histórico de relacionamentos (atual ou encerrado), somente leitura. */
export function RelationshipCard({
  couple,
  partner,
  avatarUrl,
  onPress,
}: RelationshipCardProps) {
  const status = resolveRelationshipStatus(couple.status);
  const period = resolveRelationshipPeriod(couple);
  const partnerName = partner?.full_name?.trim() || "Parceiro";

  return (
    <Card padded={false} style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir relacionamento com ${partnerName}`}
        accessibilityHint={
          couple.status === "ended"
            ? "Abre o histórico somente leitura deste relacionamento"
            : "Abre os detalhes deste relacionamento"
        }
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <Avatar
          initials={getInitials(partner?.full_name, "??")}
          uri={avatarUrl ?? null}
          tone="primary"
          size="lg"
        />

        <View style={styles.text}>
          <AppText variant="bodySemibold" numberOfLines={1}>
            {partnerName}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary">
            {period.label}
          </AppText>
          <Badge label={status.label} tone={status.tone} />
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
    minHeight: 72,
  },
  pressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
});
