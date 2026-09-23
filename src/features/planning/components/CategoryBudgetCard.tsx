import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { CategoryBudgetProgress } from "../../../domain/finance/categoryBudgets";
import {
  resolveCategoryBudgetBadgeTone,
  resolveCategoryBudgetProgressTone,
  resolveCategoryBudgetStatusLabel,
} from "../model";
import { getCategoryIcon } from "../../../utils/category";
import { formatCurrency } from "../../../utils/currency";
import { colors, radius, spacing } from "../../../theme";
import {
  AppText,
  Badge,
  Button,
  Card,
  MoneyText,
  ProgressBar,
} from "../../../components/ui";

interface CategoryBudgetCardProps {
  progress: CategoryBudgetProgress;
  busy?: boolean;
  readOnly?: boolean;
  onEdit?: (progress: CategoryBudgetProgress) => void;
  onRemove?: (progress: CategoryBudgetProgress) => void;
}

/**
 * Card de um limite por categoria: mostra o teto, o gasto do mês selecionado e
 * a barra de progresso. Os números vêm do domínio de `categoryBudgets`.
 */
export function CategoryBudgetCard({
  progress,
  busy = false,
  readOnly = false,
  onEdit,
  onRemove,
}: CategoryBudgetCardProps) {
  const tone = resolveCategoryBudgetProgressTone(progress.status);
  const badgeTone = resolveCategoryBudgetBadgeTone(progress.status);
  const label = resolveCategoryBudgetStatusLabel(progress.status);

  return (
    <Card padded style={styles.card}>
      <View style={styles.header}>
        <View style={styles.categoryGroup}>
          <View style={styles.iconCircle}>
            <MaterialIcons
              name={getCategoryIcon(progress.category)}
              size={18}
              color={colors.primary}
            />
          </View>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.name}>
            {progress.category}
          </AppText>
        </View>
        <Badge label={label} tone={badgeTone} />
      </View>

      <View style={styles.amountRow}>
        <MoneyText value={progress.spent} variant="bodySemibold" />
        <AppText variant="bodySmall" color="textSecondary">
          de {formatCurrency(progress.limit)}
        </AppText>
      </View>

      <ProgressBar
        value={progress.share}
        tone={tone}
        accessibilityLabel={`${progress.category}: ${progress.percentage}% do limite de ${formatCurrency(
          progress.limit,
        )}`}
      />

      <View style={styles.footer}>
        <AppText variant="bodySmall" color="textSecondary" tabular>
          {progress.percentage}% do limite
        </AppText>
        <AppText
          variant="bodySmall"
          color={progress.status === "over" ? "danger" : "textSecondary"}
        >
          {progress.status === "over"
            ? `${formatCurrency(Math.abs(progress.remaining))} acima`
            : `${formatCurrency(progress.remaining)} disponíveis`}
        </AppText>
      </View>

      {!readOnly && (onEdit || onRemove) ? (
        <View style={styles.actions}>
          {onEdit ? (
            <Button
              title="Editar"
              icon="edit"
              variant="secondary"
              size="md"
              style={styles.action}
              disabled={busy}
              onPress={() => onEdit(progress)}
              accessibilityLabel={`Editar orçamento de ${progress.category}`}
            />
          ) : null}
          {onRemove ? (
            <Button
              title="Remover"
              variant="ghost"
              size="md"
              style={styles.action}
              textStyle={styles.dangerText}
              disabled={busy}
              onPress={() => onRemove(progress)}
              accessibilityLabel={`Remover orçamento de ${progress.category}`}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  categoryGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  name: {
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
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  action: {
    flexGrow: 1,
  },
  dangerText: {
    color: colors.danger,
  },
});
