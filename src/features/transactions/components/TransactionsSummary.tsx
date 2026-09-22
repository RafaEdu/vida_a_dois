import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Card, MoneyText } from "../../../components/ui";

export interface TransactionsSummaryProps {
  totalIncomes: number;
  totalExpenses: number;
}

/**
 * Compact period summary. Intentionally smaller than the Home hero card: the
 * transactions area is for consulting, not for a second dashboard.
 */
export function TransactionsSummary({
  totalIncomes,
  totalExpenses,
}: TransactionsSummaryProps) {
  return (
    <Card padded padding="md" style={styles.card}>
      <View style={styles.box}>
        <AppText variant="labelCaps" color="textSecondary">
          Entradas
        </AppText>
        <MoneyText
          value={totalIncomes}
          variant="bodySemibold"
          color="success"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.box}>
        <AppText variant="labelCaps" color="textSecondary">
          Saídas
        </AppText>
        <MoneyText value={totalExpenses} variant="bodySemibold" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
});
