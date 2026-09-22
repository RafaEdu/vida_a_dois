import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import { getCategoryIcon } from "../../utils/category";
import { getCurrentYearMonth } from "../../utils/date";
import { getInitials } from "../../utils/initials";
import { getFirstName } from "../../utils/name";
import { payerMeta, receiverMeta } from "../../utils/transaction";
import { compareExpenses, compareIncomes } from "../../domain/finance/order";
import {
  calculateBudgetProgress,
  calculateMonthlySummary,
  selectExpensesByMonth,
  selectIncomesByMonth,
} from "../../domain/finance/selectors";
import { colors, screenPadding, spacing } from "../../theme";
import { Avatar, ErrorState, LoadingState } from "../../components/ui";
import { TabScreenHeader } from "../../components/shell";
import { BalanceCard, MonthPicker } from "../../components/finance";
import { HomeGreeting } from "./components/HomeGreeting";
import { QuickActions } from "./components/QuickActions";
import {
  RecentTransactions,
  type RecentTransactionItem,
} from "./components/RecentTransactions";

function buildGreeting(name: string, date = new Date()): string {
  const hour = date.getHours();
  const prefix = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${prefix}, ${name}` : prefix;
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    partnerInfo,
    couple,
    expenses,
    incomes,
    expensesLoading,
    incomesLoading,
    expensesError,
    incomesError,
    fetchExpenses,
    fetchIncomes,
  } = useAuth();

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  const summary = useMemo(
    () =>
      calculateMonthlySummary(
        expenses,
        incomes,
        selectedMonth,
        couple?.monthly_budget ?? 0,
      ),
    [expenses, incomes, selectedMonth, couple?.monthly_budget],
  );

  const progress = useMemo(
    () => calculateBudgetProgress(summary.totalExpenses, summary.budget),
    [summary],
  );

  const recent = useMemo<RecentTransactionItem[]>(() => {
    const monthExpenses = selectExpensesByMonth(expenses, selectedMonth).sort(
      compareExpenses,
    );
    const monthIncomes = selectIncomesByMonth(incomes, selectedMonth).sort(
      compareIncomes,
    );

    const entries = [
      ...monthExpenses.map((expense) => ({
        date: expense.due_date ?? expense.created_at ?? "",
        item: {
          id: expense.id,
          kind: "expense" as const,
          title: expense.description || expense.category,
          subtitle: expense.category,
          meta: payerMeta(
            expense.paid_by,
            profile?.id,
            partnerInfo?.id,
            partnerInfo?.full_name,
          ),
          amount: expense.amount,
          icon: getCategoryIcon(expense.category),
          recurring: expense.is_recurring,
          status: expense.paid
            ? {
                label: "Pago",
                tone: "success" as const,
                icon: "check-circle" as const,
              }
            : {
                label: "Pendente",
                tone: "warning" as const,
                icon: "schedule" as const,
              },
        },
      })),
      ...monthIncomes.map((income) => ({
        date: income.received_at ?? income.created_at ?? "",
        item: {
          id: income.id,
          kind: "income" as const,
          title: income.description || "Receita",
          subtitle: income.is_extra ? "Extra" : "Salário",
          meta: receiverMeta(
            income.user_id,
            profile?.id,
            partnerInfo?.full_name,
          ),
          amount: income.amount,
          icon: "trending-up" as const,
          recurring: false,
          status: {
            label: "Recebido",
            tone: "success" as const,
            icon: "check-circle" as const,
          },
        },
      })),
    ];

    return entries
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((entry) => entry.item);
  }, [
    expenses,
    incomes,
    selectedMonth,
    profile?.id,
    partnerInfo?.id,
    partnerInfo?.full_name,
  ]);

  const isLoading = expensesLoading || incomesLoading;
  const hasError = Boolean(expensesError || incomesError);
  const hasData = expenses.length > 0 || incomes.length > 0;
  const showInitialLoading = isLoading && !hasData && !hasError;
  const showInitialError = hasError && !hasData;

  const handleRetry = useCallback(() => {
    void fetchExpenses();
    void fetchIncomes();
  }, [fetchExpenses, fetchIncomes]);

  const syncSubtitle = isLoading
    ? "Sincronizando..."
    : hasError
      ? "Sem conexão"
      : "Sincronizado";

  const selfFirstName = getFirstName(profile?.full_name);
  const partnerFirstName = getFirstName(partnerInfo?.full_name);
  const greeting = buildGreeting(selfFirstName);
  const coupleLabel = partnerFirstName
    ? `${selfFirstName || "Você"} & ${partnerFirstName}`
    : selfFirstName || "Nosso casal";

  const isCurrentMonth = selectedMonth === currentYearMonth;
  const isMonthClosed = couple?.last_closed_month === selectedMonth;
  const monthStatus = isMonthClosed
    ? "Mês encerrado"
    : isCurrentMonth
      ? "Mês aberto"
      : "Mês anterior";
  const monthStatusTone =
    isCurrentMonth && !isMonthClosed ? "primary" : "neutral";
  const canCloseMonth = isCurrentMonth && !isMonthClosed;

  return (
    <View style={styles.root}>
      <TabScreenHeader
        title="Vida a Dois"
        subtitle={syncSubtitle}
        right={
          <Avatar
            initials={getInitials(profile?.full_name, "??")}
            tone="primary"
            onPress={() => router.navigate("/profile")}
            accessibilityLabel="Abrir área do casal"
          />
        }
      />

      {showInitialError ? (
        <ErrorState
          title="Não foi possível carregar seus dados"
          message={expensesError ?? incomesError ?? undefined}
          onRetry={handleRetry}
        />
      ) : showInitialLoading ? (
        <LoadingState message="Carregando seu mês..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <HomeGreeting
            greeting={greeting}
            coupleLabel={coupleLabel}
            monthStatus={monthStatus}
            monthStatusTone={monthStatusTone}
          />

          <MonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            maxYearMonth={currentYearMonth}
          />

          <BalanceCard summary={summary} progress={progress} />

          <QuickActions
            onOpenPlanning={() => router.navigate("/cost-plan")}
            onOpenMonthClosing={() => router.push("/monthly-closing")}
            monthClosingDisabled={!canCloseMonth}
            monthClosingLabel={isMonthClosed ? "Mês já fechado" : "Fechar mês"}
            monthClosingHint={
              isCurrentMonth
                ? undefined
                : "O fechamento acontece apenas no mês atual."
            }
          />

          <RecentTransactions
            items={recent}
            loading={isLoading}
            onSeeAll={() => router.navigate("/expenses")}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: screenPadding.compact,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
});
