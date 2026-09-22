import {
  StyleSheet,
  Switch,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, spacing } from "../../theme";
import { AppText } from "./AppText";

export interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** Accessibility label. Falls back to `label`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: SwitchRowProps) {
  return (
    <View style={[styles.row, disabled ? styles.disabled : null, style]}>
      <View style={styles.text}>
        <AppText variant="bodyMedium">{label}</AppText>
        {description ? (
          <AppText
            variant="bodySmall"
            color="textSecondary"
            style={styles.description}
          >
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel ?? label}
        trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
        thumbColor={value ? colors.onPrimary : colors.surface}
        ios_backgroundColor={colors.surfaceMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    minHeight: 44,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  description: {
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
