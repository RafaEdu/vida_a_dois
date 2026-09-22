import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
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
import { MoneyInput } from "../forms";
import { CategoryPicker } from "./CategoryPicker";
import { C } from "../../theme/colors";
import { styles } from "../../styles/expenses";

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
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
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
      <Text style={styles.modalTitle}>Editar despesa</Text>

      {submitError || fieldError ? (
        <Text style={styles.modalError}>{submitError || fieldError}</Text>
      ) : null}

      <Text style={styles.modalLabel}>Descrição</Text>
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextInput
            style={styles.modalInput}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="Descrição"
            placeholderTextColor={C.outlineVariant}
          />
        )}
      />

      <Text style={styles.modalLabel}>Valor (R$)</Text>
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <MoneyInput
            style={styles.modalInput}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Text style={styles.modalLabel}>Categoria</Text>
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

      <View style={styles.modalActions}>
        <Pressable style={styles.modalCancel} onPress={onClose}>
          <Text style={styles.modalCancelText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.modalSave, isSubmitting && styles.modalSaveDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={styles.modalSaveText}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Text>
        </Pressable>
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
      <Text style={styles.modalTitle}>Editar receita</Text>

      {submitError || fieldError ? (
        <Text style={styles.modalError}>{submitError || fieldError}</Text>
      ) : null}

      <Text style={styles.modalLabel}>Descrição</Text>
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextInput
            style={styles.modalInput}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="Descrição"
            placeholderTextColor={C.outlineVariant}
          />
        )}
      />

      <Text style={styles.modalLabel}>Valor (R$)</Text>
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <MoneyInput
            style={styles.modalInput}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <View style={styles.modalActions}>
        <Pressable style={styles.modalCancel} onPress={onClose}>
          <Text style={styles.modalCancelText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.modalSave, isSubmitting && styles.modalSaveDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={styles.modalSaveText}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
