import { StyleSheet, View } from "react-native";
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
import { AccountSecurityCard } from "./components/AccountSecurityCard";
import { NotificationSettingsEntry } from "../notifications/components/NotificationSettingsEntry";

/**
 * Área individual do usuário autenticado. Concentra apenas dados que pertencem
 * à própria pessoa — nunca informações do casal ou financeiras compartilhadas.
 */
export function ProfileScreen() {
  const {
    profile,
    couple,
    selfAvatarUrl,
    status,
    error,
    retry,
    updateProfile,
    uploadAvatar,
    removeAvatar,
  } = useCouple();

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
        initials={getInitials(profile?.full_name, "??")}
        avatarUrl={selfAvatarUrl}
        onUpload={uploadAvatar}
        onRemove={removeAvatar}
      />

      <View style={styles.section}>
        <SectionHeader
          title="Dados pessoais"
          subtitle="Informações usadas para calcular a divisão do casal"
        />
        <ProfileDetailsCard
          profile={profile}
          onUpdate={updateProfile}
          splitMode={couple?.split_mode ?? null}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Preferências"
          subtitle="Avisos individuais no seu aparelho"
        />
        <NotificationSettingsEntry />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Conta e segurança"
          subtitle="E-mail, senha e sessão desta conta"
        />
        <AccountSecurityCard />
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
