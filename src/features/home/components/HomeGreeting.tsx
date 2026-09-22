import { StyleSheet, View } from "react-native";
import { spacing } from "../../../theme";
import { AppText, Badge, type BadgeTone } from "../../../components/ui";

export interface HomeGreetingProps {
  /** Time-based greeting including the first name, e.g. `Bom dia, Rafa`. */
  greeting: string;
  /** Couple identity, e.g. `Rafa & Edu`. */
  coupleLabel: string;
  /** Contextual month status, e.g. `Mês aberto`. */
  monthStatus: string;
  monthStatusTone?: BadgeTone;
}

export function HomeGreeting({
  greeting,
  coupleLabel,
  monthStatus,
  monthStatusTone = "primary",
}: HomeGreetingProps) {
  return (
    <View style={styles.base}>
      <AppText variant="h1">{greeting}</AppText>
      <View style={styles.row}>
        <AppText
          variant="bodySmallMedium"
          color="textSecondary"
          numberOfLines={1}
          style={styles.couple}
        >
          {coupleLabel}
        </AppText>
        <Badge label={monthStatus} tone={monthStatusTone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  couple: {
    flex: 1,
  },
});
