import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../lib/auth-context";
import type { IdealSplit } from "../../types/domain";
import { formatCurrency } from "../../utils/currency";
import {
  costPlanFormSchema,
  type CostPlanFormInput,
  type CostPlanFormValues,
} from "../../domain/finance/schemas";
import { getInitials } from "../../utils/initials";
import { colors, spacing } from "../../theme";
import { AppText, Avatar, Button, Card, Screen } from "../../components/ui";
import {
  FormError,
  FormField,
  MoneyInput,
  TextField,
} from "../../components/forms";

export function EditPlanningScreen() {
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
      budget: couple?.monthly_budget
        ? formatCurrency(couple.monthly_budget)
        : "",
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
      setValue("budget", formatCurrency(combinedIncome));
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
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen
        scroll
        edges={["left", "right"]}
        contentContainerStyle={styles.content}
      >
        <AppText variant="bodySmall" color="textSecondary">
          Ajuste o orçamento mensal e a divisão de custos entre o casal.
        </AppText>

        <FormError message={submitError} />

        <Card style={styles.card}>
          <AppText variant="h3">Orçamento mensal</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Valor total disponível para as despesas do mês.
          </AppText>

          <FormField label="Orçamento (R$)" error={errors.budget?.message}>
            <Controller
              control={control}
              name="budget"
              render={({ field }) => (
                <MoneyInput
                  variant="currency"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  accessibilityLabel="Orçamento mensal em reais"
                />
              )}
            />
          </FormField>

          {combinedIncome > 0 ? (
            <Button
              title={`Usar renda somada do casal (${formatCurrency(combinedIncome)})`}
              variant="secondary"
              size="md"
              icon="attach-money"
              fullWidth
              onPress={handleUseIncomeBudget}
              accessibilityLabel={`Usar renda somada do casal, ${formatCurrency(combinedIncome)}`}
            />
          ) : null}
        </Card>

        <Card style={styles.card}>
          <AppText variant="h3">Divisão de custos</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Defina a porcentagem que cada pessoa contribui.
          </AppText>

          <View style={styles.splitRow}>
            <View style={styles.splitPerson}>
              <Avatar
                initials={getInitials(profile?.full_name, "??")}
                tone="partnerA"
                size="lg"
              />
              <AppText
                variant="bodySmallMedium"
                numberOfLines={1}
                style={styles.splitName}
              >
                {profile?.full_name ?? "Você"}
              </AppText>
              <FormField
                label="Contribuição (%)"
                error={errors.splitA?.message}
                containerStyle={styles.splitField}
              >
                <Controller
                  control={control}
                  name="splitA"
                  render={({ field }) => (
                    <TextField
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="decimal-pad"
                      maxLength={5}
                      placeholder="50"
                      accessibilityLabel={`Porcentagem de ${profile?.full_name ?? "você"}`}
                    />
                  )}
                />
              </FormField>
            </View>

            <View style={styles.splitPerson}>
              <Avatar
                initials={getInitials(partnerInfo?.full_name, "??")}
                tone="partnerB"
                size="lg"
              />
              <AppText
                variant="bodySmallMedium"
                numberOfLines={1}
                style={styles.splitName}
              >
                {partnerInfo?.full_name ?? "Parceiro(a)"}
              </AppText>
              <View style={styles.splitReadonly}>
                <AppText variant="h2" color="primary" tabular>
                  {splitB}%
                </AppText>
                <AppText variant="bodySmall" color="textSecondary">
                  Automático
                </AppText>
              </View>
            </View>
          </View>

          {idealSplit ? (
            <View style={styles.idealSuggestion}>
              <AppText variant="bodySmallMedium" color="primary">
                Divisão ideal sugerida
              </AppText>
              <AppText variant="bodySmall" color="textSecondary">
                {profile?.full_name}: {idealSplit.ratio_a}% /{" "}
                {partnerInfo?.full_name}: {idealSplit.ratio_b}%
              </AppText>
              <AppText variant="bodySmall" color="textSecondary">
                Calculado proporcionalmente com base na renda mensal.
              </AppText>
              <Button
                title="Usar divisão ideal"
                variant="secondary"
                size="md"
                fullWidth
                onPress={handleUseIdeal}
                accessibilityLabel="Usar divisão ideal sugerida"
              />
            </View>
          ) : null}
        </Card>

        <Button
          title={isSubmitting ? "Salvando..." : "Salvar alterações"}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
        />
      </Screen>
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
    gap: spacing.xl,
  },
  card: {
    gap: spacing.md,
  },
  splitRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  splitPerson: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  splitName: {
    textAlign: "center",
  },
  splitField: {
    alignSelf: "stretch",
  },
  splitReadonly: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  idealSuggestion: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
