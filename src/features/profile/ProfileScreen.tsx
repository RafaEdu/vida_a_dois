import { StyleSheet, View } from "react-native";
import { useAuthSession } from "../../providers/AuthProvider";
import { useCouple } from "../../providers/CoupleProvider";
import { getInitials } from "../../utils/initials";
import { colors, spacing } from "../../theme";
import {
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from "../../components/ui";
import { ProfileIdentityCard } from "./components/ProfileIdentityCard";
import { ProfileDetailsCard } from "./components/ProfileDetailsCard";

/**
 * Área individual do usuário autenticado. Concentra apenas dados que pertencem
 * à própria pessoa — nunca informações do casal ou financeiras compartilhadas.
 */
export function ProfileScreen() {
  const { user } = useAuthSession();
  const { profile, status, error, retry, updateProfile } = useCouple();

  if (status === "error") {
    return (
      <View style={styles.root}>
        <ErrorState
          title="Não foi possível carregar seu perfil"
          message={error ?? undefined}
          onRetry={retry}
        />
      </View>
    );
  }

  if (status === "loading" && !profile) {
    return (
      <View style={styles.root}>
        <LoadingState message="Carregando seu perfil..." />
      </View>
    );
  }

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <ProfileIdentityCard
        fullName={profile?.full_name}
        email={user?.email}
        initials={getInitials(profile?.full_name, "??")}
      />

      <View style={styles.section}>
        <SectionHeader
          title="Dados pessoais"
          subtitle="Informações usadas para calcular a divisão do casal"
        />
        <ProfileDetailsCard profile={profile} onUpdate={updateProfile} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
});
