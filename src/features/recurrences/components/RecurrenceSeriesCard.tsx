import { StyleSheet, View } from "react-native";
import type { RecurrenceSeries } from "../../../types/domain";
import {
  formatRecurrenceFrequency,
  resolveNextOccurrenceLabel,
  resolveRecurrenceStatus,
} from "../model";
import {
  AppText,
  Badge,
  Button,
  Card,
  MoneyText,
} from "../../../components/ui";
import { colors, spacing } from "../../../theme";

interface RecurrenceSeriesCardProps {
  series: RecurrenceSeries;
  busy?: boolean;
  onEdit: (series: RecurrenceSeries) => void;
  onToggleActive: (series: RecurrenceSeries) => void;
  onEnd: (series: RecurrenceSeries) => void;
}

export function RecurrenceSeriesCard({
  series,
  busy = false,
  onEdit,
  onToggleActive,
  onEnd,
}: RecurrenceSeriesCardProps) {
  const status = resolveRecurrenceStatus(series);

  return (
    <Card padded style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <AppText variant="bodySemibold" numberOfLines={1}>
            {series.description}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary">
            {series.category} · {formatRecurrenceFrequency(series.frequency)}
          </AppText>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <View style={styles.amountRow}>
        <MoneyText value={series.amount} variant="h3" />
        <AppText variant="bodySmall" color="textSecondary">
          {resolveNextOccurrenceLabel(series.next_due_date)}
        </AppText>
      </View>

      <View style={styles.actions}>
        <Button
          title="Editar"
          icon="edit"
          variant="secondary"
          size="md"
          style={styles.action}
          disabled={busy}
          onPress={() => onEdit(series)}
          accessibilityLabel={`Editar recorrência ${series.description}`}
        />
        <Button
          title={series.active ? "Pausar" : "Reativar"}
          variant="ghost"
          size="md"
          style={styles.action}
          disabled={busy}
          onPress={() => onToggleActive(series)}
          accessibilityLabel={
            series.active
              ? `Pausar recorrência ${series.description}`
              : `Reativar recorrência ${series.description}`
          }
        />
        <Button
          title="Encerrar"
          variant="ghost"
          size="md"
          style={styles.action}
          textStyle={styles.dangerText}
          disabled={busy}
          onPress={() => onEnd(series)}
          accessibilityLabel={`Encerrar recorrência ${series.description}`}
        />
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
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
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
