import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../../../theme";
import { AppText, Card } from "../../../components/ui";

export interface CoupleSplitProps {
  selfName: string;
  partnerName: string;
  splitA: number;
  splitB: number;
}

export function CoupleSplit({
  selfName,
  partnerName,
  splitA,
  splitB,
}: CoupleSplitProps) {
  return (
    <Card padded style={styles.card}>
      <AppText variant="h3">Divisão padrão</AppText>
      <AppText variant="bodySmall" color="textSecondary">
        Proporção usada para dividir os custos do casal.
      </AppText>

      <View style={styles.row}>
        <View style={styles.person}>
          <AppText variant="h2" color="primary" tabular>
            {splitA}%
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
            {splitB}%
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
