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
import type { FinancialGoal, FinancialGoalInput } from "../../../types/domain";
import {
  goalFormSchema,
  type GoalFormInput,
  type GoalFormValues,
} from "../../../domain/finance/schemas";
import {
  DateInput,
  FormError,
  FormField,
  MoneyInput,
  TextField,
} from "../../../components/forms";
import { AppText, Button } from "../../../components/ui";
import { colors, radius, spacing } from "../../../theme";
import { useReduceMotion } from "../../../hooks/useReduceMotion";

interface GoalModalProps {
  /** Existing goal when editing; `null` when creating a new one. */
  goal: FinancialGoal | null;
  onClose: () => void;
  onSave: (input: FinancialGoalInput) => Promise<{ error?: string }>;
}

/**
 * Cria/edita uma meta compartilhada. Só metas `active` são editáveis — a tela
 * que usa o modal já garante isso; aqui o foco é validar título, alvo e data.
 */
export function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const reduceMotion = useReduceMotion();
  const [submitError, setSubmitError] = useState("");
  const isEditing = goal != null;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormInput, unknown, GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: goal?.title ?? "",
      targetAmount: goal ? String(goal.target_amount) : "",
      targetDate: goal?.target_date ?? "",
    },
  });

  const fieldError =
    errors.title?.message ??
    errors.targetAmount?.message ??
    errors.targetDate?.message;

  const onSubmit = async (values: GoalFormValues) => {
    setSubmitError("");
    const { error } = await onSave({
      title: values.title,
      target_amount: values.targetAmount,
      target_date: values.targetDate || null,
    });
    if (error) {
      setSubmitError(error);
      return;
    }
    onClose();
  };

  return (
    <Modal
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <AppText variant="h3">
            {isEditing ? "Editar meta" : "Nova meta"}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary">
            {isEditing
              ? "Atualize os dados da meta compartilhada."
              : "Defina um objetivo do casal, como uma viagem ou reserva."}
          </AppText>

          <FormError message={submitError || fieldError} />

          <FormField label="Título">
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ex.: Viagem de fim de ano"
                  accessibilityLabel="Título da meta"
                  maxLength={80}
                />
              )}
            />
          </FormField>

          <FormField label="Valor alvo (R$)">
            <Controller
              control={control}
              name="targetAmount"
              render={({ field }) => (
                <MoneyInput
                  variant="currency"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  accessibilityLabel="Valor alvo da meta"
                />
              )}
            />
          </FormField>

          <FormField
            label="Data alvo (opcional)"
            hint="Prazo desejado para atingir a meta."
          >
            <Controller
              control={control}
              name="targetDate"
              render={({ field }) => (
                <DateInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  accessibilityLabel="Data alvo da meta"
                />
              )}
            />
          </FormField>

          <View style={styles.actions}>
            <Button
              title="Cancelar"
              variant="secondary"
              style={styles.action}
              onPress={onClose}
              disabled={isSubmitting}
            />
            <Button
              title="Salvar"
              style={styles.action}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              accessibilityLabel="Salvar meta"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    gap: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
