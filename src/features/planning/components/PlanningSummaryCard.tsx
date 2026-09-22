import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { BudgetProgress } from "../../../domain/finance/selectors";
import { colors, spacing } from "../../../theme";
import { formatCurrency } from "../../../utils/currency";
import { AppText, Card, MoneyText, ProgressBar } from "../../../components/ui";

export interface PlanningSummaryCardProps {
  budget: number;
  spent: number;
  progress: BudgetProgress;
}

/**
 * Budget hero for the planning tab: consolidated spending against the monthly
 * ceiling. Values come from the existing `calculateBudgetProgress` selector.
 */
export function PlanningSummaryCard({
  budget,
  spent,
  progress,
}: PlanningSummaryCardProps) {
  const hasBudget = budget > 0;
  const overBudget = progress.remaining < 0;
  const tone = overBudget
    ? "danger"
    : progress.percentage >= 80
      ? "warning"
      : "primary";

  return (
    <Card padded style={styles.card}>
      <AppText variant="labelCaps" color="textSecondary">
        Gasto consolidado
      </AppText>
      <MoneyText
        value={spent}
        variant="display"
        accessibilityLabel={`Gasto consolidado: ${formatCurrency(spent)}`}
      />
      <AppText variant="bodySmall" color="textSecondary">
        {hasBudget
          ? `de ${formatCurrency(budget)}`
          : "Sem teto definido para este mês"}
      </AppText>

      {hasBudget ? (
        <View style={styles.progressBlock}>
          <ProgressBar
            value={progress.percentage / 100}
            tone={tone}
            accessibilityLabel={`Teto consumido: ${Math.round(
              progress.percentage,
            )}%`}
          />
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <MaterialIcons
                name={overBudget ? "error-outline" : "check-circle"}
                size={16}
                color={overBudget ? colors.danger : colors.success}
              />
              <AppText
                variant="bodySmall"
                color={overBudget ? "danger" : "textSecondary"}
              >
                {overBudget
                  ? `${formatCurrency(Math.abs(progress.remaining))} acima do teto`
                  : `${formatCurrency(progress.remaining)} disponíveis`}
              </AppText>
            </View>
            <AppText variant="bodySmallMedium" color="textSecondary" tabular>
              {Math.round(progress.percentage)}%
            </AppText>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  progressBlock: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statusLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
