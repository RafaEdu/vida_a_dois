import { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { spacing } from "../../../theme";
import { AppText, Avatar, Button, Card } from "../../../components/ui";
import {
  validateAvatarAsset,
  type AvatarPickerAsset,
} from "../../../domain/account/avatar";

export interface ProfileIdentityCardProps {
  fullName: string | null | undefined;
  initials: string;
  avatarUrl: string | null;
  onUpload: (asset: AvatarPickerAsset) => Promise<{ error?: string }>;
  onRemove: () => Promise<{ error?: string }>;
}

/**
 * Identidade e avatar do usuário autenticado. O e-mail e a segurança ficam na
 * seção "Conta e segurança"; aqui só vive o que é a pessoa.
 */
export function ProfileIdentityCard({
  fullName,
  initials,
  avatarUrl,
  onUpload,
  onRemove,
}: ProfileIdentityCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePickAvatar = async () => {
    setError("");
    setSuccess("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permita o acesso às fotos para escolher uma imagem.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const validation = validateAvatarAsset(asset);
    if (validation.error || !validation.value) {
      setError(validation.error ?? "Imagem inválida.");
      return;
    }

    setBusy(true);
    try {
      const response = await onUpload(asset);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess("Foto de perfil atualizada.");
    } catch {
      setError("Erro inesperado ao enviar a foto.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const response = await onRemove();
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess("Foto de perfil removida.");
    } catch {
      setError("Erro inesperado ao remover a foto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padded style={styles.card}>
      <Avatar
        initials={initials}
        uri={avatarUrl}
        tone="primary"
        size="2xl"
        accessibilityLabel="Foto de perfil"
      />

      <View style={styles.actions}>
        <Button
          title={avatarUrl ? "Alterar foto" : "Adicionar foto"}
          icon="photo-camera"
          variant="secondary"
          size="md"
          onPress={handlePickAvatar}
          loading={busy}
          disabled={busy}
          style={styles.actionButton}
          accessibilityLabel="Alterar foto de perfil"
        />
        {avatarUrl ? (
          <Button
            title="Remover foto"
            icon="delete-outline"
            variant="ghost"
            size="md"
            onPress={handleRemoveAvatar}
            disabled={busy}
            style={styles.actionButton}
            accessibilityLabel="Remover foto de perfil"
          />
        ) : null}
      </View>

      {error ? (
        <AppText variant="bodySmall" color="danger" align="center" selectable>
          {error}
        </AppText>
      ) : null}
      {success ? (
        <AppText variant="bodySmall" color="success" align="center">
          {success}
        </AppText>
      ) : null}

      <View style={styles.textGroup}>
        <AppText variant="h2" align="center" numberOfLines={2}>
          {fullName?.trim() || "Seu perfil"}
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 160,
  },
  textGroup: {
    alignSelf: "stretch",
    gap: spacing.xs,
  },
});
