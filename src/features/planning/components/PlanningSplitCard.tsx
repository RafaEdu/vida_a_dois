import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { CoupleSplitMode } from "../../../types/domain";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Avatar, Card, MoneyText } from "../../../components/ui";

export interface PlanningSplitCardProps {
  selfName: string;
  selfInitials: string;
  partnerName: string;
  partnerInitials: string;
  selfShare: number;
  partnerShare: number;
  budget: number;
  splitMode: CoupleSplitMode;
  idealSelfShare: number | null;
  idealPartnerShare: number | null;
}

/**
 * Shows how the monthly budget is split between the two partners, plus the
 * income-based ideal split when both incomes are available. Percentages are
 * shown from the authenticated person's perspective (see `resolvePartnerShares`).
 */
export function PlanningSplitCard({
  selfName,
  selfInitials,
  partnerName,
  partnerInitials,
  selfShare,
  partnerShare,
  budget,
  splitMode,
  idealSelfShare,
  idealPartnerShare,
}: PlanningSplitCardProps) {
  const selfAmount = budget * (selfShare / 100);
  const partnerAmount = budget * (partnerShare / 100);
  const differsFromIdeal =
    idealSelfShare != null && selfShare !== idealSelfShare;

  return (
    <Card padded style={styles.card}>
      <View style={styles.header}>
        <AppText variant="h3">Divisão de custos</AppText>
        <AppText variant="bodySmall" color="textSecondary">
          {splitMode === "income_based"
            ? "Proporcional à renda do casal"
            : "Divisão manual definida pelo casal"}
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
            {selfShare}%
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
            {partnerShare}%
          </AppText>
          <MoneyText
            value={partnerAmount}
            variant="bodySmall"
            color="textSecondary"
          />
        </View>
      </View>

      {idealSelfShare != null && idealPartnerShare != null ? (
        <View style={styles.idealBox}>
          <View style={styles.idealHeader}>
            <MaterialIcons name="auto-graph" size={16} color={colors.primary} />
            <AppText variant="bodySmallMedium">
              Divisão ideal pela renda
            </AppText>
          </View>
          <AppText variant="bodySmall" color="textSecondary" tabular>
            {selfName}: {idealSelfShare}% · {partnerName}: {idealPartnerShare}%
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
                color="onWarningSoft"
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
