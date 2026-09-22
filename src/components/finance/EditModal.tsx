import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Expense, type Income } from "../../types/domain";
import {
  expenseEditFormSchema,
  incomeEditFormSchema,
  type ExpenseEditFormInput,
  type ExpenseEditFormValues,
  type IncomeEditFormInput,
  type IncomeEditFormValues,
} from "../../domain/finance/schemas";
import { FormError, FormField, MoneyInput, TextField } from "../forms";
import { AppText, Button } from "../ui";
import { CategoryPicker } from "./CategoryPicker";
import { colors, radius, spacing } from "../../theme";
import { useReduceMotion } from "../../hooks/useReduceMotion";

export type EditTarget =
  { type: "expense"; item: Expense } | { type: "income"; item: Income } | null;

export interface ExpenseEditData {
  description: string;
  amount: number;
  category: string;
}

export interface IncomeEditData {
  description: string;
  amount: number;
}

interface EditModalProps {
  target: Exclude<EditTarget, null>;
  onClose: () => void;
  onSaveExpense: (id: string, data: ExpenseEditData) => Promise<void>;
  onSaveIncome: (id: string, data: IncomeEditData) => Promise<void>;
}

export function EditModal({
  target,
  onClose,
  onSaveExpense,
  onSaveIncome,
}: EditModalProps) {
  const reduceMotion = useReduceMotion();

  return (
    <Modal
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          {target.type === "expense" ? (
            <ExpenseEditForm
              expense={target.item}
              onClose={onClose}
              onSave={onSaveExpense}
            />
          ) : (
            <IncomeEditForm
              income={target.item}
              onClose={onClose}
              onSave={onSaveIncome}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ExpenseEditForm({
  expense,
  onClose,
  onSave,
}: {
  expense: Expense;
  onClose: () => void;
  onSave: (id: string, data: ExpenseEditData) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState("");
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseEditFormInput, unknown, ExpenseEditFormValues>({
    resolver: zodResolver(expenseEditFormSchema),
    defaultValues: {
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
    },
  });

  const fieldError =
    errors.description?.message ??
    errors.amount?.message ??
    errors.category?.message;

  const onSubmit = async (values: ExpenseEditFormValues) => {
    setSubmitError("");
    try {
      await onSave(expense.id, values);
    } catch {
      setSubmitError("Erro inesperado ao salvar.");
    }
  };

  return (
    <>
      <AppText variant="h3" style={styles.modalTitle}>
        Editar despesa
      </AppText>

      <FormError message={submitError || fieldError} />

      <FormField label="Descrição">
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Descrição"
              accessibilityLabel="Descrição da despesa"
            />
          )}
        />
      </FormField>

      <FormField label="Valor (R$)">
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <MoneyInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              accessibilityLabel="Valor da despesa"
            />
          )}
        />
      </FormField>

      <FormField label="Categoria">
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <CategoryPicker
              variant="chips"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </FormField>

      <View style={styles.modalActions}>
        <Button
          title="Cancelar"
          variant="secondary"
          style={styles.modalAction}
          onPress={onClose}
          disabled={isSubmitting}
        />
        <Button
          title="Salvar"
          style={styles.modalAction}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          accessibilityLabel="Salvar alterações"
        />
      </View>
    </>
  );
}

function IncomeEditForm({
  income,
  onClose,
  onSave,
}: {
  income: Income;
  onClose: () => void;
  onSave: (id: string, data: IncomeEditData) => Promise<void>;
}) {
  const [submitError, setSubmitError] = useState("");
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeEditFormInput, unknown, IncomeEditFormValues>({
    resolver: zodResolver(incomeEditFormSchema),
    defaultValues: {
      description: income.description,
      amount: String(income.amount),
    },
  });

  const fieldError = errors.description?.message ?? errors.amount?.message;

  const onSubmit = async (values: IncomeEditFormValues) => {
    setSubmitError("");
    try {
      await onSave(income.id, values);
    } catch {
      setSubmitError("Erro inesperado ao salvar.");
    }
  };

  return (
    <>
      <AppText variant="h3" style={styles.modalTitle}>
        Editar receita
      </AppText>

      <FormError message={submitError || fieldError} />

      <FormField label="Descrição">
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Descrição"
              accessibilityLabel="Descrição da receita"
            />
          )}
        />
      </FormField>

      <FormField label="Valor (R$)">
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <MoneyInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              accessibilityLabel="Valor da receita"
            />
          )}
        />
      </FormField>

      <View style={styles.modalActions}>
        <Button
          title="Cancelar"
          variant="secondary"
          style={styles.modalAction}
          onPress={onClose}
          disabled={isSubmitting}
        />
        <Button
          title="Salvar"
          style={styles.modalAction}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          accessibilityLabel="Salvar alterações"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    gap: spacing.md,
  },
  modalTitle: {
    marginBottom: spacing.xs,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalAction: {
    flex: 1,
  },
});
