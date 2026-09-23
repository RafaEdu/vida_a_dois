import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { CategoryBudgetProgress } from "../../../domain/finance/categoryBudgets";
import {
  resolveCategoryBudgetBadgeTone,
  resolveCategoryBudgetProgressTone,
} from "../../planning/model";
import { getCategoryIcon } from "../../../utils/category";
import { formatCurrency } from "../../../utils/currency";
import { colors, spacing } from "../../../theme";
import {
  AppText,
  Badge,
  Button,
  Card,
  ProgressBar,
  SectionHeader,
} from "../../../components/ui";

interface CategoryBudgetHighlightsProps {
  /** Categories at/above the warning threshold, most critical first. */
  highlights: CategoryBudgetProgress[];
  /** Whether the couple has any category limit configured. */
  hasBudgets: boolean;
  onManage: () => void;
}

/**
 * Bloco da Home com as categorias que estão perto ou acima do limite do mês.
 * Quando não há limites configurados, oferece um convite útil para defini-los.
 */
export function CategoryBudgetHighlights({
  highlights,
  hasBudgets,
  onManage,
}: CategoryBudgetHighlightsProps) {
  if (!hasBudgets) {
    return (
      <View style={styles.section}>
        <SectionHeader
          title="Orçamento por categoria"
          subtitle="Acompanhe o limite de cada tipo de gasto"
        />
        <Card padded style={styles.emptyCard}>
          <AppText variant="bodySmall" color="textSecondary">
            Defina limites para Mercado, Moradia, Transporte e outras categorias
            para ver o progresso do mês aqui.
          </AppText>
          <Button
            title="Definir orçamentos"
            icon="add"
            variant="secondary"
            size="md"
            onPress={onManage}
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Orçamento por categoria"
        subtitle="Categorias perto ou acima do limite"
      />
      {highlights.length === 0 ? (
        <Card padded style={styles.emptyCard}>
          <View style={styles.okRow}>
            <MaterialIcons
              name="check-circle"
              size={18}
              color={colors.success}
            />
            <AppText variant="bodySmall" color="textSecondary">
              Todas as categorias estão dentro do limite neste mês.
            </AppText>
          </View>
        </Card>
      ) : (
        <View style={styles.list}>
          {highlights.map((progress) => (
            <Card key={progress.id} padded padding="md" style={styles.item}>
              <View style={styles.itemHeader}>
                <View style={styles.itemCategory}>
                  <MaterialIcons
                    name={getCategoryIcon(progress.category)}
                    size={18}
                    color={colors.primary}
                  />
                  <AppText
                    variant="bodyMedium"
                    numberOfLines={1}
                    style={styles.itemName}
                  >
                    {progress.category}
                  </AppText>
                </View>
                <Badge
                  label={`${progress.percentage}%`}
                  tone={resolveCategoryBudgetBadgeTone(progress.status)}
                />
              </View>
              <ProgressBar
                value={progress.share}
                tone={resolveCategoryBudgetProgressTone(progress.status)}
                accessibilityLabel={`${progress.category}: ${progress.percentage}% do limite de ${formatCurrency(
                  progress.limit,
                )}`}
              />
              <AppText variant="bodySmall" color="textSecondary">
                {formatCurrency(progress.spent)} de{" "}
                {formatCurrency(progress.limit)}
              </AppText>
            </Card>
          ))}
        </View>
      )}
      <Button
        title="Ver orçamentos por categoria"
        icon="edit"
        variant="ghost"
        size="md"
        onPress={onManage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  emptyCard: {
    gap: spacing.md,
  },
  okRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  itemCategory: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
  },
});
