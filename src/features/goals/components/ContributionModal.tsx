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
import type { GoalContributionInput } from "../../../types/domain";
import {
  goalContributionFormSchema,
  type GoalContributionFormInput,
  type GoalContributionFormValues,
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

interface ContributionModalProps {
  goalTitle: string;
  onClose: () => void;
  onSave: (input: GoalContributionInput) => Promise<{ error?: string }>;
}

/**
 * Registra uma contribuição para uma meta. O valor é obrigatório e positivo; a
 * data é opcional (default = agora, definido pelo banco). A nota é livre.
 */
export function ContributionModal({
  goalTitle,
  onClose,
  onSave,
}: ContributionModalProps) {
  const reduceMotion = useReduceMotion();
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoalContributionFormInput, unknown, GoalContributionFormValues>({
    resolver: zodResolver(goalContributionFormSchema),
    defaultValues: {
      amount: "",
      contributedDate: "",
      note: "",
    },
  });

  const fieldError =
    errors.amount?.message ??
    errors.contributedDate?.message ??
    errors.note?.message;

  const onSubmit = async (values: GoalContributionFormValues) => {
    setSubmitError("");
    const { error } = await onSave({
      amount: values.amount,
      note: values.note || null,
      contributed_at: values.contributedDate
        ? `${values.contributedDate}T12:00:00.000Z`
        : undefined,
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
          <AppText variant="h3">Contribuir para a meta</AppText>
          <AppText variant="bodySmall" color="textSecondary" numberOfLines={2}>
            {goalTitle}
          </AppText>

          <FormError message={submitError || fieldError} />

          <FormField label="Valor (R$)">
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <MoneyInput
                  variant="currency"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  accessibilityLabel="Valor da contribuição"
                />
              )}
            />
          </FormField>

          <FormField
            label="Data (opcional)"
            hint="Quando o valor foi guardado."
          >
            <Controller
              control={control}
              name="contributedDate"
              render={({ field }) => (
                <DateInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  accessibilityLabel="Data da contribuição"
                />
              )}
            />
          </FormField>

          <FormField label="Observação (opcional)">
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ex.: parcela do mês"
                  accessibilityLabel="Observação da contribuição"
                  maxLength={140}
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
              title="Registrar"
              style={styles.action}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              accessibilityLabel="Registrar contribuição"
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
