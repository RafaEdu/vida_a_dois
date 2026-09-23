import { StyleSheet, View } from "react-native";
import type { FinancialGoal } from "../../../types/domain";
import type { GoalProgress } from "../../../domain/finance/goals";
import {
  resolveGoalProgressHint,
  resolveGoalProgressTone,
  resolveGoalStatusBadgeTone,
  resolveGoalStatusLabel,
  resolveGoalTargetDateLabel,
} from "../model";
import { formatCurrency } from "../../../utils/currency";
import { spacing } from "../../../theme";
import {
  AppText,
  Badge,
  Button,
  Card,
  MoneyText,
  ProgressBar,
} from "../../../components/ui";

interface GoalCardProps {
  goal: FinancialGoal;
  progress: GoalProgress;
  contributionCount: number;
  readOnly?: boolean;
  busy?: boolean;
  onOpen?: (goal: FinancialGoal) => void;
  onEdit?: (goal: FinancialGoal) => void;
  onContribute?: (goal: FinancialGoal) => void;
  onComplete?: (goal: FinancialGoal) => void;
  onArchive?: (goal: FinancialGoal) => void;
}

/**
 * Card de uma meta compartilhada: progresso, quanto falta e as ações do estado.
 * Metas concluídas/arquivadas ficam somente leitura, mas nunca somem.
 */
export function GoalCard({
  goal,
  progress,
  contributionCount,
  readOnly = false,
  busy = false,
  onOpen,
  onEdit,
  onContribute,
  onComplete,
  onArchive,
}: GoalCardProps) {
  const isActive = goal.status === "active";
  const canManage = !readOnly && isActive;
  const targetDateLabel = resolveGoalTargetDateLabel(goal.target_date);

  return (
    <Card padded style={styles.card}>
      <View style={styles.header}>
        <AppText variant="bodySemibold" numberOfLines={2} style={styles.title}>
          {goal.title}
        </AppText>
        <Badge
          label={resolveGoalStatusLabel(goal.status)}
          tone={resolveGoalStatusBadgeTone(goal.status)}
        />
      </View>

      <View style={styles.amountRow}>
        <MoneyText value={progress.contributed} variant="bodySemibold" />
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

      <View style={styles.metaRow}>
        {targetDateLabel ? (
          <AppText variant="bodySmall" color="textSecondary">
            {targetDateLabel}
          </AppText>
        ) : null}
        <AppText variant="bodySmall" color="textSecondary">
          {contributionCount === 1
            ? "1 contribuição"
            : `${contributionCount} contribuições`}
        </AppText>
      </View>

      <View style={styles.actions}>
        {onOpen ? (
          <Button
            title="Histórico"
            icon="history"
            variant="secondary"
            size="md"
            style={styles.action}
            disabled={busy}
            onPress={() => onOpen(goal)}
            accessibilityLabel={`Ver histórico da meta ${goal.title}`}
          />
        ) : null}

        {canManage && onContribute ? (
          <Button
            title="Contribuir"
            icon="add"
            size="md"
            style={styles.action}
            disabled={busy}
            onPress={() => onContribute(goal)}
            accessibilityLabel={`Contribuir para a meta ${goal.title}`}
          />
        ) : null}

        {canManage && onEdit ? (
          <Button
            title="Editar"
            icon="edit"
            variant="secondary"
            size="md"
            style={styles.action}
            disabled={busy}
            onPress={() => onEdit(goal)}
            accessibilityLabel={`Editar a meta ${goal.title}`}
          />
        ) : null}

        {canManage && onComplete ? (
          <Button
            title="Concluir"
            icon="check"
            variant="ghost"
            size="md"
            style={styles.action}
            disabled={busy}
            onPress={() => onComplete(goal)}
            accessibilityLabel={`Concluir a meta ${goal.title}`}
          />
        ) : null}

        {canManage && onArchive ? (
          <Button
            title="Arquivar"
            icon="archive"
            variant="ghost"
            size="md"
            style={styles.action}
            disabled={busy}
            onPress={() => onArchive(goal)}
            accessibilityLabel={`Arquivar a meta ${goal.title}`}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  action: {
    flexGrow: 1,
  },
});
