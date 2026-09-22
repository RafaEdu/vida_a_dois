import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthSession } from "../../../providers/AuthProvider";
import {
  changePasswordFormSchema,
  type ChangePasswordFormInput,
  type ChangePasswordFormValues,
} from "../../../domain/account/schemas";
import { colors, fontFamilies, radius, spacing } from "../../../theme";
import { AppText, Button, Card } from "../../../components/ui";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <AppText variant="bodySmall" color="danger">
      {message}
    </AppText>
  );
}

/**
 * Conta e segurança da sessão individual: e-mail atual (somente leitura),
 * alteração de senha pelo fluxo oficial do Supabase e logout. Não toca em nada
 * do casal.
 */
export function AccountSecurityCard() {
  const { user, signIn, signOut, updatePassword } = useAuthSession();
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormInput, unknown, ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const startEditing = () => {
    reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setSubmitError("");
    setSuccess("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setSubmitError("");
    setEditing(false);
  };

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setSubmitError("");
    setSuccess("");

    const email = user?.email;
    if (!email) {
      setSubmitError("Sessão inválida. Entre novamente.");
      return;
    }

    // Reautenticação com o fluxo oficial (email/senha) antes de trocar a senha.
    const reauth = await signIn(email, values.currentPassword);
    if (reauth.error) {
      setSubmitError("Senha atual incorreta.");
      return;
    }

    const result = await updatePassword(values.newPassword);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setEditing(false);
    setSuccess("Senha alterada com sucesso.");
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Card padded style={styles.card}>
      <View style={styles.infoRow}>
        <AppText variant="bodySmall" color="textSecondary">
          E-mail
        </AppText>
        <AppText
          variant="bodySmallMedium"
          style={styles.infoValue}
          numberOfLines={1}
          selectable
        >
          {user?.email ?? "—"}
        </AppText>
      </View>

      {success ? (
        <AppText variant="bodySmall" color="success">
          {success}
        </AppText>
      ) : null}

      {editing ? (
        <>
          {submitError ? (
            <AppText variant="bodySmall" color="danger" selectable>
              {submitError}
            </AppText>
          ) : null}

          <View style={styles.field}>
            <AppText variant="label" color="textSecondary">
              Senha atual
            </AppText>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field }) => (
                <TextInput
                  style={inputStyle}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Senha atual"
                />
              )}
            />
            <FieldError message={errors.currentPassword?.message} />
          </View>

          <View style={styles.field}>
            <AppText variant="label" color="textSecondary">
              Nova senha
            </AppText>
            <Controller
              control={control}
              name="newPassword"
              render={({ field }) => (
                <TextInput
                  style={inputStyle}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Nova senha"
                />
              )}
            />
            <FieldError message={errors.newPassword?.message} />
          </View>

          <View style={styles.field}>
            <AppText variant="label" color="textSecondary">
              Confirmar nova senha
            </AppText>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <TextInput
                  style={inputStyle}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Confirmar nova senha"
                />
              )}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </View>

          <View style={styles.actions}>
            <Button
              title={isSubmitting ? "Alterando..." : "Alterar senha"}
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              style={styles.actionButton}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={cancelEditing}
              disabled={isSubmitting}
              style={styles.actionButton}
            />
          </View>
        </>
      ) : (
        <Button
          title="Alterar senha"
          icon="lock-outline"
          variant="secondary"
          size="md"
          onPress={startEditing}
          style={styles.fullWidth}
        />
      )}

      <Button
        title="Sair da conta"
        icon="logout"
        variant="ghost"
        size="md"
        onPress={handleSignOut}
        loading={signingOut}
        disabled={signingOut}
        style={styles.fullWidth}
        accessibilityLabel="Sair da conta"
      />
    </Card>
  );
}

const inputStyle: StyleProp<TextStyle> = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  fontSize: 16,
  fontFamily: fontFamilies.inter.medium,
  color: colors.text,
  minHeight: 52,
};

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
  },
  field: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    width: "100%",
  },
  fullWidth: {
    width: "100%",
    marginTop: spacing.xs,
  },
});
