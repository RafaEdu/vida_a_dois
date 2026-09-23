import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Card } from "../../../components/ui";
import { formatElapsedSince } from "../../../utils/date";
import type { CoupleActivity } from "../../../types/domain";
import { describeActivity } from "../model";

export function ActivityItem({ activity }: { activity: CoupleActivity }) {
  const { title, description, icon } = describeActivity(activity);
  const elapsed = formatElapsedSince(activity.created_at);

  return (
    <Card padded style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <AppText variant="bodySemibold" style={styles.title}>
            {title}
          </AppText>
          {elapsed ? (
            <AppText variant="label" color="textSecondary">
              {elapsed}
            </AppText>
          ) : null}
        </View>
        <AppText variant="bodySmall" color="textSecondary">
          {description}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
});
