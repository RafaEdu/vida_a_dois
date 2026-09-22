import { StyleSheet, View } from "react-native";
import { spacing } from "../../../theme";
import { BottomSheet, Button } from "../../../components/ui";
import type { TransactionEntry } from "../model";

export interface TransactionActionsSheetProps {
  entry: TransactionEntry;
  onEdit: (entry: TransactionEntry) => void;
  onTogglePaid: (entry: TransactionEntry) => void;
  onDelete: (entry: TransactionEntry) => void;
  onClose: () => void;
}

/**
 * Secondary actions for a transaction row. Editing stays on the row tap; this
 * sheet only exposes the payment toggle (expenses) and the destructive delete.
 */
export function TransactionActionsSheet({
  entry,
  onEdit,
  onTogglePaid,
  onDelete,
  onClose,
}: TransactionActionsSheetProps) {
  const isExpense = entry.kind === "expense";

  return (
    <BottomSheet
      title={entry.title}
      subtitle={entry.subtitle}
      onClose={onClose}
      visible
    >
      <View style={styles.actions}>
        <Button
          title="Editar"
          variant="secondary"
          size="md"
          icon="edit"
          fullWidth
          onPress={() => onEdit(entry)}
        />

        {isExpense ? (
          <Button
            title={entry.paid ? "Marcar como pendente" : "Marcar como paga"}
            variant="secondary"
            size="md"
            icon={entry.paid ? "remove-circle-outline" : "check-circle"}
            fullWidth
            onPress={() => onTogglePaid(entry)}
          />
        ) : null}

        <Button
          title="Excluir"
          variant="danger"
          size="md"
          icon="delete-outline"
          fullWidth
          onPress={() => onDelete(entry)}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
});
