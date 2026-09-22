import type { ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../theme";
import { AppText, Badge, MoneyText, type BadgeTone } from "../ui";

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
  style?: StyleProp<ViewStyle>;
}

/**
 * Compact transaction line shared by the Home recent list and the
 * Transactions screen. Expense/income are distinguished by the amount sign
 * and status label, never by color alone.
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
  style,
}: TransactionRowProps) {
  const isExpense = kind === "expense";
  const iconWrapStyle = isExpense ? styles.iconExpense : styles.iconIncome;
  const iconColor = isExpense ? colors.textSecondary : colors.success;
  const signedAmount = isExpense ? -amount : amount;

  const body = (
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

  if (!onPress) {
    return <View style={[styles.base, style]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle ?? ""}`}
      style={({ pressed }) => [
        styles.base,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
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
