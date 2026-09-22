import { StyleSheet, View } from "react-native";
import {
  Avatar,
  Badge,
  type AvatarTone,
  type BadgeTone,
} from "../../../components/ui";
import { colors, spacing } from "../../../theme";

export interface ConnectionAvatar {
  initials: string;
  tone?: AvatarTone;
  label?: string;
  labelTone?: BadgeTone;
  empty?: boolean;
}

export interface PartnerConnectionProps {
  left: ConnectionAvatar;
  right: ConnectionAvatar;
  connected?: boolean;
  accessibilityLabel?: string;
}

function AvatarCell({ avatar }: { avatar: ConnectionAvatar }) {
  return (
    <View style={styles.cell}>
      <Avatar
        initials={avatar.empty ? "?" : avatar.initials}
        tone={avatar.tone ?? (avatar.empty ? "neutral" : "primary")}
        size="xl"
      />
      {avatar.label ? (
        <Badge
          label={avatar.label}
          tone={avatar.labelTone ?? "warning"}
          style={styles.badge}
        />
      ) : null}
    </View>
  );
}

/** Symmetric representation of the two partners and their link state. */
export function PartnerConnection({
  left,
  right,
  connected = false,
  accessibilityLabel,
}: PartnerConnectionProps) {
  return (
    <View
      style={styles.row}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <AvatarCell avatar={left} />
      <View style={styles.connector}>
        <View style={connected ? styles.lineConnected : styles.lineDashed} />
      </View>
      <AvatarCell avatar={right} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  cell: {
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    marginTop: spacing.xs,
  },
  connector: {
    width: 48,
    alignSelf: "flex-start",
    // Aligns the line with the vertical center of the 64px avatars.
    marginTop: 31,
  },
  lineDashed: {
    height: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  lineConnected: {
    height: 2,
    backgroundColor: colors.primary,
  },
});
