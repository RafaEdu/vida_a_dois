import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { IdealSplit } from "../../../types/domain";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Avatar, Card, MoneyText } from "../../../components/ui";

export interface PlanningSplitCardProps {
  selfName: string;
  selfInitials: string;
  partnerName: string;
  partnerInitials: string;
  splitA: number;
  splitB: number;
  budget: number;
  idealSplit: IdealSplit | null;
}

/**
 * Shows how the monthly budget is split between the two partners, plus the
 * income-based ideal split when the service returns one. The split amounts are
 * the same display derived from `split_ratio_a/b` used before the redesign.
 */
export function PlanningSplitCard({
  selfName,
  selfInitials,
  partnerName,
  partnerInitials,
  splitA,
  splitB,
  budget,
  idealSplit,
}: PlanningSplitCardProps) {
  const selfAmount = budget * (splitA / 100);
  const partnerAmount = budget * (splitB / 100);
  const differsFromIdeal = idealSplit != null && splitA !== idealSplit.ratio_a;

  return (
    <Card padded style={styles.card}>
      <View style={styles.header}>
        <AppText variant="h3">Divisão de custos</AppText>
        <AppText variant="bodySmall" color="textSecondary">
          Como o orçamento mensal é dividido entre vocês
        </AppText>
      </View>

      <View style={styles.peopleRow}>
        <View style={styles.person}>
          <Avatar initials={selfInitials} tone="partnerA" size="lg" />
          <AppText
            variant="bodySmallMedium"
            numberOfLines={1}
            style={styles.name}
          >
            {selfName}
          </AppText>
          <AppText variant="h3" color="primary" tabular>
            {splitA}%
          </AppText>
          <MoneyText
            value={selfAmount}
            variant="bodySmall"
            color="textSecondary"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.person}>
          <Avatar initials={partnerInitials} tone="partnerB" size="lg" />
          <AppText
            variant="bodySmallMedium"
            numberOfLines={1}
            style={styles.name}
          >
            {partnerName}
          </AppText>
          <AppText variant="h3" color="primary" tabular>
            {splitB}%
          </AppText>
          <MoneyText
            value={partnerAmount}
            variant="bodySmall"
            color="textSecondary"
          />
        </View>
      </View>

      {idealSplit ? (
        <View style={styles.idealBox}>
          <View style={styles.idealHeader}>
            <MaterialIcons name="auto-graph" size={16} color={colors.primary} />
            <AppText variant="bodySmallMedium">
              Divisão ideal pela renda
            </AppText>
          </View>
          <AppText variant="bodySmall" color="textSecondary" tabular>
            {selfName}: {idealSplit.ratio_a}% · {partnerName}:{" "}
            {idealSplit.ratio_b}%
          </AppText>
          {differsFromIdeal ? (
            <View style={styles.warningRow}>
              <MaterialIcons
                name="info-outline"
                size={14}
                color={colors.warning}
              />
              <AppText
                variant="bodySmall"
                color="warning"
                style={styles.warningText}
              >
                A divisão atual difere da ideal. Edite o planejamento para
                ajustá-la.
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  person: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  name: {
    maxWidth: 120,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  idealBox: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  idealHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  warningText: {
    flex: 1,
  },
});
