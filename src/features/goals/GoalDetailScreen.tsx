import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useCouple } from "../../providers/CoupleProvider";
import { useFinance } from "../../providers/FinanceProvider";
import type { GoalContribution } from "../../types/domain";
import { calculateGoalProgress } from "../../domain/finance/goals";
import { formatCurrency } from "../../utils/currency";
import { formatDateFromTimestamp } from "../../utils/date";
import { colors, radius, spacing } from "../../theme";
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MoneyText,
  ProgressBar,
  Screen,
  SectionHeader,
} from "../../components/ui";
import {
  resolveContributionAuthorLabel,
  resolveGoalProgressHint,
  resolveGoalProgressTone,
  resolveGoalStatusBadgeTone,
  resolveGoalStatusLabel,
  resolveGoalTargetDateLabel,
} from "./model";

/**
 * Detalhe de uma meta: resumo/progresso e o histórico de contribuições em ordem
 * cronológica. A leitura é permitida aos participantes, inclusive em vínculos
 * encerrados (histórico somente leitura).
 */
export function GoalDetailScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const goalId = typeof params.goalId === "string" ? params.goalId : "";

  const { profile, partnerInfo } = useCouple();
  const { goals, goalContributions, goalsLoading, goalsError, fetchGoals } =
    useFinance();

  const goal = useMemo(
    () => goals.find((item) => item.id === goalId) ?? null,
    [goals, goalId],
  );

  const contributions = useMemo(
    () =>
      goalContributions
        .filter((contribution) => contribution.goal_id === goalId)
        .sort((a, b) => a.contributed_at.localeCompare(b.contributed_at)),
    [goalContributions, goalId],
  );

  const progress = useMemo(
    () => (goal ? calculateGoalProgress(goal, contributions) : null),
    [goal, contributions],
  );

  if (goalsLoading && !goal) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando meta..." />
      </Screen>
    );
  }

  if (goalsError && !goal) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Não foi possível carregar a meta"
          message={goalsError}
          onRetry={() => {
            void fetchGoals();
          }}
        />
      </Screen>
    );
  }

  if (!goal || !progress) {
    return (
      <Screen edges={["left", "right"]}>
        <EmptyState
          icon="flag"
          title="Meta não encontrada"
          description="Esta meta não está disponível para o seu vínculo."
        />
      </Screen>
    );
  }

  const targetDateLabel = resolveGoalTargetDateLabel(goal.target_date);

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <Card padded style={styles.card}>
        <View style={styles.header}>
          <AppText variant="h3" style={styles.title}>
            {goal.title}
          </AppText>
          <Badge
            label={resolveGoalStatusLabel(goal.status)}
            tone={resolveGoalStatusBadgeTone(goal.status)}
          />
        </View>

        <View style={styles.amountRow}>
          <MoneyText value={progress.contributed} variant="h2" />
          <AppText variant="bodySmall" color="textSecondary">
            de {formatCurrency(progress.target)}
          </AppText>
        </View>

        <ProgressBar
          value={progress.share}
          tone={resolveGoalProgressTone(progress)}
          accessibilityLabel={`${goal.title}: ${progress.percentage}% da meta de ${formatCurrency(
            progress.target,
          )}`}
        />

        <View style={styles.footer}>
          <AppText variant="bodySmall" color="textSecondary">
            {resolveGoalProgressHint(progress)}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary" tabular>
            {progress.percentage}%
          </AppText>
        </View>

        {targetDateLabel ? (
          <AppText variant="bodySmall" color="textSecondary">
            {targetDateLabel}
          </AppText>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Histórico de contribuições"
          subtitle={
            contributions.length > 0
              ? `${contributions.length} registro(s)`
              : undefined
          }
        />

        {contributions.length === 0 ? (
          <EmptyState
            icon="savings"
            title="Nenhuma contribuição ainda"
            description="Quando alguém guardar um valor para esta meta, ele aparece aqui."
          />
        ) : (
          <View style={styles.timeline}>
            {contributions.map((contribution) => (
              <ContributionRow
                key={contribution.id}
                contribution={contribution}
                selfId={profile?.id}
                selfName={profile?.full_name}
                partnerId={partnerInfo?.id}
                partnerName={partnerInfo?.full_name}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

interface ContributionRowProps {
  contribution: GoalContribution;
  selfId: string | null | undefined;
  selfName: string | null | undefined;
  partnerId: string | null | undefined;
  partnerName: string | null | undefined;
}

function ContributionRow({
  contribution,
  selfId,
  selfName,
  partnerId,
  partnerName,
}: ContributionRowProps) {
  const author = resolveContributionAuthorLabel(
    contribution.user_id,
    selfId,
    selfName,
    partnerId,
    partnerName,
  );
  const dateLabel = formatDateFromTimestamp(contribution.contributed_at);

  return (
    <Card variant="subtle" padded style={styles.contributionCard}>
      <View style={styles.contributionHeader}>
        <AppText variant="bodyMedium">{author}</AppText>
        <MoneyText
          value={contribution.amount}
          variant="bodySemibold"
          color="success"
          signed
        />
      </View>
      {dateLabel ? (
        <AppText variant="bodySmall" color="textSecondary">
          {dateLabel}
        </AppText>
      ) : null}
      {contribution.note ? (
        <AppText variant="bodySmall" color="textSecondary">
          {contribution.note}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  timeline: {
    gap: spacing.sm,
  },
  contributionCard: {
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
  },
  contributionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
});
