import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../../src/lib/auth-context";
import { DEFAULT_CATEGORIES } from "../../../src/types/database";
import {
  expenseFormSchema,
  type ExpenseFormInput,
  type ExpenseFormValues,
} from "../../../src/domain/finance/schemas";
import { CategoryPicker, PayerSelector } from "../../../src/components/finance";
import {
  DateInput,
  FormError,
  FormField,
  MoneyInput,
  PrimaryButton,
} from "../../../src/components/forms";
import { C } from "../../../src/theme/colors";
import { shadowSm } from "../../../src/theme/shadows";
import { styles } from "../../../src/styles/expense-new";

export default function NewExpense() {
  const insets = useSafeAreaInsets();
  const { addExpense, couple, user, profile, partnerInfo } = useAuth();
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
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
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nova despesa</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Adicione um novo gasto ao plano do casal
        </Text>

        <FormError message={submitError} />

        {/* Description */}
        <FormField label="Descrição" error={errors.description?.message}>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Ex: Supermercado do mês"
                placeholderTextColor={C.outlineVariant}
              />
            )}
          />
        </FormField>

        {/* Amount */}
        <FormField label="Valor (R$)" error={errors.amount?.message}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <MoneyInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FormField>

        {/* Category */}
        <FormField label="Categoria" error={errors.category?.message}>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <CategoryPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>

        {/* Due Date */}
        <FormField
          label="Data de vencimento (opcional)"
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
              />
            )}
          />
        </FormField>

        {/* Paid By */}
        <FormField label="Quem pagou?" error={errors.paidBy?.message}>
          <Controller
            control={control}
            name="paidBy"
            render={({ field }) => (
              <PayerSelector
                value={field.value}
                onChange={field.onChange}
                self={{
                  id: user?.id ?? "",
                  full_name: profile?.full_name ?? "",
                }}
                partner={
                  partnerInfo
                    ? { id: partnerInfo.id, full_name: partnerInfo.full_name }
                    : null
                }
              />
            )}
          />
        </FormField>

        {/* Recurring Toggle */}
        <Controller
          control={control}
          name="isRecurring"
          render={({ field }) => (
            <View style={[styles.switchCard, shadowSm]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Despesa recorrente</Text>
                <Text style={styles.switchHint}>
                  {field.value
                    ? "Gasto fixo mensal (ex: aluguel, internet)"
                    : "Gasto pontual ou variável"}
                </Text>
              </View>
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{
                  false: C.surfaceVariant,
                  true: C.primaryFixedDim,
                }}
                thumbColor={field.value ? C.primary : C.surfaceContainerLowest}
              />
            </View>
          )}
        />

        {/* Paid Toggle */}
        <Controller
          control={control}
          name="paid"
          render={({ field }) => (
            <View style={[styles.switchCard, shadowSm]}>
              <Text style={styles.switchLabel}>Já foi pago?</Text>
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{
                  false: C.surfaceVariant,
                  true: C.primaryFixedDim,
                }}
                thumbColor={field.value ? C.primary : C.surfaceContainerLowest}
              />
            </View>
          )}
        />

        {/* Save Button */}
        <PrimaryButton
          title={isSubmitting ? "Salvando..." : "Salvar despesa"}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          icon="save"
          style={styles.saveBtn}
          textStyle={styles.saveBtnText}
          disabledStyle={styles.saveBtnDisabled}
          pressedStyle={styles.saveBtnPressed}
        />

        {/* Cancel */}
        <Pressable
          style={({ pressed }) => [
            styles.cancelBtn,
            pressed && styles.cancelBtnPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
