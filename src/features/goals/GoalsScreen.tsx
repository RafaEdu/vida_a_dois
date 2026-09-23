import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useCouple } from "../../providers/CoupleProvider";
import { useFinance } from "../../providers/FinanceProvider";
import type {
  FinancialGoal,
  FinancialGoalInput,
  GoalContributionInput,
} from "../../types/domain";
import {
  calculateGoalProgresses,
  sortGoalsForDisplay,
  summarizeGoals,
} from "../../domain/finance/goals";
import { spacing } from "../../theme";
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MoneyText,
  Screen,
  SectionHeader,
} from "../../components/ui";
import { GoalCard } from "./components/GoalCard";
import { GoalModal } from "./components/GoalModal";
import { ContributionModal } from "./components/ContributionModal";

/**
 * Tela "Metas": lista as metas compartilhadas, mostra o progresso e permite
 * criar/editar/concluir/arquivar e registrar contribuições. A escrita é
 * protegida pela RLS (apenas vínculo ativo); metas fechadas são somente leitura
 * e continuam no histórico.
 */
export function GoalsScreen() {
  const { couple } = useCouple();
  const {
    goals,
    goalContributions,
    goalsLoading,
    goalsError,
    fetchGoals,
    createGoal,
    updateGoal,
    setGoalStatus,
    addGoalContribution,
  } = useFinance();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FinancialGoal | null>(null);
  const [contributing, setContributing] = useState<FinancialGoal | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage = couple?.status === "active";

  const sortedGoals = useMemo(() => sortGoalsForDisplay(goals), [goals]);

  const progressByGoal = useMemo(() => {
    const progresses = calculateGoalProgresses(goals, goalContributions);
    return new Map(progresses.map((progress) => [progress.id, progress]));
  }, [goals, goalContributions]);

  const countByGoal = useMemo(() => {
    const counts = new Map<string, number>();
    for (const contribution of goalContributions) {
      counts.set(
        contribution.goal_id,
        (counts.get(contribution.goal_id) ?? 0) + 1,
      );
    }
    return counts;
  }, [goalContributions]);

  const summary = useMemo(() => summarizeGoals(goals), [goals]);
  const totalContributed = useMemo(
    () =>
      goalContributions.reduce(
        (sum, contribution) => sum + contribution.amount,
        0,
      ),
    [goalContributions],
  );

  const handleRetry = useCallback(() => {
    void fetchGoals();
  }, [fetchGoals]);

  const handleSave = useCallback(
    async (input: FinancialGoalInput) => {
      if (editing) return updateGoal(editing.id, input);
      return createGoal(input);
    },
    [editing, createGoal, updateGoal],
  );

  const handleContribute = useCallback(
    async (input: GoalContributionInput) => {
      if (!contributing) return { error: "Meta indisponível." };
      return addGoalContribution(contributing.id, input);
    },
    [contributing, addGoalContribution],
  );

  const handleStatusChange = useCallback(
    (goal: FinancialGoal, status: "completed" | "archived") => {
      const title = status === "completed" ? "Concluir meta" : "Arquivar meta";
      const message =
        status === "completed"
          ? `A meta "${goal.title}" será marcada como concluída. O histórico de contribuições permanece.`
          : `A meta "${goal.title}" será arquivada. Ela não some do histórico e pode ser consultada depois.`;
      const actionLabel = status === "completed" ? "Concluir" : "Arquivar";

      Alert.alert(title, message, [
        { text: "Cancelar", style: "cancel" },
        {
          text: actionLabel,
          onPress: async () => {
            setBusyId(goal.id);
            const { error } = await setGoalStatus(goal.id, status);
            setBusyId(null);
            if (error) {
              Alert.alert("Não foi possível atualizar", error);
            }
          },
        },
      ]);
    },
    [setGoalStatus],
  );

  if (!couple) {
    return (
      <Screen edges={["left", "right"]}>
        <EmptyState
          icon="link-off"
          title="Sem vínculo ativo"
          description="As metas compartilhadas ficam disponíveis enquanto existe um vínculo com o casal."
        />
      </Screen>
    );
  }

  if (goalsLoading && goals.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando metas..." />
      </Screen>
    );
  }

  if (goalsError && goals.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Não foi possível carregar as metas"
          message={goalsError}
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
        title="Metas do casal"
        subtitle="Objetivos compartilhados, como viagens e reservas"
      />

      {!canManage ? (
        <Card variant="subtle" padded style={styles.notice}>
          <AppText variant="bodySmall" color="textSecondary">
            Este vínculo não está ativo. As metas ficam somente para leitura.
          </AppText>
        </Card>
      ) : null}

      {goals.length === 0 ? (
        <EmptyState
          icon="flag"
          title="Nenhuma meta definida"
          description="Crie um objetivo do casal, como uma viagem, uma reserva de emergência ou a entrada de um imóvel, e acompanhe o progresso."
        />
      ) : (
        <>
          <Card padded style={styles.summaryCard}>
            <AppText variant="labelCaps" color="textSecondary">
              Total guardado nas metas
            </AppText>
            <MoneyText value={totalContributed} variant="h2" />
            <AppText variant="bodySmall" color="textSecondary">
              {summary.active} ativa(s), {summary.completed} concluída(s) e{" "}
              {summary.archived} arquivada(s)
            </AppText>
          </Card>

          <View style={styles.list}>
            {sortedGoals.map((goal) => {
              const progress = progressByGoal.get(goal.id);
              if (!progress) return null;
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  progress={progress}
                  contributionCount={countByGoal.get(goal.id) ?? 0}
                  readOnly={!canManage}
                  busy={busyId === goal.id}
                  onOpen={(current) =>
                    router.push({
                      pathname: "/goal-detail",
                      params: { goalId: current.id },
                    })
                  }
                  onEdit={(current) => setEditing(current)}
                  onContribute={(current) => setContributing(current)}
                  onComplete={(current) =>
                    handleStatusChange(current, "completed")
                  }
                  onArchive={(current) =>
                    handleStatusChange(current, "archived")
                  }
                />
              );
            })}
          </View>
        </>
      )}

      {canManage ? (
        <Button
          title="Nova meta"
          icon="add"
          variant="secondary"
          fullWidth
          onPress={() => setCreating(true)}
        />
      ) : null}

      {creating ? (
        <GoalModal
          goal={null}
          onClose={() => setCreating(false)}
          onSave={handleSave}
        />
      ) : null}

      {editing ? (
        <GoalModal
          key={editing.id}
          goal={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      ) : null}

      {contributing ? (
        <ContributionModal
          key={contributing.id}
          goalTitle={contributing.title}
          onClose={() => setContributing(null)}
          onSave={handleContribute}
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
