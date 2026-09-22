import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../lib/auth-context";
import { useOnboardingDraft } from "../../hooks/useOnboardingDraft";
import { parseCurrencyInput } from "../../utils/currency";
import { parseBirthDateToISO } from "../../utils/date";
import {
  profileSetupFormSchema,
  type ProfileSetupFormInput,
  type ProfileSetupFormValues,
} from "../../domain/account/schemas";
import {
  DateInput,
  FormError,
  FormField,
  MoneyInput,
  TextField,
} from "../../components/forms";
import { Button, Screen } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { OnboardingHeader } from "./components";

export function ProfileSetupScreen() {
  const { saveProfile } = useAuth();
  const [submitError, setSubmitError] = useState("");
  const { draft, loaded, persist, clear } = useOnboardingDraft();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSetupFormInput, unknown, ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupFormSchema),
    defaultValues: { fullName: "", birthDate: "", income: "" },
  });

  const fullName = useWatch({ control, name: "fullName" }) ?? "";
  const birthDate = useWatch({ control, name: "birthDate" }) ?? "";
  const income = useWatch({ control, name: "income" }) ?? "";

  useEffect(() => {
    if (!loaded) return;
    reset({
      fullName: draft.fullName ?? "",
      birthDate: draft.birthDate ?? "",
      income: draft.income ?? "",
    });
  }, [loaded, draft, reset]);

  useEffect(() => {
    if (!loaded) return;
    persist({ fullName, birthDate, income });
  }, [loaded, fullName, birthDate, income, persist]);

  const onSubmit = async (values: ProfileSetupFormValues) => {
    setSubmitError("");

    const isoDate = parseBirthDateToISO(values.birthDate);
    if (!isoDate) {
      setSubmitError("Informe uma data de nascimento válida (DD/MM/AAAA).");
      return;
    }

    const { error: saveError } = await saveProfile({
      full_name: values.fullName,
      birth_date: isoDate,
      monthly_income: values.income
        ? parseCurrencyInput(values.income)
        : undefined,
    });

    if (saveError) {
      setSubmitError(saveError);
    } else {
      clear();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen
        scroll
        padded
        edges={["top", "left", "right", "bottom"]}
        contentContainerStyle={styles.content}
      >
        <OnboardingHeader
          step="Etapa 2 de 2"
          title="Seu perfil"
          subtitle="Conte um pouco sobre você para seu parceiro"
        />

        <FormError message={submitError} />

        <FormField label="Nome completo" error={errors.fullName?.message}>
          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <TextField
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Seu nome completo"
                autoComplete="name"
                returnKeyType="next"
                invalid={Boolean(errors.fullName)}
              />
            )}
          />
        </FormField>

        <FormField label="Data de nascimento" error={errors.birthDate?.message}>
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <DateInput
                variant="br"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                accessibilityLabel="Data de nascimento"
              />
            )}
          />
        </FormField>

        <FormField
          label="Renda mensal líquida"
          hint="Pode preencher depois — vamos perguntar isso no planejamento"
          error={errors.income?.message}
        >
          <Controller
            control={control}
            name="income"
            render={({ field }) => (
              <MoneyInput
                variant="currency"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                accessibilityLabel="Renda mensal líquida"
              />
            )}
          />
        </FormField>

        <Button
          title={isSubmitting ? "Salvando..." : "Salvar e continuar"}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
});
