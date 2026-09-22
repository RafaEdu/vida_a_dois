import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../theme";
import { getCategoryIcon } from "../../utils/category";
import { AppText, Card, MoneyText, ProgressBar } from "../ui";

export interface BudgetCategoryCardProps {
  category: string;
  amount: number;
  /**
   * Monthly budget used as the reference for the progress bar. There is no
   * per-category limit in the current domain, so `0` means "no ceiling".
   */
  budget: number;
}

/**
 * Presentational card for a single expense category inside Planejamento. All
 * numbers come from the existing finance selectors; this card only formats and
 * communicates the progress.
 */
export function BudgetCategoryCard({
  category,
  amount,
  budget,
}: BudgetCategoryCardProps) {
  const hasBudget = budget > 0;
  const share = hasBudget ? amount / budget : 0;
  const percentage = Math.round(share * 100);
  const tone = share >= 1 ? "danger" : share >= 0.8 ? "warning" : "primary";

  return (
    <Card padded padding="md" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.categoryGroup}>
          <View style={styles.iconCircle}>
            <MaterialIcons
              name={getCategoryIcon(category)}
              size={18}
              color={colors.primary}
            />
          </View>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.name}>
            {category}
          </AppText>
        </View>
        <MoneyText value={amount} variant="bodySemibold" />
      </View>

      {hasBudget ? (
        <View style={styles.progressBlock}>
          <ProgressBar
            value={share}
            tone={tone}
            accessibilityLabel={`${category}: ${percentage}% do orçamento mensal`}
          />
          <View style={styles.footer}>
            <AppText variant="bodySmall" color="textSecondary" tabular>
              {percentage}% do orçamento
            </AppText>
            {share >= 1 ? (
              <AppText variant="bodySmall" color="danger">
                Acima do orçamento do mês
              </AppText>
            ) : null}
          </View>
        </View>
      ) : (
        <AppText variant="bodySmall" color="textSecondary">
          Sem teto definido para este mês
        </AppText>
      )}
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
  progressBlock: {
    gap: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
});
