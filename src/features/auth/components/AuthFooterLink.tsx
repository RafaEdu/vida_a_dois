import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../../components/ui";
import { spacing } from "../../../theme";

export interface AuthFooterLinkProps {
  text: string;
  actionLabel: string;
  href: "/sign-in" | "/sign-up";
}

/** Secondary navigation between sign-in and sign-up. */
export function AuthFooterLink({
  text,
  actionLabel,
  href,
}: AuthFooterLinkProps) {
  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" color="textSecondary">
        {text}
      </AppText>
      <Link href={href}>
        <AppText variant="bodySmall" color="primary">
          {actionLabel}
        </AppText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
