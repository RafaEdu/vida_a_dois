import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { Profile } from "../../../types/domain";
import { spacing } from "../../../theme";
import { Button, SectionHeader } from "../../../components/ui";
import { ProfileDetailsCard } from "./ProfileDetailsCard";

export interface AccountSectionProps {
  profile: Profile | null;
  onUpdateProfile: (data: {
    full_name: string;
    monthly_income: number | null;
  }) => Promise<{ error?: string }>;
  onSignOut: () => Promise<void>;
}

export function AccountSection({
  profile,
  onUpdateProfile,
  onSignOut,
}: AccountSectionProps) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      "Sair da conta",
      "Você precisará entrar novamente com seu e-mail e senha.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            setSigningOut(true);
            try {
              await onSignOut();
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Conta" subtitle="Seus dados e acesso" />

      <ProfileDetailsCard profile={profile} onUpdate={onUpdateProfile} />

      <Button
        title="Sair da conta"
        icon="logout"
        variant="danger"
        loading={signingOut}
        onPress={handleSignOut}
        accessibilityLabel="Sair da conta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
});
