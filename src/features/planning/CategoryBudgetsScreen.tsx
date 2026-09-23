import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useCouple } from "../../providers/CoupleProvider";
import { useFinance } from "../../providers/FinanceProvider";
import type {
  CategoryBudget,
  CategoryBudgetInput,
  Expense,
} from "../../types/domain";
import { DEFAULT_CATEGORIES } from "../../constants/categories";
import {
  calculateCategoryBudgetProgresses,
  resolveCategoryBudgetOverflow,
  sumCategoryBudgetLimits,
} from "../../domain/finance/categoryBudgets";
import { selectExpensesByMonth } from "../../domain/finance/selectors";
import { getCurrentYearMonth } from "../../utils/date";
import { formatCurrency } from "../../utils/currency";
import { spacing } from "../../theme";
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from "../../components/ui";
import { CategoryBudgetCard } from "./components/CategoryBudgetCard";
import { CategoryBudgetModal } from "./components/CategoryBudgetModal";

/**
 * Tela "Orçamento por categoria": lista os limites mensais por categoria do
 * vínculo, mostra o progresso do mês corrente (mesma seleção das despesas) e
 * permite criar/editar/remover. A escrita é protegida pela RLS (apenas vínculo
 * ativo); vínculo encerrado é somente leitura.
 */
export function CategoryBudgetsScreen() {
  const { couple } = useCouple();
  const {
    expenses,
    categoryBudgets,
    categoryBudgetsLoading,
    categoryBudgetsError,
    fetchCategoryBudgets,
    saveCategoryBudget,
    removeCategoryBudget,
  } = useFinance();

  const [editing, setEditing] = useState<CategoryBudget | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const canManage = couple?.status === "active";

  const monthExpenses = useMemo<Expense[]>(
    () => selectExpensesByMonth(expenses, currentYearMonth),
    [expenses, currentYearMonth],
  );

  const progresses = useMemo(
    () => calculateCategoryBudgetProgresses(categoryBudgets, monthExpenses),
    [categoryBudgets, monthExpenses],
  );

  const totalLimits = useMemo(
    () => sumCategoryBudgetLimits(categoryBudgets),
    [categoryBudgets],
  );

  const overflow = useMemo(
    () =>
      resolveCategoryBudgetOverflow(totalLimits, couple?.monthly_budget ?? 0),
    [totalLimits, couple?.monthly_budget],
  );

  const availableCategories = useMemo(() => {
    const used = new Set(categoryBudgets.map((budget) => budget.category));
    return DEFAULT_CATEGORIES.map((category) => category.name).filter(
      (name) => !used.has(name),
    );
  }, [categoryBudgets]);

  const handleRetry = useCallback(() => {
    void fetchCategoryBudgets();
  }, [fetchCategoryBudgets]);

  const handleSave = useCallback(
    async (input: CategoryBudgetInput) => {
      const result = await saveCategoryBudget(input);
      return result;
    },
    [saveCategoryBudget],
  );

  const handleRemove = useCallback(
    (progressId: string, category: string) => {
      Alert.alert(
        "Remover orçamento",
        `O limite da categoria "${category}" será removido. As despesas e o histórico permanecem intactos.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            style: "destructive",
            onPress: async () => {
              setBusyId(progressId);
              const { error } = await removeCategoryBudget(progressId);
              setBusyId(null);
              if (error) {
                Alert.alert("Não foi possível remover", error);
              }
            },
          },
        ],
      );
    },
    [removeCategoryBudget],
  );

  if (!couple) {
    return (
      <Screen edges={["left", "right"]}>
        <EmptyState
          icon="link-off"
          title="Sem vínculo ativo"
          description="O orçamento por categoria fica disponível enquanto existe um vínculo com o casal."
        />
      </Screen>
    );
  }

  if (categoryBudgetsLoading && categoryBudgets.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando orçamento por categoria..." />
      </Screen>
    );
  }

  if (categoryBudgetsError && categoryBudgets.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Não foi possível carregar o orçamento por categoria"
          message={categoryBudgetsError}
          onRetry={handleRetry}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <SectionHeader
        title="Orçamento por categoria"
        subtitle="Limites mensais para cada tipo de gasto"
      />

      {!canManage ? (
        <Card variant="subtle" padded style={styles.notice}>
          <AppText variant="bodySmall" color="textSecondary">
            Este vínculo não está ativo. O orçamento por categoria fica somente
            para leitura.
          </AppText>
        </Card>
      ) : null}

      {categoryBudgets.length === 0 ? (
        <EmptyState
          icon="account-balance-wallet"
          title="Nenhum limite por categoria"
          description="Defina quanto pretende gastar em Mercado, Moradia, Transporte e outras categorias para acompanhar o progresso do mês."
        />
      ) : (
        <>
          <Card padded style={styles.summaryCard}>
            <AppText variant="labelCaps" color="textSecondary">
              Soma dos limites
            </AppText>
            <AppText variant="h2">{formatCurrency(totalLimits)}</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {couple.monthly_budget > 0
                ? `Orçamento global do mês: ${formatCurrency(couple.monthly_budget)}`
                : "Nenhum orçamento global definido para o mês"}
            </AppText>
            {overflow.exceeded ? (
              <AppText variant="bodySmall" color="warning">
                Os limites somam {formatCurrency(overflow.difference)} acima do
                orçamento global. Você ainda pode salvar, mas revise a
                distribuição.
              </AppText>
            ) : null}
          </Card>

          <View style={styles.list}>
            {progresses.map((progress) => (
              <CategoryBudgetCard
                key={progress.id}
                progress={progress}
                busy={busyId === progress.id}
                readOnly={!canManage}
                onEdit={(current) => {
                  const budget = categoryBudgets.find(
                    (item) => item.id === current.id,
                  );
                  if (budget) setEditing(budget);
                }}
                onRemove={(current) =>
                  handleRemove(current.id, current.category)
                }
              />
            ))}
          </View>
        </>
      )}

      {canManage && availableCategories.length > 0 ? (
        <Button
          title="Adicionar categoria"
          icon="add"
          variant="secondary"
          fullWidth
          onPress={() => setCreating(true)}
        />
      ) : null}

      {canManage &&
      categoryBudgets.length > 0 &&
      availableCategories.length === 0 ? (
        <AppText variant="bodySmall" color="textSecondary">
          Todas as categorias disponíveis já possuem um orçamento definido.
        </AppText>
      ) : null}

      {creating ? (
        <CategoryBudgetModal
          budget={null}
          availableCategories={availableCategories}
          onClose={() => setCreating(false)}
          onSave={handleSave}
        />
      ) : null}

      {editing ? (
        <CategoryBudgetModal
          key={editing.id}
          budget={editing}
          availableCategories={availableCategories}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  notice: {
    gap: spacing.xs,
  },
  summaryCard: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
});
