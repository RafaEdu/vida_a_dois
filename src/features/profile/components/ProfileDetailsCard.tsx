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
import type { Profile } from "../../../types/domain";
import {
  profileEditFormSchema,
  toProfileUpdateInput,
  type ProfileEditFormInput,
  type ProfileEditFormValues,
  type ProfileUpdateInput,
} from "../../../domain/account/schemas";
import { formatCurrency } from "../../../utils/currency";
import { formatDateOnlyForDisplay } from "../../../utils/date";
import { colors, fontFamilies, radius, spacing } from "../../../theme";
import { AppText, Button, Card, MoneyText } from "../../../components/ui";
import { DateInput, MoneyInput } from "../../../components/forms";

export interface ProfileDetailsCardProps {
  profile: Profile | null;
  onUpdate: (data: ProfileUpdateInput) => Promise<{ error?: string }>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="bodySmall" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="bodySmallMedium" style={styles.infoValue}>
        {value}
      </AppText>
    </View>
  );
}

export function ProfileDetailsCard({
  profile,
  onUpdate,
}: ProfileDetailsCardProps) {
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileEditFormInput, unknown, ProfileEditFormValues>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: { fullName: "", birthDate: "", income: "" },
  });

  const startEditing = () => {
    reset({
      fullName: profile?.full_name ?? "",
      birthDate: formatDateOnlyForDisplay(profile?.birth_date),
      income:
        profile?.monthly_income != null
          ? formatCurrency(profile.monthly_income)
          : "",
    });
    setSubmitError("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setSubmitError("");
    setEditing(false);
  };

  const onSubmit = async (values: ProfileEditFormValues) => {
    setSubmitError("");
    try {
      const { error } = await onUpdate(toProfileUpdateInput(values));

      if (error) {
        setSubmitError(error);
        return;
      }
      setEditing(false);
    } catch {
      setSubmitError("Erro inesperado ao salvar.");
    }
  };

  if (editing) {
    return (
      <Card padded style={styles.card}>
        {submitError ? (
          <AppText variant="bodySmall" color="danger" selectable>
            {submitError}
          </AppText>
        ) : null}

        <View style={styles.field}>
          <AppText variant="label" color="textSecondary">
            Nome completo
          </AppText>
          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <TextInput
                style={inputStyle}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Seu nome completo"
                autoComplete="name"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Nome completo"
              />
            )}
          />
          {errors.fullName?.message ? (
            <AppText variant="bodySmall" color="danger">
              {errors.fullName.message}
            </AppText>
          ) : null}
        </View>

        <View style={styles.field}>
          <AppText variant="label" color="textSecondary">
            Data de nascimento
          </AppText>
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <DateInput
                variant="br"
                style={inputStyle}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.birthDate)}
                accessibilityLabel="Data de nascimento"
              />
            )}
          />
          {errors.birthDate?.message ? (
            <AppText variant="bodySmall" color="danger">
              {errors.birthDate.message}
            </AppText>
          ) : null}
        </View>

        <View style={styles.field}>
          <AppText variant="label" color="textSecondary">
            Renda mensal líquida
          </AppText>
          <Controller
            control={control}
            name="income"
            render={({ field }) => (
              <MoneyInput
                variant="currency"
                style={inputStyle}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Renda mensal líquida"
              />
            )}
          />
          {errors.income?.message ? (
            <AppText variant="bodySmall" color="danger">
              {errors.income.message}
            </AppText>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button
            title={isSubmitting ? "Salvando..." : "Salvar"}
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
      </Card>
    );
  }

  return (
    <Card padded style={styles.card}>
      <InfoRow label="Nome" value={profile?.full_name ?? "—"} />
      {profile?.birth_date ? (
        <InfoRow
          label="Nascimento"
          value={formatDateOnlyForDisplay(profile.birth_date)}
        />
      ) : null}
      <View style={styles.infoRow}>
        <AppText variant="bodySmall" color="textSecondary">
          Renda mensal
        </AppText>
        {profile?.monthly_income != null ? (
          <MoneyText value={profile.monthly_income} variant="bodySmallMedium" />
        ) : (
          <AppText variant="bodySmallMedium" color="textSecondary">
            Não informada
          </AppText>
        )}
      </View>

      <Button
        title="Editar dados pessoais"
        icon="edit"
        variant="secondary"
        size="md"
        onPress={startEditing}
        style={styles.editButton}
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
  editButton: {
    marginTop: spacing.sm,
  },
});
