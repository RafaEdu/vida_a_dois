import { StyleSheet, View } from "react-native";
import type { CoupleSplitMode } from "../../../types/domain";
import { colors, spacing } from "../../../theme";
import { AppText, Card } from "../../../components/ui";

export interface CoupleSplitProps {
  selfName: string;
  partnerName: string;
  selfShare: number;
  partnerShare: number;
  splitMode: CoupleSplitMode;
}

export function CoupleSplit({
  selfName,
  partnerName,
  selfShare,
  partnerShare,
  splitMode,
}: CoupleSplitProps) {
  return (
    <Card padded style={styles.card}>
      <AppText variant="h3">Divisão padrão</AppText>
      <AppText variant="bodySmall" color="textSecondary">
        {splitMode === "income_based"
          ? "Proporcional à renda de cada pessoa."
          : "Divisão manual definida pelo casal."}
      </AppText>

      <View style={styles.row}>
        <View style={styles.person}>
          <AppText variant="h2" color="primary" tabular>
            {selfShare}%
          </AppText>
          <AppText
            variant="bodySmall"
            color="textSecondary"
            align="center"
            numberOfLines={1}
          >
            {selfName}
          </AppText>
        </View>

        <View style={styles.divider} />

        <View style={styles.person}>
          <AppText variant="h2" color="primary" tabular>
            {partnerShare}%
          </AppText>
          <AppText
            variant="bodySmall"
            color="textSecondary"
            align="center"
            numberOfLines={1}
          >
            {partnerName}
          </AppText>
        </View>
      </View>

      <AppText variant="bodySmall" color="textSecondary">
        Para ajustar, acesse Planejamento e toque em “Editar planejamento”.
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
    paddingVertical: spacing.sm,
  },
  person: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
});
