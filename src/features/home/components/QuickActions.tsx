import { StyleSheet, View } from "react-native";
import { spacing } from "../../../theme";
import { AppText, Button, SectionHeader } from "../../../components/ui";

export interface QuickActionsProps {
  onOpenPlanning: () => void;
  onOpenMonthClosing: () => void;
  monthClosingDisabled: boolean;
  monthClosingLabel: string;
  monthClosingHint?: string;
}

/**
 * Secondary shortcuts for the Home dashboard. Creating a transaction is
 * intentionally absent here because the global FAB owns that action.
 */
export function QuickActions({
  onOpenPlanning,
  onOpenMonthClosing,
  monthClosingDisabled,
  monthClosingLabel,
  monthClosingHint,
}: QuickActionsProps) {
  return (
    <View style={styles.base}>
      <SectionHeader title="Ações rápidas" />
      <View style={styles.row}>
        <Button
          title="Planejamento"
          icon="savings"
          variant="secondary"
          size="md"
          onPress={onOpenPlanning}
          style={styles.action}
        />
        <Button
          title={monthClosingLabel}
          icon="event-available"
          variant="secondary"
          size="md"
          disabled={monthClosingDisabled}
          onPress={onOpenMonthClosing}
          style={styles.action}
        />
      </View>
      {monthClosingHint ? (
        <AppText variant="bodySmall" color="textSecondary">
          {monthClosingHint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
});
