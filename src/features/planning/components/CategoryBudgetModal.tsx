import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CategoryBudget,
  CategoryBudgetInput,
} from "../../../types/domain";
import {
  categoryBudgetFormSchema,
  type CategoryBudgetFormInput,
  type CategoryBudgetFormValues,
} from "../../../domain/finance/schemas";
import { getCategoryIcon } from "../../../utils/category";
import { FormError, FormField, MoneyInput } from "../../../components/forms";
import { AppText, Button, Chip } from "../../../components/ui";
import { colors, radius, spacing } from "../../../theme";
import { useReduceMotion } from "../../../hooks/useReduceMotion";

interface CategoryBudgetModalProps {
  /** Existing budget when editing; `null` when creating a new one. */
  budget: CategoryBudget | null;
  /** Category names still available to receive a new limit. */
  availableCategories: string[];
  onClose: () => void;
  onSave: (input: CategoryBudgetInput) => Promise<{ error?: string }>;
}

/**
 * Cria/edita o limite mensal de uma categoria. Ao editar, a categoria é a
 * identidade (unicidade casal/categoria no banco) e não pode ser trocada.
 */
export function CategoryBudgetModal({
  budget,
  availableCategories,
  onClose,
  onSave,
}: CategoryBudgetModalProps) {
  const reduceMotion = useReduceMotion();
  const [submitError, setSubmitError] = useState("");
  const isEditing = budget != null;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryBudgetFormInput, unknown, CategoryBudgetFormValues>({
    resolver: zodResolver(categoryBudgetFormSchema),
    defaultValues: {
      category: budget?.category ?? availableCategories[0] ?? "",
      amount: budget ? String(budget.monthly_amount) : "",
    },
  });

  const selectedCategory = useWatch({ control, name: "category" });
  const fieldError = errors.category?.message ?? errors.amount?.message;

  const onSubmit = async (values: CategoryBudgetFormValues) => {
    setSubmitError("");
    const { error } = await onSave({
      category: values.category,
      monthly_amount: values.amount,
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
            {isEditing ? "Editar orçamento" : "Novo orçamento por categoria"}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary">
            {isEditing
              ? "Defina o limite mensal desta categoria."
              : "Escolha uma categoria e defina o limite mensal."}
          </AppText>

          <FormError message={submitError || fieldError} />

          {isEditing ? (
            <FormField label="Categoria">
              <AppText variant="bodyMedium">{budget.category}</AppText>
            </FormField>
          ) : (
            <FormField label="Categoria">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {availableCategories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        icon={getCategoryIcon(category)}
                        selected={field.value === category}
                        onPress={() => setValue("category", category)}
                      />
                    ))}
                  </ScrollView>
                )}
              />
            </FormField>
          )}

          <FormField label="Limite mensal (R$)">
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <MoneyInput
                  variant="currency"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  accessibilityLabel="Limite mensal da categoria"
                />
              )}
            />
          </FormField>

          {!selectedCategory ? (
            <AppText variant="bodySmall" color="textSecondary">
              Todas as categorias já possuem um orçamento definido.
            </AppText>
          ) : null}

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
              disabled={!selectedCategory}
              accessibilityLabel="Salvar orçamento da categoria"
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
  chipRow: {
    gap: spacing.sm,
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
