import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import type { CloseMonthResult } from "../../types/domain";
import { formatCurrency } from "../../utils/currency";
import { getCurrentYearMonth } from "../../utils/date";
import {
  calculateMonthlySummary,
  compareMonthlySummaryWithCloseResult,
  selectExpensesByMonth,
  selectIncomesByMonth,
} from "../../domain/finance/selectors";
import { colors, maxContentWidth, screenPadding, spacing } from "../../theme";
import { hapticSuccess } from "../../utils/haptics";
import { AppText, Button, Card, SectionHeader } from "../../components/ui";

export function MonthlyClosingScreen() {
  const { couple, expenses, incomes, closeMonth } = useAuth();
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState<CloseMonthResult | null>(null);
  const [error, setError] = useState("");

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);

  const alreadyClosed = couple?.last_closed_month === currentYearMonth;

  const summary = useMemo(() => {
    const monthExpenses = selectExpensesByMonth(expenses, currentYearMonth);
    const monthIncomes = selectIncomesByMonth(incomes, currentYearMonth);
    const totals = calculateMonthlySummary(
      expenses,
      incomes,
      currentYearMonth,
      couple?.monthly_budget ?? 0,
    );

    return {
      ...totals,
      sharedBalance: couple?.shared_balance ?? 0,
      monthExpenses,
      monthIncomes,
    };
  }, [expenses, incomes, couple, currentYearMonth]);

  const handleCloseMonth = async () => {
    if (closing) return;
    setError("");
    setClosing(true);
    try {
      const { error: closeError, result: closeResult } = await closeMonth();

      if (closeError) {
        setError(closeError);
      } else if (closeResult) {
        setResult(closeResult);
        void hapticSuccess();

        const divergences = compareMonthlySummaryWithCloseResult(
          summary,
          closeResult,
        );
        if (__DEV__ && divergences.length > 0) {
          console.warn(
            "Divergência entre o resumo do cliente e close_month:",
            divergences,
          );
        }
      }
    } catch {
      setError("Erro inesperado ao fechar o mês.");
    } finally {
      setClosing(false);
    }
  };

  const monthName = useMemo(
    () => formatMonthName(currentYearMonth),
    [currentYearMonth],
  );

  const projectedBalance = summary.sharedBalance + summary.balance;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="bodySmall" color="textSecondary">
        Resumo financeiro de {monthName}
      </AppText>

      {error ? (
        <Card variant="subtle" padded style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={18} color={colors.danger} />
          <AppText variant="bodySmall" color="danger" style={styles.errorText}>
            {error}
          </AppText>
        </Card>
      ) : null}

      {alreadyClosed ? (
        <Card variant="subtle" padded style={styles.noticeCard}>
          <MaterialIcons name="info-outline" size={18} color={colors.warning} />
          <View style={styles.noticeText}>
            <AppText variant="bodySmallMedium" color="onWarningSoft">
              Mês já consolidado
            </AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Este mês já foi consolidado e o saldo foi integrado ao Caixa
              Comum.
            </AppText>
          </View>
        </Card>
      ) : null}

      {result ? (
        <Card variant="subtle" padded style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <MaterialIcons
              name="check-circle"
              size={20}
              color={colors.success}
            />
            <AppText variant="h3" color="onSuccessSoft">
              Mês fechado!
            </AppText>
          </View>

          <InfoRow
            label="Receitas do mês"
            value={formatCurrency(result.total_incomes)}
          />
          <InfoRow
            label="Despesas do mês"
            value={formatCurrency(result.total_expenses)}
          />

          <View style={styles.divider} />

          <InfoRow
            label="Saldo do mês"
            value={formatCurrency(result.month_delta)}
            emphasis
            valueColor={result.month_delta >= 0 ? "success" : "danger"}
          />

          <View style={styles.divider} />

          <InfoRow
            label="Saldo anterior do caixa"
            value={formatCurrency(result.shared_balance_before)}
          />
          <InfoRow
            label="Novo saldo do caixa comum"
            value={formatCurrency(result.shared_balance_after)}
            emphasis
            valueColor="primary"
          />
        </Card>
      ) : null}

      <Card padded style={styles.summaryCard}>
        <AppText variant="h3">Resumo de {monthName}</AppText>

        <InfoRow
          label="Receitas"
          value={formatCurrency(summary.totalIncomes)}
          valueColor="success"
        />
        <InfoRow
          label="Despesas"
          value={formatCurrency(summary.totalExpenses)}
          valueColor="danger"
        />
        <InfoRow
          label="Orçamento mensal"
          value={formatCurrency(summary.budget)}
        />

        <View style={styles.divider} />

        <InfoRow
          label="Saldo do mês"
          value={formatCurrency(summary.balance)}
          emphasis
          valueColor={summary.balance >= 0 ? "success" : "danger"}
        />

        <View style={styles.divider} />

        <InfoRow
          label="Caixa comum atual"
          value={formatCurrency(summary.sharedBalance)}
          valueColor="primary"
        />

        {summary.balance !== 0 ? (
          <AppText
            variant="bodySmall"
            color="textSecondary"
            align="center"
            style={styles.projection}
          >
            Ao fechar, o caixa comum será de {formatCurrency(projectedBalance)}
          </AppText>
        ) : null}
      </Card>

      {summary.monthIncomes.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Receitas do mês" />
          <Card padded padding="md" style={styles.listCard}>
            {summary.monthIncomes.map((income, index) => (
              <View
                key={income.id}
                style={index > 0 ? styles.listDivider : undefined}
              >
                <ListRow
                  title={income.description}
                  tag={income.is_extra ? "Extra" : "Salário"}
                  amount={formatCurrency(income.amount)}
                  amountColor="success"
                />
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {summary.monthExpenses.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Despesas do mês" />
          <Card padded padding="md" style={styles.listCard}>
            {summary.monthExpenses.map((expense, index) => (
              <View
                key={expense.id}
                style={index > 0 ? styles.listDivider : undefined}
              >
                <ListRow
                  title={expense.description}
                  tag={expense.category}
                  amount={formatCurrency(expense.amount)}
                  amountColor="danger"
                />
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {!result && !alreadyClosed ? (
        <Button
          title="Fechar mês"
          icon="event-available"
          loading={closing}
          onPress={handleCloseMonth}
          fullWidth
        />
      ) : null}
    </ScrollView>
  );
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

function formatMonthName(yearMonth: string): string {
  const name = MONTH_NAMES[Number(yearMonth.slice(5)) - 1];
  return name ?? "";
}

interface InfoRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
  valueColor?: "text" | "textSecondary" | "success" | "danger" | "primary";
}

function InfoRow({
  label,
  value,
  emphasis = false,
  valueColor = "text",
}: InfoRowProps) {
  return (
    <View style={styles.row}>
      <AppText
        variant="bodySmall"
        color="textSecondary"
        style={styles.rowLabel}
      >
        {label}
      </AppText>
      <AppText
        variant={emphasis ? "bodySemibold" : "bodySmallMedium"}
        color={valueColor}
        tabular
      >
        {value}
      </AppText>
    </View>
  );
}

interface ListRowProps {
  title: string;
  tag: string;
  amount: string;
  amountColor: "success" | "danger";
}

function ListRow({ title, tag, amount, amountColor }: ListRowProps) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listLeft}>
        <AppText variant="bodySmallMedium" color="primary">
          {tag}
        </AppText>
        <AppText variant="bodySmall" color="textSecondary" numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <AppText variant="bodySmallMedium" color={amountColor} tabular>
        {amount}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: screenPadding.compact,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    flex: 1,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
  },
  noticeText: {
    flex: 1,
    gap: spacing.xs,
  },
  resultCard: {
    gap: spacing.xs,
    backgroundColor: colors.successSoft,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    gap: spacing.xs,
  },
  projection: {
    marginTop: spacing.sm,
  },
  listCard: {
    gap: spacing.sm,
  },
  listDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  listLeft: {
    flex: 1,
    gap: spacing.xs,
  },
});
