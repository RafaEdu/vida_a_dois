import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../../../theme";
import { AppText, BottomSheet, Button, Chip } from "../../../components/ui";
import {
  EMPTY_TRANSACTION_FILTERS,
  type TransactionFilterState,
  type TransactionPersonFilter,
  type TransactionStatusFilter,
  type TransactionTypeFilter,
} from "../model";

export interface TransactionFiltersSheetProps {
  filters: TransactionFilterState;
  /** Type filter lives on the screen; used to hide fields the type lacks. */
  typeFilter: TransactionTypeFilter;
  categoryOptions: string[];
  partnerName: string;
  onApply: (filters: TransactionFilterState) => void;
  onClose: () => void;
}

interface FilterRowProps {
  label: string;
  children: ReactNode;
}

function FilterRow({ label, children }: FilterRowProps) {
  return (
    <View style={styles.group}>
      <AppText variant="labelCaps" color="textSecondary" caps>
        {label}
      </AppText>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

/**
 * Advanced filters for the transactions list. Only fields backed by the
 * current domain are exposed: person (`paid_by`/`user_id`), expense category
 * and expense payment status.
 */
export function TransactionFiltersSheet({
  filters,
  typeFilter,
  categoryOptions,
  partnerName,
  onApply,
  onClose,
}: TransactionFiltersSheetProps) {
  const [draft, setDraft] = useState<TransactionFilterState>(filters);

  const showExpenseOnlyFields = typeFilter !== "income";
  const partnerLabel = partnerName || "Parceiro";

  const selectPerson = (person: TransactionPersonFilter) =>
    setDraft((prev) => ({ ...prev, person }));

  const selectStatus = (status: TransactionStatusFilter) =>
    setDraft((prev) => ({ ...prev, status }));

  return (
    <BottomSheet title="Filtros" onClose={onClose} visible>
      <FilterRow label="Pessoa">
        <Chip
          label="Todos"
          selected={draft.person === "all"}
          onPress={() => selectPerson("all")}
        />
        <Chip
          label="Você"
          selected={draft.person === "self"}
          onPress={() => selectPerson("self")}
        />
        <Chip
          label={partnerLabel}
          selected={draft.person === "partner"}
          onPress={() => selectPerson("partner")}
        />
      </FilterRow>

      {showExpenseOnlyFields ? (
        <>
          <FilterRow label="Categoria">
            <Chip
              label="Todas"
              selected={draft.category === null}
              onPress={() => setDraft((prev) => ({ ...prev, category: null }))}
            />
            {categoryOptions.map((category) => (
              <Chip
                key={category}
                label={category}
                selected={draft.category === category}
                onPress={() => setDraft((prev) => ({ ...prev, category }))}
              />
            ))}
          </FilterRow>

          <FilterRow label="Status">
            <Chip
              label="Todos"
              selected={draft.status === "all"}
              onPress={() => selectStatus("all")}
            />
            <Chip
              label="Pagos"
              selected={draft.status === "paid"}
              onPress={() => selectStatus("paid")}
            />
            <Chip
              label="Pendentes"
              selected={draft.status === "pending"}
              onPress={() => selectStatus("pending")}
            />
          </FilterRow>
        </>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Limpar"
          variant="secondary"
          size="md"
          icon="filter-alt-off"
          onPress={() => setDraft(EMPTY_TRANSACTION_FILTERS)}
          style={styles.action}
        />
        <Button
          title="Aplicar"
          size="md"
          icon="check"
          onPress={() => onApply(draft)}
          style={styles.action}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
  },
});
