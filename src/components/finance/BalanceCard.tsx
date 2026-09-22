import { StyleSheet, View } from "react-native";
import type {
  BudgetProgress,
  MonthlySummary,
} from "../../domain/finance/selectors";
import { formatCurrency } from "../../utils/currency";
import { colors, radius, spacing } from "../../theme";
import { AppText, Card, MoneyText, ProgressBar } from "../ui";

export interface BalanceCardProps {
  summary: MonthlySummary;
  progress: BudgetProgress;
}

/**
 * Hero card for the Home dashboard. Purely presentational: totals and budget
 * progress are computed by the existing finance selectors outside this card.
 */
export function BalanceCard({ summary, progress }: BalanceCardProps) {
  const hasBudget = summary.budget > 0;
  const overBudget = progress.remaining < 0;
  const tone = overBudget
    ? "danger"
    : progress.percentage >= 80
      ? "warning"
      : "primary";

  return (
    <Card variant="inverse" padded style={styles.card}>
      <AppText variant="labelCaps" color="onPrimary" style={styles.eyebrow}>
        Saldo conjunto livre
      </AppText>
      <MoneyText
        value={summary.balance}
        variant="display"
        color="onPrimary"
        accessibilityLabel={`Saldo conjunto livre: ${formatCurrency(summary.balance)}`}
      />

      <View style={styles.totalsRow}>
        <View style={styles.totalBox}>
          <AppText variant="labelCaps" color="onPrimary" style={styles.eyebrow}>
            Entradas
          </AppText>
          <MoneyText
            value={summary.totalIncomes}
            variant="bodySemibold"
            color="onPrimary"
          />
        </View>
        <View style={styles.totalBox}>
          <AppText variant="labelCaps" color="onPrimary" style={styles.eyebrow}>
            Saídas
          </AppText>
          <MoneyText
            value={summary.totalExpenses}
            variant="bodySemibold"
            color="onPrimary"
          />
        </View>
      </View>

      <View style={styles.progressBlock}>
        {hasBudget ? (
          <>
            <View style={styles.progressHeader}>
              <AppText variant="bodySmallMedium" color="onPrimary">
                Teto consumido
              </AppText>
              <AppText variant="bodySmallMedium" color="onPrimary" tabular>
                {Math.round(progress.percentage)}%
              </AppText>
            </View>
            <ProgressBar
              value={progress.percentage / 100}
              tone={tone}
              accessibilityLabel={`Teto consumido: ${Math.round(progress.percentage)}%`}
            />
            <AppText
              variant="bodySmall"
              color="onPrimary"
              style={styles.remaining}
            >
              {overBudget
                ? `${formatCurrency(Math.abs(progress.remaining))} acima do teto`
                : `${formatCurrency(progress.remaining)} disponíveis`}
            </AppText>
          </>
        ) : (
          <AppText
            variant="bodySmall"
            color="onPrimary"
            style={styles.remaining}
          >
            Sem teto definido para este mês
          </AppText>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  eyebrow: {
    opacity: 0.75,
  },
  totalsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  totalBox: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.onPrimaryOverlay,
  },
  progressBlock: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  remaining: {
    opacity: 0.85,
  },
});
