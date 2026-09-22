import { useCallback, useMemo, useState } from "react";
import { Alert, SectionList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import { getCurrentYearMonth } from "../../utils/date";
import { colors, maxContentWidth, screenPadding, spacing } from "../../theme";
import {
  AppText,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  SegmentedControl,
  type SegmentedControlOption,
} from "../../components/ui";
import { TabScreenHeader } from "../../components/shell";
import {
  EditModal,
  MonthPicker,
  TransactionRow,
  type EditTarget,
} from "../../components/finance";
import {
  EMPTY_TRANSACTION_FILTERS,
  type TransactionEntry,
  type TransactionFilterState,
  type TransactionTypeFilter,
  type TransactionIdentity,
} from "./model";
import { useTransactions } from "./hooks/useTransactions";
import { TransactionsSummary } from "./components/TransactionsSummary";
import { TransactionFiltersSheet } from "./components/TransactionFiltersSheet";
import { TransactionActionsSheet } from "./components/TransactionActionsSheet";

const TYPE_OPTIONS: SegmentedControlOption<TransactionTypeFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Despesas" },
  { value: "income", label: "Receitas" },
];

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const {
    expenses,
    incomes,
    profile,
    partnerInfo,
    expensesLoading,
    incomesLoading,
    expensesError,
    incomesError,
    updateExpense,
    markExpensePaid,
    deleteExpense,
    updateIncome,
    deleteIncome,
    fetchExpenses,
    fetchIncomes,
  } = useAuth();

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);
  const [filters, setFilters] = useState<TransactionFilterState>(
    EMPTY_TRANSACTION_FILTERS,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [actionsTarget, setActionsTarget] = useState<TransactionEntry | null>(
    null,
  );

  const identity = useMemo<TransactionIdentity>(
    () => ({
      selfId: profile?.id,
      partnerId: partnerInfo?.id,
      partnerName: partnerInfo?.full_name,
    }),
    [profile?.id, partnerInfo?.id, partnerInfo?.full_name],
  );

  const {
    groups,
    totalIncomes,
    totalExpenses,
    categoryOptions,
    hasActiveFilters,
    count,
  } = useTransactions({
    expenses,
    incomes,
    selectedMonth,
    filters,
    identity,
  });

  const sections = useMemo(
    () => groups.map((group) => ({ title: group.label, data: group.data })),
    [groups],
  );

  const isLoading = expensesLoading || incomesLoading;
  const hasError = Boolean(expensesError || incomesError);
  const hasData = expenses.length > 0 || incomes.length > 0;
  const showInitialLoading = isLoading && !hasData && !hasError;
  const showInitialError = hasError && !hasData;

  const handleRefresh = useCallback(() => {
    void fetchExpenses();
    void fetchIncomes();
  }, [fetchExpenses, fetchIncomes]);

  const handleTypeChange = (type: TransactionTypeFilter) => {
    setFilters((prev) => ({
      ...prev,
      type,
      ...(type === "income"
        ? { category: null, status: "all" as const }
        : null),
    }));
  };

  const findEntry = useCallback(
    (entry: TransactionEntry): EditTarget => {
      if (entry.kind === "expense") {
        const item = expenses.find((expense) => expense.id === entry.id);
        return item ? { type: "expense", item } : null;
      }
      const item = incomes.find((income) => income.id === entry.id);
      return item ? { type: "income", item } : null;
    },
    [expenses, incomes],
  );

  const handleEdit = useCallback(
    (entry: TransactionEntry) => {
      const target = findEntry(entry);
      if (target) setEditing(target);
    },
    [findEntry],
  );

  const handleTogglePaid = useCallback(
    (entry: TransactionEntry) => {
      setActionsTarget(null);
      const item = expenses.find((expense) => expense.id === entry.id);
      if (!item) return;

      if (item.paid) {
        void updateExpense(item.id, { paid: false, paid_at: null });
      } else {
        void markExpensePaid(item.id);
      }
    },
    [expenses, updateExpense, markExpensePaid],
  );

  const handleDelete = useCallback(
    (entry: TransactionEntry) => {
      setActionsTarget(null);

      if (entry.kind === "expense") {
        Alert.alert("Excluir despesa", `Deseja excluir "${entry.title}"?`, [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              void deleteExpense(entry.id);
            },
          },
        ]);
        return;
      }

      Alert.alert("Excluir receita", `Deseja excluir "${entry.title}"?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void deleteIncome(entry.id);
          },
        },
      ]);
    },
    [deleteExpense, deleteIncome],
  );

  const countLabel = count === 1 ? "1 lançamento" : `${count} lançamentos`;

  return (
    <View style={styles.root}>
      <TabScreenHeader title="Lançamentos" />

      {showInitialError ? (
        <ErrorState
          title="Não foi possível carregar seus lançamentos"
          message={expensesError ?? incomesError ?? undefined}
          onRetry={handleRefresh}
        />
      ) : showInitialLoading ? (
        <LoadingState message="Carregando lançamentos..." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index, section }) => (
            <TransactionRow
              kind={item.kind}
              title={item.title}
              subtitle={item.subtitle}
              meta={item.meta}
              amount={item.amount}
              icon={item.icon}
              status={item.status}
              recurring={item.recurring}
              onPress={() => handleEdit(item)}
              onMorePress={() => setActionsTarget(item)}
              style={
                index < section.data.length - 1 ? styles.divider : undefined
              }
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <AppText variant="labelCaps" color="textSecondary" caps>
                {section.title}
              </AppText>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
                maxYearMonth={currentYearMonth}
              />

              <TransactionsSummary
                totalIncomes={totalIncomes}
                totalExpenses={totalExpenses}
              />

              <SegmentedControl
                options={TYPE_OPTIONS}
                value={filters.type}
                onChange={handleTypeChange}
                accessibilityLabel="Filtrar lançamentos por tipo"
              />

              <View style={styles.filterRow}>
                <AppText variant="bodySmall" color="textSecondary">
                  {countLabel}
                </AppText>
                <Chip
                  label="Filtros"
                  icon="tune"
                  selected={hasActiveFilters}
                  onPress={() => setFiltersOpen(true)}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-long"
              title={
                hasActiveFilters
                  ? "Nenhum lançamento com estes filtros"
                  : "Nenhum lançamento neste período"
              }
              description={
                hasActiveFilters
                  ? "Ajuste ou limpe os filtros para ver mais resultados."
                  : "Use o botão + para registrar uma despesa ou receita."
              }
              actionLabel={hasActiveFilters ? "Limpar filtros" : undefined}
              onActionPress={
                hasActiveFilters
                  ? () => setFilters(EMPTY_TRANSACTION_FILTERS)
                  : undefined
              }
            />
          }
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 96 },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshing={isLoading && hasData}
          onRefresh={handleRefresh}
        />
      )}

      {filtersOpen ? (
        <TransactionFiltersSheet
          filters={filters}
          typeFilter={filters.type}
          categoryOptions={categoryOptions}
          partnerName={partnerInfo?.full_name ?? ""}
          onApply={(next) => {
            setFilters(next);
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}

      {actionsTarget ? (
        <TransactionActionsSheet
          entry={actionsTarget}
          onEdit={(entry) => {
            setActionsTarget(null);
            handleEdit(entry);
          }}
          onTogglePaid={handleTogglePaid}
          onDelete={handleDelete}
          onClose={() => setActionsTarget(null)}
        />
      ) : null}

      {editing ? (
        <EditModal
          key={`${editing.type}-${editing.item.id}`}
          target={editing}
          onClose={() => setEditing(null)}
          onSaveExpense={async (id, data) => {
            await updateExpense(id, data);
            setEditing(null);
          }}
          onSaveIncome={async (id, data) => {
            await updateIncome(id, data);
            setEditing(null);
          }}
        />
      ) : null}
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
  },
  header: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
