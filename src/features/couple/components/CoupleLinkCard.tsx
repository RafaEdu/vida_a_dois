import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../../../theme";
import { AppText, Card } from "../../../components/ui";
import { formatDateFromTimestamp } from "../../../utils/date";

export interface CoupleLinkCardProps {
  statusLabel: string;
  linkedAt: string | null;
}

export function CoupleLinkCard({ statusLabel, linkedAt }: CoupleLinkCardProps) {
  const linkedDate = formatDateFromTimestamp(linkedAt);

  return (
    <Card padded style={styles.card}>
      <AppText variant="h3">Vínculo</AppText>

      <View style={styles.row}>
        <AppText variant="bodySmall" color="textSecondary">
          Status
        </AppText>
        <AppText variant="bodySmallMedium">{statusLabel}</AppText>
      </View>

      {linkedDate ? (
        <>
          <View style={styles.separator} />
          <View style={styles.row}>
            <AppText variant="bodySmall" color="textSecondary">
              Vinculados em
            </AppText>
            <AppText variant="bodySmallMedium">{linkedDate}</AppText>
          </View>
        </>
      ) : null}

      <View style={styles.separator} />

      <AppText variant="bodySmall" color="textSecondary">
        O vínculo conecta as duas contas para compartilhar despesas, receitas e
        o caixa comum do casal.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
