import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { formatYearMonthLong, shiftYearMonth } from "../../utils/date";
import { spacing } from "../../theme";
import { AppText, IconButton } from "../ui";

export interface MonthPickerProps {
  /** Selected period in `YYYY-MM`. */
  value: string;
  onChange: (yearMonth: string) => void;
  /** Latest navigable period. Navigation forward is disabled at this value. */
  maxYearMonth?: string;
  /** Earliest navigable period. */
  minYearMonth?: string;
  style?: StyleProp<ViewStyle>;
}

export function MonthPicker({
  value,
  onChange,
  maxYearMonth,
  minYearMonth,
  style,
}: MonthPickerProps) {
  const canGoBack = !minYearMonth || value > minYearMonth;
  const canGoForward = !maxYearMonth || value < maxYearMonth;

  return (
    <View style={[styles.base, style]}>
      <IconButton
        icon="chevron-left"
        accessibilityLabel="Mês anterior"
        variant="soft"
        disabled={!canGoBack}
        onPress={() => onChange(shiftYearMonth(value, -1))}
      />
      <AppText
        variant="h3"
        align="center"
        tabular
        accessibilityLiveRegion="polite"
        style={styles.label}
      >
        {formatYearMonthLong(value)}
      </AppText>
      <IconButton
        icon="chevron-right"
        accessibilityLabel="Próximo mês"
        variant="soft"
        disabled={!canGoForward}
        onPress={() => onChange(shiftYearMonth(value, 1))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
});
