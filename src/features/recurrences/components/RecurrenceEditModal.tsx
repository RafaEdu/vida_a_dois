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
import type {
  RecurrenceSeries,
  RecurrenceSeriesInput,
} from "../../../types/domain";
import {
  recurrenceEditFormSchema,
  type RecurrenceEditFormInput,
  type RecurrenceEditFormValues,
} from "../../../domain/finance/schemas";
import { CategoryPicker } from "../../../components/finance";
import {
  FormError,
  FormField,
  MoneyInput,
  TextField,
} from "../../../components/forms";
import { AppText, Button } from "../../../components/ui";
import { colors, radius, spacing } from "../../../theme";
import { useReduceMotion } from "../../../hooks/useReduceMotion";

interface RecurrenceEditModalProps {
  series: RecurrenceSeries;
  onClose: () => void;
  onSave: (
    id: string,
    input: RecurrenceSeriesInput,
  ) => Promise<{ error?: string }>;
}

/**
 * Edita o template da série (descrição, valor e categoria) usado nas próximas
 * ocorrências. Meses já fechados não são tocados (garantido no servidor).
 */
export function RecurrenceEditModal({
  series,
  onClose,
  onSave,
}: RecurrenceEditModalProps) {
  const reduceMotion = useReduceMotion();
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecurrenceEditFormInput, unknown, RecurrenceEditFormValues>({
    resolver: zodResolver(recurrenceEditFormSchema),
    defaultValues: {
      description: series.description,
      amount: String(series.amount),
      category: series.category,
    },
  });

  const fieldError =
    errors.description?.message ??
    errors.amount?.message ??
    errors.category?.message;

  const onSubmit = async (values: RecurrenceEditFormValues) => {
    setSubmitError("");
    const { error } = await onSave(series.id, values);
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
          <AppText variant="h3">Editar recorrência</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            As próximas ocorrências passam a usar este template.
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
                  placeholder="Ex: Aluguel"
                  accessibilityLabel="Descrição da recorrência"
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
                  accessibilityLabel="Valor da recorrência"
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
              accessibilityLabel="Salvar recorrência"
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
