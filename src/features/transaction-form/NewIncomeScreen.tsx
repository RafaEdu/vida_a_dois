import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../lib/auth-context";
import {
  incomeFormSchema,
  type IncomeFormInput,
  type IncomeFormValues,
} from "../../domain/finance/schemas";
import { AppText, Button, Card, Screen, SwitchRow } from "../../components/ui";
import { colors, spacing } from "../../theme";
import {
  AmountField,
  DateField,
  Field,
  FormBanner,
  FormFooter,
  TextField,
} from "./components";

export function NewIncomeScreen() {
  const { addIncome, couple } = useAuth();
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IncomeFormInput, unknown, IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    mode: "onTouched",
    defaultValues: {
      description: "",
      amount: "",
      receivedDate: "",
      isExtra: true,
    },
  });

  const onSubmit = async (values: IncomeFormValues) => {
    setSubmitError("");

    if (!couple) {
      setSubmitError("Nenhum casal vinculado.");
      return;
    }

    const { error: saveError } = await addIncome({
      description: values.description,
      amount: values.amount,
      is_extra: values.isExtra,
      received_at: values.receivedDate
        ? new Date(values.receivedDate + "T00:00:00").toISOString()
        : new Date().toISOString(),
    });

    if (saveError) {
      setSubmitError(saveError);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen
        scroll
        edges={["left", "right"]}
        contentContainerStyle={styles.content}
      >
        <AppText variant="bodySmall" color="textSecondary">
          Registre uma entrada no caixa do casal.
        </AppText>

        <FormBanner message={submitError} />

        <Field label="Valor" error={errors.amount?.message}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <AmountField
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.amount)}
                autoFocus
                accessibilityLabel="Valor da receita"
              />
            )}
          />
        </Field>

        <Field label="Descrição" error={errors.description?.message}>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextField
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Ex: Freelance, bônus, venda..."
                invalid={Boolean(errors.description)}
                returnKeyType="next"
              />
            )}
          />
        </Field>

        <Field
          label="Data de recebimento"
          hint="Opcional — informada como AAAA-MM-DD."
          error={errors.receivedDate?.message}
        >
          <Controller
            control={control}
            name="receivedDate"
            render={({ field }) => (
              <DateField
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.receivedDate)}
                accessibilityLabel="Data de recebimento"
              />
            )}
          />
        </Field>

        <Card variant="subtle" padded>
          <Controller
            control={control}
            name="isExtra"
            render={({ field }) => (
              <SwitchRow
                label="Receita extra"
                description={
                  field.value
                    ? "Renda adicional além do salário."
                    : "Registro do salário mensal."
                }
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </Card>
      </Screen>

      <FormFooter>
        <Button
          title="Salvar receita"
          icon="save"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={!isValid}
          fullWidth
        />
      </FormFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
});
