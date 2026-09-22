import { StyleSheet, View } from "react-native";
import type { CategoryIconName } from "../../../utils/category";
import { colors, spacing } from "../../../theme";
import {
  EmptyState,
  LoadingState,
  SectionHeader,
} from "../../../components/ui";
import {
  TransactionRow,
  type TransactionStatus,
} from "../../../components/finance";

export interface RecentTransactionItem {
  id: string;
  kind: "expense" | "income";
  title: string;
  subtitle?: string;
  meta?: string;
  amount: number;
  icon: CategoryIconName;
  status: TransactionStatus;
  recurring?: boolean;
}

export interface RecentTransactionsProps {
  items: RecentTransactionItem[];
  loading: boolean;
  onSeeAll: () => void;
}

export function RecentTransactions({
  items,
  loading,
  onSeeAll,
}: RecentTransactionsProps) {
  return (
    <View style={styles.base}>
      <SectionHeader
        title="Lançamentos recentes"
        actionLabel="Ver lançamentos"
        onActionPress={onSeeAll}
      />

      {loading ? (
        <LoadingState inline message="Carregando lançamentos..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon="receipt-long"
          title="Nenhum lançamento neste período"
          description="Use o botão + para registrar uma despesa ou receita."
        />
      ) : (
        <View>
          {items.map((item, index) => (
            <TransactionRow
              key={item.id}
              kind={item.kind}
              title={item.title}
              subtitle={item.subtitle}
              meta={item.meta}
              amount={item.amount}
              icon={item.icon}
              status={item.status}
              recurring={item.recurring}
              style={index < items.length - 1 ? styles.divider : undefined}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    gap: spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
