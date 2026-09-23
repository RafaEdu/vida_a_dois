import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { computeSplitShares } from "../../domain/finance/split";
import { colors, spacing } from "../../theme";
import { AppText, Avatar, Card, MoneyText } from "../ui";

export interface ExpenseSplitPreviewProps {
  amount: number;
  selfShare: number;
  partnerShare: number;
  selfName: string;
  selfInitials: string;
  partnerName: string;
  partnerInitials: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Read-only preview of how the couple's configured split applies to the
 * current expense amount. Percentages come from the authenticated person's
 * perspective (`resolvePartnerShares`), so self/partner are never swapped.
 */
export function ExpenseSplitPreview({
  amount,
  selfShare,
  partnerShare,
  selfName,
  selfInitials,
  partnerName,
  partnerInitials,
  style,
}: ExpenseSplitPreviewProps) {
  const { shareA, shareB } = computeSplitShares(amount, selfShare);

  return (
    <Card variant="subtle" padded style={[styles.card, style]}>
      <View style={styles.header}>
        <AppText variant="h3">Como dividir?</AppText>
        <AppText variant="bodySmall" color="textSecondary">
          Divisão padrão do casal aplicada a esta despesa
        </AppText>
      </View>

      <View style={styles.peopleRow}>
        <View style={styles.person}>
          <Avatar initials={selfInitials} tone="partnerA" size="md" />
          <AppText
            variant="bodySmallMedium"
            numberOfLines={1}
            style={styles.name}
          >
            {selfName}
          </AppText>
          <MoneyText value={shareA} variant="bodyMedium" />
          <AppText variant="label" color="textSecondary" tabular>
            {selfShare}%
          </AppText>
        </View>

        <View style={styles.divider} />

        <View style={styles.person}>
          <Avatar initials={partnerInitials} tone="partnerB" size="md" />
          <AppText
            variant="bodySmallMedium"
            numberOfLines={1}
            style={styles.name}
          >
            {partnerName}
          </AppText>
          <MoneyText value={shareB} variant="bodyMedium" />
          <AppText variant="label" color="textSecondary" tabular>
            {partnerShare}%
          </AppText>
        </View>
      </View>
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
});
