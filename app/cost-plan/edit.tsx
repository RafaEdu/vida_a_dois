import { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/lib/auth-context";
import type { IdealSplit } from "../../src/types/database";

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

  const handleUseIdeal = () => {
    if (idealSplit) {
      setSplitA(String(idealSplit.ratio_a));
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
    const { error: saveError } = await updateCostPlan({
      monthly_budget: budget,
      split_ratio_a: ratioA,
      split_ratio_b: 100 - ratioA,
    });
    setSaving(false);

    if (saveError) {
      setError(saveError);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FAFAFA" }}
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    paddingVertical: 4,
  },
  splitContainer: {
    alignItems: "center",
  },
  splitPerson: {
    alignItems: "center",
    paddingVertical: 12,
  },
  splitAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  splitAvatarPartner: {
    backgroundColor: "#4ECDC4",
  },
  splitAvatarText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  splitName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 8,
    maxWidth: 140,
  },
  percentInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  percentField: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FF6B6B",
    minWidth: 60,
    textAlign: "center",
    paddingVertical: 4,
  },
  percentReadonly: {
    color: "#4ECDC4",
  },
  percentSymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginLeft: 4,
  },
  splitSeparator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  splitLine: {
    width: 60,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  splitOr: {
    fontSize: 18,
    color: "#CCC",
    marginHorizontal: 12,
    fontWeight: "300",
  },
  idealSuggestion: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    alignItems: "center",
  },
  idealSuggestionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6C5CE7",
    marginBottom: 4,
  },
  idealSuggestionText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  idealSuggestionHint: {
    fontSize: 11,
    color: "#999",
    marginBottom: 12,
    textAlign: "center",
  },
  useIdealButton: {
    backgroundColor: "#6C5CE7",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  useIdealButtonPressed: {
    opacity: 0.8,
  },
  useIdealButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: "#999",
    fontSize: 15,
    fontWeight: "600",
  },
});
