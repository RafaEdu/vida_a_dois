import { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../../src/lib/auth-context";
import type { IdealSplit } from "../../../src/types/domain";
import { formatCurrency } from "../../../src/utils/currency";
import {
  costPlanFormSchema,
  type CostPlanFormInput,
  type CostPlanFormValues,
} from "../../../src/domain/finance/schemas";
import { FormError, PrimaryButton } from "../../../src/components/forms";
import { getInitials } from "../../../src/utils/initials";
import { C } from "../../../src/theme/colors";
import { styles } from "../../../src/styles/cost-plan-edit";

export default function EditCostPlan() {
  const { couple, profile, partnerInfo, updateCostPlan, fetchIdealSplit } =
    useAuth();
  const [idealSplit, setIdealSplit] = useState<IdealSplit | null>(null);
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CostPlanFormInput, unknown, CostPlanFormValues>({
    resolver: zodResolver(costPlanFormSchema),
    defaultValues: {
      budget: couple?.monthly_budget ? String(couple.monthly_budget) : "",
      splitA: String(couple?.split_ratio_a ?? 50),
    },
  });

  useEffect(() => {
    fetchIdealSplit().then((result) => setIdealSplit(result.data));
  }, [fetchIdealSplit]);

  const splitAValue = useWatch({ control, name: "splitA" }) ?? "";
  const splitB = String(100 - (parseFloat(splitAValue) || 0));

  const combinedIncome =
    (profile?.monthly_income ?? 0) + (partnerInfo?.monthly_income ?? 0);

  const handleUseIdeal = () => {
    if (idealSplit) {
      setValue("splitA", String(idealSplit.ratio_a));
    }
  };

  const handleUseIncomeBudget = () => {
    if (combinedIncome > 0) {
      setValue("budget", String(combinedIncome));
    }
  };

  const onSubmit = async (values: CostPlanFormValues) => {
    setSubmitError("");
    try {
      const { error: saveError } = await updateCostPlan({
        monthly_budget: values.budget,
        split_ratio_a: values.splitA,
        split_ratio_b: 100 - values.splitA,
      });

      if (saveError) {
        setSubmitError(saveError);
        return;
      }
    } catch {
      setSubmitError("Erro inesperado ao salvar.");
      return;
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: C.surface }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.title}>Editar plano de custos</Text>
        <Text style={styles.subtitle}>
          Ajuste o orçamento mensal e a divisão de custos entre o casal
        </Text>

        <FormError message={submitError} variant="plain" />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Orçamento mensal</Text>
          <Text style={styles.cardDescription}>
            Valor total disponível para as despesas do mês
          </Text>
          <Controller
            control={control}
            name="budget"
            render={({ field }) => (
              <View style={styles.currencyInput}>
                <Text style={styles.currencySymbol}>R$</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#CCC"
                />
              </View>
            )}
          />
          {errors.budget?.message ? (
            <Text style={styles.errorText}>{errors.budget.message}</Text>
          ) : null}

          {combinedIncome > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.useIdealButton,
                pressed && styles.useIdealButtonPressed,
              ]}
              onPress={handleUseIncomeBudget}
            >
              <Text style={styles.useIdealButtonText}>
                Usar renda somada do casal ({formatCurrency(combinedIncome)})
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Divisão de custos</Text>
          <Text style={styles.cardDescription}>
            Defina a porcentagem que cada pessoa contribui
          </Text>

          <View style={styles.splitContainer}>
            <View style={styles.splitPerson}>
              <View style={styles.splitAvatar}>
                <Text style={styles.splitAvatarText}>
                  {getInitials(profile?.full_name, "??")}
                </Text>
              </View>
              <Text style={styles.splitName} numberOfLines={1}>
                {profile?.full_name}
              </Text>
              <View style={styles.percentInput}>
                <Controller
                  control={control}
                  name="splitA"
                  render={({ field }) => (
                    <TextInput
                      style={styles.percentField}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="decimal-pad"
                      maxLength={5}
                      placeholder="50"
                      placeholderTextColor="#CCC"
                    />
                  )}
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
            </View>

            <View style={styles.splitSeparator}>
              <View style={styles.splitLine} />
              <Text style={styles.splitOr}>+</Text>
              <View style={styles.splitLine} />
            </View>

            <View style={styles.splitPerson}>
              <View style={[styles.splitAvatar, styles.splitAvatarPartner]}>
                <Text style={styles.splitAvatarText}>
                  {getInitials(partnerInfo?.full_name, "??")}
                </Text>
              </View>
              <Text style={styles.splitName} numberOfLines={1}>
                {partnerInfo?.full_name}
              </Text>
              <View style={styles.percentInput}>
                <Text style={[styles.percentField, styles.percentReadonly]}>
                  {splitB}
                </Text>
                <Text style={styles.percentSymbol}>%</Text>
              </View>
            </View>
          </View>

          {errors.splitA?.message ? (
            <Text style={styles.errorText}>{errors.splitA.message}</Text>
          ) : null}

          {idealSplit && (
            <View style={styles.idealSuggestion}>
              <Text style={styles.idealSuggestionTitle}>
                Divisão ideal sugerida
              </Text>
              <Text style={styles.idealSuggestionText}>
                {profile?.full_name}: {idealSplit.ratio_a}% /{" "}
                {partnerInfo?.full_name}: {idealSplit.ratio_b}%
              </Text>
              <Text style={styles.idealSuggestionHint}>
                Calculado proporcionalmente com base na renda mensal
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.useIdealButton,
                  pressed && styles.useIdealButtonPressed,
                ]}
                onPress={handleUseIdeal}
              >
                <Text style={styles.useIdealButtonText}>
                  Usar divisão ideal
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <PrimaryButton
          title={isSubmitting ? "Salvando..." : "Salvar alterações"}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
          disabledStyle={styles.saveButtonDisabled}
          pressedStyle={styles.saveButtonPressed}
        />

        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.cancelButtonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
