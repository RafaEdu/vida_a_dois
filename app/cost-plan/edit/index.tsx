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
import { useAuth } from "../../../src/lib/auth-context";
import type { IdealSplit } from "../../../src/types/database";
import { C } from "../../../src/theme/colors";
import { styles } from "./styles";

export default function EditCostPlan() {
  const { couple, profile, partnerInfo, updateCostPlan, fetchIdealSplit } = useAuth();
  const [idealSplit, setIdealSplit] = useState<IdealSplit | null>(null);

  const [budgetText, setBudgetText] = useState(
    couple?.monthly_budget ? String(couple.monthly_budget) : ""
  );
  const [splitA, setSplitA] = useState(
    String(couple?.split_ratio_a ?? 50)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchIdealSplit().then(setIdealSplit);
  }, [fetchIdealSplit]);

  const splitB = String(100 - (parseFloat(splitA) || 0));

  const combinedIncome = (profile?.monthly_income ?? 0) + (partnerInfo?.monthly_income ?? 0);

  const handleUseIdeal = () => {
    if (idealSplit) {
      setSplitA(String(idealSplit.ratio_a));
    }
  };

  const handleUseIncomeBudget = () => {
    if (combinedIncome > 0) {
      setBudgetText(String(combinedIncome));
    }
  };

  const handleSave = async () => {
    setError("");
    const budget = parseFloat(budgetText.replace(/[^\d,.]/g, "").replace(",", ".")) || 0;
    const ratioA = parseFloat(splitA) || 0;

    if (budget <= 0) {
      setError("Informe um orçamento válido.");
      return;
    }
    if (ratioA < 0 || ratioA > 100) {
      setError("A porcentagem deve estar entre 0 e 100.");
      return;
    }

    setSaving(true);
    try {
      const { error: saveError } = await updateCostPlan({
        monthly_budget: budget,
        split_ratio_a: ratioA,
        split_ratio_b: 100 - ratioA,
      });

      if (saveError) {
        setError(saveError);
        return;
      }
    } catch {
      setError("Erro inesperado ao salvar.");
      return;
    } finally {
      setSaving(false);
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

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Orçamento mensal</Text>
          <Text style={styles.cardDescription}>
            Valor total disponível para as despesas do mês
          </Text>
          <View style={styles.currencyInput}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.budgetInput}
              value={budgetText}
              onChangeText={setBudgetText}
              placeholder="0,00"
              keyboardType="decimal-pad"
              placeholderTextColor="#CCC"
            />
          </View>

          {combinedIncome > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.useIdealButton,
                pressed && styles.useIdealButtonPressed,
              ]}
              onPress={handleUseIncomeBudget}
            >
              <Text style={styles.useIdealButtonText}>
                Usar renda somada do casal (R$ {combinedIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
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
                  {profile?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() ?? "??"}
                </Text>
              </View>
              <Text style={styles.splitName} numberOfLines={1}>
                {profile?.full_name}
              </Text>
              <View style={styles.percentInput}>
                <TextInput
                  style={styles.percentField}
                  value={splitA}
                  onChangeText={setSplitA}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  placeholder="50"
                  placeholderTextColor="#CCC"
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
                  {partnerInfo?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() ?? "??"}
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

          {idealSplit && (
            <View style={styles.idealSuggestion}>
              <Text style={styles.idealSuggestionTitle}>
                Divisão ideal sugerida
              </Text>
              <Text style={styles.idealSuggestionText}>
                {profile?.full_name}: {idealSplit.ratio_a}% / {partnerInfo?.full_name}: {idealSplit.ratio_b}%
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

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            pressed && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Text>
        </Pressable>

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
