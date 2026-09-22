import { StyleSheet, View } from "react-native";
import { spacing } from "../../../theme";
import { AppText, Avatar, Card } from "../../../components/ui";

export interface ProfileIdentityCardProps {
  fullName: string | null | undefined;
  email: string | null | undefined;
  initials: string;
}

/**
 * Identidade individual do usuário autenticado. E-mail é somente leitura nesta
 * fase; a edição de conta e segurança pertence a uma fase própria.
 */
export function ProfileIdentityCard({
  fullName,
  email,
  initials,
}: ProfileIdentityCardProps) {
  return (
    <Card padded style={styles.card}>
      <Avatar initials={initials} tone="primary" size="xl" />

      <View style={styles.textGroup}>
        <AppText variant="h2" align="center" numberOfLines={2}>
          {fullName?.trim() || "Seu perfil"}
        </AppText>
        <AppText
          variant="bodySmall"
          color="textSecondary"
          align="center"
          selectable
          numberOfLines={1}
        >
          {email ?? "E-mail não disponível"}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.md,
  },
  textGroup: {
    alignSelf: "stretch",
    gap: spacing.xs,
  },
});
