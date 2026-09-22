import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../../theme";

export type ProgressTone = "primary" | "success" | "warning" | "danger";

export interface ProgressBarProps {
  /** Progress between 0 and 1. Values above 1 are clamped for rendering. */
  value: number;
  tone?: ProgressTone;
  height?: number;
  /** Accessible description of what is being measured. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const toneColors: Record<ProgressTone, string> = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

export function ProgressBar({
  value,
  tone = "primary",
  height = 8,
  accessibilityLabel,
  style,
  testID,
}: ProgressBarProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const clamped = Math.min(Math.max(safeValue, 0), 1);
  const percentage = Math.round(Math.max(safeValue, 0) * 100);

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: toneColors[tone],
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
