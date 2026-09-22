import type { ComponentProps, ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { formatCurrency } from "../../utils/currency";
import { colors, radius, spacing } from "../../theme";
import { AppText, Badge, IconButton, MoneyText, type BadgeTone } from "../ui";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

export interface TransactionStatus {
  label: string;
  tone: BadgeTone;
  icon?: IconName;
}

export interface TransactionRowProps {
  kind: "expense" | "income";
  title: string;
  subtitle?: string;
  meta?: string;
  amount: number;
  icon?: IconName;
  status?: TransactionStatus;
  recurring?: boolean;
  /** When omitted the row is rendered as static content. */
  onPress?: () => void;
  /** Optional overflow action (e.g. payment toggle, delete). */
  onMorePress?: () => void;
  moreAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Compact transaction line shared by the Home recent list and the
 * Transactions screen. Expense/income are distinguished by the amount sign
 * and status label, never by color alone. The overflow action is rendered as a
 * sibling of the pressable body so screen readers can reach both.
 */
export function TransactionRow({
  kind,
  title,
  subtitle,
  meta,
  amount,
  icon = "receipt",
  status,
  recurring = false,
  onPress,
  onMorePress,
  moreAccessibilityLabel,
  style,
}: TransactionRowProps) {
  const isExpense = kind === "expense";
  const iconWrapStyle = isExpense ? styles.iconExpense : styles.iconIncome;
  const iconColor = isExpense ? colors.textSecondary : colors.success;
  const signedAmount = isExpense ? -amount : amount;

  const accessibilityLabel = [
    isExpense ? "Despesa" : "Receita",
    title,
    subtitle,
    meta,
    formatCurrency(amount),
    status?.label,
    recurring ? "Recorrente" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const body: ReactNode = (
    <>
      <View style={[styles.iconBox, iconWrapStyle]}>
        <MaterialIcons name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.info}>
        <AppText variant="bodyMedium" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle || meta ? (
          <AppText variant="bodySmall" color="textSecondary" numberOfLines={1}>
            {[subtitle, meta].filter(Boolean).join(" · ")}
          </AppText>
        ) : null}
        <View style={styles.badges}>
          {recurring ? <Badge label="Recorrente" tone="neutral" /> : null}
          {status ? (
            <Badge label={status.label} tone={status.tone} icon={status.icon} />
          ) : null}
        </View>
      </View>

      <MoneyText
        value={signedAmount}
        variant="bodySemibold"
        color={isExpense ? "text" : "success"}
        signed
        style={styles.amount}
      />
    </>
  );

  return (
    <View style={[styles.base, style]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Toque para editar"
          style={({ pressed }) => [
            styles.main,
            pressed ? styles.pressed : null,
          ]}
        >
          {body}
        </Pressable>
      ) : (
        <View
          style={styles.main}
          accessible
          accessibilityLabel={accessibilityLabel}
        >
          {body}
        </View>
      )}

      {onMorePress ? (
        <IconButton
          icon="more-vert"
          size="sm"
          accessibilityLabel={
            moreAccessibilityLabel ?? `Mais opções para ${title}`
          }
          onPress={onMorePress}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconExpense: {
    backgroundColor: colors.surfaceSubtle,
  },
  iconIncome: {
    backgroundColor: colors.successSoft,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  amount: {
    textAlign: "right",
  },
});
