import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import type { IdealSplit } from "../../types/domain";
import { resolvePartnerShares, roundPercent } from "../../domain/finance/split";
import { getCurrentYearMonth } from "../../utils/date";
import { getInitials } from "../../utils/initials";
import { formatCurrency } from "../../utils/currency";
import { colors, maxContentWidth, screenPadding, spacing } from "../../theme";
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MoneyText,
  SectionHeader,
} from "../../components/ui";
import { TabScreenHeader } from "../../components/shell";
import { BudgetCategoryCard, MonthPicker } from "../../components/finance";
import { derivePlanningMonthStatus } from "./model";
import { usePlanning } from "./hooks/usePlanning";
import { PlanningSummaryCard } from "./components/PlanningSummaryCard";
import { PlanningSplitCard } from "./components/PlanningSplitCard";
import { CategoryBudgetCard } from "./components/CategoryBudgetCard";

export function PlanningScreen() {
  const insets = useSafeAreaInsets();
  const {
    couple,
    profile,
    partnerInfo,
    expenses,
    expensesLoading,
    expensesError,
    categoryBudgets,
    fetchExpenses,
    fetchIdealSplit,
  } = useAuth();

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);
  const [idealSplit, setIdealSplit] = useState<IdealSplit | null>(null);

  useEffect(() => {
    fetchIdealSplit().then((result) => setIdealSplit(result.data));
  }, [fetchIdealSplit]);

  const budget = couple?.monthly_budget ?? 0;
  const {
    spent,
    progress,
    categories,
    categoryProgresses,
    categoryBudgetTotal,
    categoryBudgetOverflow,
  } = usePlanning({
    expenses,
    budget,
    selectedMonth,
    categoryBudgets,
  });

  const monthStatus = useMemo(
    () =>
      derivePlanningMonthStatus(
        selectedMonth,
        currentYearMonth,
        couple?.last_closed_month,
      ),
    [selectedMonth, currentYearMonth, couple?.last_closed_month],
  );

  const isLoading = expensesLoading;
  const hasData = expenses.length > 0;
  const showInitialLoading = isLoading && !hasData;
  const showInitialError = Boolean(expensesError) && !hasData;

  const handleRetry = useCallback(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  const selfName = profile?.full_name ?? "Você";
  const partnerName = partnerInfo?.full_name ?? "Parceiro";
  const { selfShare, partnerShare } =
    couple && profile
      ? resolvePartnerShares(couple, profile.id)
      : { selfShare: 50, partnerShare: 50 };
  const splitMode = couple?.split_mode ?? "manual";
  const selfIsA = Boolean(couple && profile && couple.user_a === profile.id);
  const idealSelfShare =
    idealSplit == null
      ? null
      : selfIsA
        ? idealSplit.ratio_a
        : idealSplit.ratio_b;
  const idealPartnerShare =
    idealSelfShare == null ? null : roundPercent(100 - idealSelfShare);
  const sharedBalance = couple?.shared_balance ?? 0;

  return (
    <View style={styles.root}>
      <TabScreenHeader
        title="Planejamento"
        subtitle="Orçamento, categorias e fechamento do mês"
      />

      {showInitialError ? (
        <ErrorState
          title="Não foi possível carregar seu planejamento"
          message={expensesError ?? undefined}
          onRetry={handleRetry}
        />
      ) : showInitialLoading ? (
        <LoadingState message="Carregando planejamento..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 96 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.periodBlock}>
            <MonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              maxYearMonth={currentYearMonth}
            />
            <Badge label={monthStatus.label} tone={monthStatus.tone} />
          </View>

          <PlanningSummaryCard
            budget={budget}
            spent={spent}
            progress={progress}
          />

          <View style={styles.section}>
            <SectionHeader
              title="Categorias"
              subtitle={
                categories.length > 0
                  ? "Participação de cada categoria no orçamento do mês"
                  : undefined
              }
            />
            {categories.length > 0 ? (
              <View style={styles.categoryList}>
                {categories.map((category) => (
                  <BudgetCategoryCard
                    key={category.name}
                    category={category.name}
                    amount={category.amount}
                    budget={budget}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="pie-chart-outline"
                title="Nenhum gasto neste período"
                description="Quando houver despesas no mês, elas aparecem aqui por categoria."
              />
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Orçamento por categoria"
              subtitle="Limites mensais e o quanto já foi consumido no período"
            />
            {categoryProgresses.length > 0 ? (
              <>
                <Card padded style={styles.budgetSummary}>
                  <View style={styles.budgetSummaryRow}>
                    <AppText variant="labelCaps" color="textSecondary">
                      Soma dos limites
                    </AppText>
                    <MoneyText
                      value={categoryBudgetTotal}
                      variant="bodySemibold"
                    />
                  </View>
                  {budget > 0 ? (
                    <AppText variant="bodySmall" color="textSecondary">
                      Orçamento global do mês: {formatCurrency(budget)}
                    </AppText>
                  ) : null}
                  {categoryBudgetOverflow.exceeded ? (
                    <AppText variant="bodySmall" color="warning">
                      Os limites somam{" "}
                      {formatCurrency(categoryBudgetOverflow.difference)} acima
                      do orçamento global.
                    </AppText>
                  ) : null}
                </Card>
                <View style={styles.categoryList}>
                  {categoryProgresses.map((budgetProgress) => (
                    <CategoryBudgetCard
                      key={budgetProgress.id}
                      progress={budgetProgress}
                      readOnly
                    />
                  ))}
                </View>
              </>
            ) : (
              <EmptyState
                icon="account-balance-wallet"
                title="Nenhum limite por categoria"
                description="Defina limites para Mercado, Moradia, Transporte e outras categorias e acompanhe o progresso do mês."
              />
            )}
            <Button
              title="Editar orçamentos por categoria"
              icon="edit"
              variant="secondary"
              onPress={() => router.push("/category-budgets")}
            />
          </View>

          <PlanningSplitCard
            selfName={selfName}
            selfInitials={getInitials(profile?.full_name, "??")}
            partnerName={partnerName}
            partnerInitials={getInitials(partnerInfo?.full_name, "??")}
            selfShare={selfShare}
            partnerShare={partnerShare}
            budget={budget}
            splitMode={splitMode}
            idealSelfShare={idealSelfShare}
            idealPartnerShare={idealPartnerShare}
          />

          {sharedBalance !== 0 ? (
            <Card padded style={styles.balanceCard}>
              <AppText variant="labelCaps" color="textSecondary">
                Caixa comum acumulado
              </AppText>
              <MoneyText
                value={sharedBalance}
                variant="h2"
                color={sharedBalance >= 0 ? "text" : "danger"}
              />
            </Card>
          ) : null}

          <Button
            title="Editar planejamento"
            icon="edit"
            variant="secondary"
            onPress={() => router.push("/cost-plan/edit")}
          />

          <View style={styles.section}>
            <SectionHeader
              title="Acerto do casal"
              subtitle="Quanto cada um deveria pagar e quem adiantou a diferença"
            />
            <Button
              title="Ver acerto do período"
              icon="balance"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: "/settlement",
                  params: { yearMonth: selectedMonth },
                })
              }
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Recorrências"
              subtitle="Contas fixas que se repetem todo mês"
            />
            <Button
              title="Gerenciar recorrências"
              icon="autorenew"
              variant="secondary"
              onPress={() => router.push("/recurrences")}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Metas do casal"
              subtitle="Objetivos compartilhados e o quanto já foi guardado"
            />
            <Button
              title="Ver metas"
              icon="flag"
              variant="secondary"
              onPress={() => router.push("/goals")}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Fechamento do mês"
              subtitle="Consolida o saldo do mês no caixa comum do casal"
            />
            <Button
              title={monthStatus.isClosed ? "Mês já fechado" : "Fechar mês"}
              icon="event-available"
              variant="secondary"
              disabled={!monthStatus.canCloseMonth}
              onPress={() => router.push("/monthly-closing")}
            />
            <Button
              title="Histórico de fechamentos"
              icon="history"
              variant="ghost"
              onPress={() => router.push("/closing-history")}
            />
            {!monthStatus.isCurrentMonth ? (
              <AppText variant="bodySmall" color="textSecondary">
                O fechamento acontece apenas no mês atual.
              </AppText>
            ) : null}
          </View>
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
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: screenPadding.compact,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  periodBlock: {
    alignItems: "center",
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  categoryList: {
    gap: spacing.md,
  },
  budgetSummary: {
    gap: spacing.xs,
  },
  budgetSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  balanceCard: {
    gap: spacing.xs,
  },
});
