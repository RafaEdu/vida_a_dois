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
import {
  incomeFormSchema,
  type IncomeFormInput,
  type IncomeFormValues,
} from "../../../src/domain/finance/schemas";
import {
  DateInput,
  FormError,
  FormField,
  MoneyInput,
  PrimaryButton,
} from "../../../src/components/forms";
import { C } from "../../../src/theme/colors";
import { styles } from "../../../src/styles/income-new";

export default function NewIncome() {
  const insets = useSafeAreaInsets();
  const { addIncome, couple } = useAuth();
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormInput, unknown, IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nova receita</Text>
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
          Registre uma receita adicional do casal
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
                placeholder="Ex: Freelance, Bônus, Venda..."
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

        {/* Received Date */}
        <FormField
          label="Data de recebimento (opcional)"
          error={errors.receivedDate?.message}
        >
          <Controller
            control={control}
            name="receivedDate"
            render={({ field }) => (
              <DateInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FormField>

        {/* Extra Toggle */}
        <Controller
          control={control}
          name="isExtra"
          render={({ field }) => (
            <View style={[styles.switchCard]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Receita extra</Text>
                <Text style={styles.switchHint}>
                  {field.value
                    ? "Renda adicional além do salário"
                    : "Registro do salário mensal"}
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

        {/* Save Button */}
        <PrimaryButton
          title={isSubmitting ? "Salvando..." : "Salvar receita"}
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
