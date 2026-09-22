import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../lib/auth-context";
import { DEFAULT_CATEGORIES } from "../../constants/categories";
import {
  expenseFormSchema,
  type ExpenseFormInput,
  type ExpenseFormValues,
} from "../../domain/finance/schemas";
import {
  CategoryPicker,
  ExpenseSplitPreview,
  PayerSelector,
} from "../../components/finance";
import { AppText, Button, Card, Screen, SwitchRow } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { parseDecimalInput } from "../../utils/currency";
import { hapticSuccess } from "../../utils/haptics";
import { getInitials } from "../../utils/initials";
import {
  DateInput,
  FormError,
  FormField,
  TextField,
} from "../../components/forms";
import { AmountField, FormFooter } from "./components";

export function NewExpenseScreen() {
  const { addExpense, couple, user, profile, partnerInfo } = useAuth();
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    mode: "onTouched",
    defaultValues: {
      description: "",
      amount: "",
      category: DEFAULT_CATEGORIES[0].name,
      dueDate: "",
      paidBy: user?.id ?? "",
      isRecurring: false,
      paid: false,
    },
  });

  const amount = useWatch({ control, name: "amount" }) ?? "";
  const amountValue = parseDecimalInput(amount);

  const splitA = couple?.split_ratio_a ?? 50;
  const splitB = couple?.split_ratio_b ?? 50;
  const selfName = profile?.full_name ?? "Você";

  const onSubmit = async (values: ExpenseFormValues) => {
    setSubmitError("");

    if (!couple) {
      setSubmitError("Nenhum casal vinculado.");
      return;
    }

    const { error: saveError } = await addExpense({
      description: values.description,
      amount: values.amount,
      category: values.category,
      due_date: values.dueDate || undefined,
      paid: values.paid,
      paid_by: values.paidBy,
      is_recurring: values.isRecurring,
    });

    if (saveError) {
      setSubmitError(saveError);
    } else {
      void hapticSuccess();
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
          Registre um gasto no planejamento do casal.
        </AppText>

        <FormError message={submitError} />

        <FormField label="Valor" error={errors.amount?.message}>
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
              />
            )}
          />
        </FormField>

        <FormField label="Descrição" error={errors.description?.message}>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextField
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Ex: Supermercado do mês"
                invalid={Boolean(errors.description)}
                returnKeyType="next"
              />
            )}
          />
        </FormField>

        <FormField label="Categoria" error={errors.category?.message}>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <CategoryPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>

        <FormField label="Quem pagou?" error={errors.paidBy?.message}>
          <Controller
            control={control}
            name="paidBy"
            render={({ field }) => (
              <PayerSelector
                value={field.value}
                onChange={field.onChange}
                self={{ id: user?.id ?? "", full_name: selfName }}
                partner={
                  partnerInfo
                    ? { id: partnerInfo.id, full_name: partnerInfo.full_name }
                    : null
                }
              />
            )}
          />
        </FormField>

        {partnerInfo ? (
          <ExpenseSplitPreview
            amount={amountValue}
            splitA={splitA}
            splitB={splitB}
            selfName={selfName}
            selfInitials={getInitials(selfName, "EU")}
            partnerName={partnerInfo.full_name}
            partnerInitials={getInitials(partnerInfo.full_name, "??")}
          />
        ) : null}

        <FormField
          label="Data de vencimento"
          hint="Opcional — informada como AAAA-MM-DD."
          error={errors.dueDate?.message}
        >
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DateInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.dueDate)}
              />
            )}
          />
        </FormField>

        <Card variant="subtle" padded style={styles.toggles}>
          <Controller
            control={control}
            name="paid"
            render={({ field }) => (
              <SwitchRow
                label="Já foi pago?"
                description={
                  field.value
                    ? "O valor já saiu do caixa."
                    : "Fica pendente até a confirmação."
                }
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="isRecurring"
            render={({ field }) => (
              <SwitchRow
                label="Despesa recorrente"
                description={
                  field.value
                    ? "Gasto fixo mensal (ex: aluguel, internet)."
                    : "Gasto pontual ou variável."
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
          title="Salvar despesa"
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
  toggles: {
    gap: spacing.md,
  },
});
