import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../lib/auth-context";
import type { IdealSplit } from "../../types/domain";
import type { CostPlanInput } from "../../services/couple";
import {
  coupleRatiosFromShares,
  resolvePartnerShares,
  roundPercent,
} from "../../domain/finance/split";
import { formatCurrency } from "../../utils/currency";
import {
  costPlanFormSchema,
  type CostPlanFormInput,
  type CostPlanFormValues,
} from "../../domain/finance/schemas";
import { getInitials } from "../../utils/initials";
import { colors, spacing } from "../../theme";
import {
  AppText,
  Avatar,
  Button,
  Card,
  Screen,
  SegmentedControl,
} from "../../components/ui";
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

  const defaultShares =
    couple && profile
      ? resolvePartnerShares(couple, profile.id)
      : { selfShare: 50, partnerShare: 50 };

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
      splitMode: couple?.split_mode ?? "manual",
      selfSplit: String(defaultShares.selfShare),
      partnerSplit: String(defaultShares.partnerShare),
    },
  });

  useEffect(() => {
    fetchIdealSplit().then((result) => setIdealSplit(result.data));
  }, [fetchIdealSplit]);

  const splitMode = useWatch({ control, name: "splitMode" }) ?? "manual";

  const selfIsA = Boolean(couple && profile && couple.user_a === profile.id);
  const idealSelfShare = useMemo(() => {
    if (!idealSplit) return null;
    return selfIsA ? idealSplit.ratio_a : idealSplit.ratio_b;
  }, [idealSplit, selfIsA]);
  const idealPartnerShare =
    idealSelfShare == null ? null : roundPercent(100 - idealSelfShare);

  const combinedIncome =
    (profile?.monthly_income ?? 0) + (partnerInfo?.monthly_income ?? 0);

  const handleUseIdeal = () => {
    if (idealSelfShare == null || idealPartnerShare == null) return;
    setValue("splitMode", "manual", { shouldValidate: true });
    setValue("selfSplit", String(idealSelfShare), { shouldValidate: true });
    setValue("partnerSplit", String(idealPartnerShare), {
      shouldValidate: true,
    });
  };

  const handleUseIncomeBudget = () => {
    if (combinedIncome > 0) {
      setValue("budget", formatCurrency(combinedIncome));
    }
  };

  const onSubmit = async (values: CostPlanFormValues) => {
    setSubmitError("");
    if (!couple || !profile) {
      setSubmitError("Nenhum casal vinculado.");
      return;
    }

    try {
      const payload: CostPlanInput = {
        monthly_budget: values.budget,
        split_mode: values.splitMode,
      };

      if (values.splitMode === "manual") {
        const ratios = coupleRatiosFromShares(
          { selfShare: values.selfSplit, partnerShare: values.partnerSplit },
          couple,
          profile.id,
        );
        payload.split_ratio_a = ratios.split_ratio_a;
        payload.split_ratio_b = ratios.split_ratio_b;
      }

      const { error: saveError } = await updateCostPlan(payload);
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
          <AppText variant="h3">Divisão do casal</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Escolha como os custos são divididos entre vocês.
          </AppText>

          <SegmentedControl
            value={splitMode}
            onChange={(mode) =>
              setValue("splitMode", mode, { shouldValidate: true })
            }
            options={[
              {
                value: "income_based",
                label: "Proporcional à renda",
                icon: "auto-graph",
              },
              { value: "manual", label: "Manual", icon: "tune" },
            ]}
            accessibilityLabel="Modo de divisão do casal"
          />

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
              {splitMode === "manual" ? (
                <FormField
                  label="Sua parte (%)"
                  error={errors.selfSplit?.message}
                  containerStyle={styles.splitField}
                >
                  <Controller
                    control={control}
                    name="selfSplit"
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
              ) : (
                <View style={styles.splitReadonly}>
                  <AppText variant="h2" color="primary" tabular>
                    {idealSelfShare != null ? `${idealSelfShare}%` : "--"}
                  </AppText>
                  <AppText variant="bodySmall" color="textSecondary">
                    {profile?.monthly_income != null
                      ? formatCurrency(profile.monthly_income)
                      : "Renda não informada"}
                  </AppText>
                </View>
              )}
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
              {splitMode === "manual" ? (
                <FormField
                  label="Parte do parceiro (%)"
                  error={errors.partnerSplit?.message}
                  containerStyle={styles.splitField}
                >
                  <Controller
                    control={control}
                    name="partnerSplit"
                    render={({ field }) => (
                      <TextField
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        keyboardType="decimal-pad"
                        maxLength={5}
                        placeholder="50"
                        accessibilityLabel={`Porcentagem de ${partnerInfo?.full_name ?? "parceiro"}`}
                      />
                    )}
                  />
                </FormField>
              ) : (
                <View style={styles.splitReadonly}>
                  <AppText variant="h2" color="primary" tabular>
                    {idealPartnerShare != null ? `${idealPartnerShare}%` : "--"}
                  </AppText>
                  <AppText variant="bodySmall" color="textSecondary">
                    {partnerInfo?.monthly_income != null
                      ? formatCurrency(partnerInfo.monthly_income)
                      : "Renda não informada"}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          {splitMode === "manual" ? (
            <View style={styles.hint}>
              <AppText variant="bodySmall" color="textSecondary">
                A soma das porcentagens deve ser 100%. A mudança de renda não
                altera uma divisão manual.
              </AppText>
              {idealSelfShare != null && idealPartnerShare != null ? (
                <Button
                  title="Usar proporção pela renda"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={handleUseIdeal}
                  accessibilityLabel="Usar proporção pela renda"
                />
              ) : null}
            </View>
          ) : (
            <AppText variant="bodySmall" color="textSecondary">
              {idealSplit
                ? "Os percentuais são calculados pela renda e não podem ser editados neste modo."
                : "Informe a renda mensal de cada pessoa no Perfil para calcular a divisão."}
            </AppText>
          )}
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
  hint: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
