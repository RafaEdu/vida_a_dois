import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Avatar, Badge, Card } from "../../../components/ui";
import type { CoupleLinkSummary } from "../model";

export interface CoupleSummaryProps {
  coupleName: string;
  selfInitials: string;
  partnerInitials: string;
  selfAvatarUrl?: string | null;
  partnerAvatarUrl?: string | null;
  link: CoupleLinkSummary;
}

export function CoupleSummary({
  coupleName,
  selfInitials,
  partnerInitials,
  selfAvatarUrl,
  partnerAvatarUrl,
  link,
}: CoupleSummaryProps) {
  return (
    <Card padded style={styles.card}>
      <View style={styles.avatars}>
        <Avatar
          initials={selfInitials}
          uri={selfAvatarUrl}
          tone="partnerA"
          size="xl"
        />
        <View
          style={styles.linkIcon}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MaterialIcons name="favorite" size={18} color={colors.partnerA} />
        </View>
        <Avatar
          initials={partnerInitials}
          uri={partnerAvatarUrl}
          tone="partnerB"
          size="xl"
        />
      </View>

      <AppText variant="h2" align="center">
        {coupleName}
      </AppText>

      <View style={styles.badge}>
        <Badge
          label={link.statusLabel}
          tone={link.statusTone}
          icon={link.statusTone === "success" ? "check-circle" : "schedule"}
        />
      </View>

      {link.elapsedLabel ? (
        <AppText variant="bodySmall" color="textSecondary" align="center">
          Conectados {link.elapsedLabel}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.md,
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSubtle,
  },
  badge: {
    alignItems: "center",
  },
});
