import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../../../theme";
import { BottomSheet, Button } from "../../../components/ui";
import { PayerSelector, type PayerOption } from "../../../components/finance";
import type { TransactionEntry } from "../model";

export interface MarkPaidSheetProps {
  entry: TransactionEntry;
  self: PayerOption;
  partner: PayerOption | null;
  submitting?: boolean;
  onConfirm: (payerId: string) => void;
  onClose: () => void;
}

/**
 * Pergunta explicitamente "Quem pagou?" antes de confirmar uma despesa como
 * paga. A decisão do pagador é obrigatória para manter a coerência entre
 * `paid` e `paid_by` no banco.
 */
export function MarkPaidSheet({
  entry,
  self,
  partner,
  submitting,
  onConfirm,
  onClose,
}: MarkPaidSheetProps) {
  const [payerId, setPayerId] = useState(self.id);

  return (
    <BottomSheet
      title="Quem pagou?"
      subtitle={entry.title}
      onClose={onClose}
      visible
    >
      <View style={styles.body}>
        <PayerSelector
          value={payerId}
          onChange={setPayerId}
          self={self}
          partner={partner}
        />
        <Button
          title="Confirmar pagamento"
          icon="check-circle"
          onPress={() => onConfirm(payerId)}
          loading={submitting}
          disabled={!payerId}
          fullWidth
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
});
