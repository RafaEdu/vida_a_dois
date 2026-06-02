import { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/auth-context";

const C = {
  surface: "#f9f9ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f1f3ff",
  surfaceContainerHigh: "#e3e8f9",
  surfaceVariant: "#dde2f3",
  onSurface: "#161c27",
  onSurfaceVariant: "#434655",
  outline: "#747686",
  outlineVariant: "#c4c5d7",
  primary: "#1f4ed8",
  onPrimary: "#ffffff",
  primaryFixedDim: "#b7c4ff",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
};

export default function NewIncome() {
  const insets = useSafeAreaInsets();
  const { addIncome, couple } = useAuth();
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [isExtra, setIsExtra] = useState(true);
  const [receivedDate, setReceivedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = useMemo(() => {
    const cleaned = amountText.replace(/[^\d,.]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }, [amountText]);

  const handleDateChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 4) {
      masked = digits.slice(0, 4) + "-" + digits.slice(4);
    }
    if (digits.length > 6) {
      masked = digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6);
    }
    setReceivedDate(masked);
  };

  const isValidDate = (dateStr: string): boolean => {
    if (!dateStr) return true;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const d = new Date(dateStr + "T00:00:00");
    const [y, m, day] = dateStr.split("-").map(Number);
    return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
  };

  const handleSave = async () => {
    setError("");
    if (!description.trim()) {
      setError("Informe a descrição da receita.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!couple) {
      setError("Nenhum casal vinculado.");
      return;
    }
    if (receivedDate && !isValidDate(receivedDate)) {
      setError("Data inválida. Use o formato AAAA-MM-DD.");
      return;
    }

    setSaving(true);
    const { error: saveError } = await addIncome({
      description: description.trim(),
      amount: parsedAmount,
      is_extra: isExtra,
      received_at: receivedDate
        ? new Date(receivedDate + "T00:00:00").toISOString()
        : new Date().toISOString(),
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Registre uma receita adicional do casal
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={18} color={C.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Freelance, Bônus, Venda..."
            placeholderTextColor={C.outlineVariant}
          />
        </View>

        {/* Amount */}
        <View style={styles.field}>
          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0,00"
            keyboardType="decimal-pad"
            placeholderTextColor={C.outlineVariant}
          />
        </View>

        {/* Received Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Data de recebimento (opcional)</Text>
          <TextInput
            style={styles.input}
            value={receivedDate}
            onChangeText={handleDateChange}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={C.outlineVariant}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        {/* Extra Toggle */}
        <View style={[styles.switchCard]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Receita extra</Text>
            <Text style={styles.switchHint}>
              {isExtra
                ? "Renda adicional além do salário"
                : "Registro do salário mensal"}
            </Text>
          </View>
          <Switch
            value={isExtra}
            onValueChange={setIsExtra}
            trackColor={{ false: C.surfaceVariant, true: C.primaryFixedDim }}
            thumbColor={isExtra ? C.primary : C.surfaceContainerLowest}
          />
        </View>

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            saving && styles.saveBtnDisabled,
            pressed && styles.saveBtnPressed,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <MaterialIcons name="save" size={20} color={C.onPrimary} />
          <Text style={styles.saveBtnText}>
            {saving ? "Salvando..." : "Salvar receita"}
          </Text>
        </Pressable>

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.surface,
  },
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.onSurface,
  },
  /* Scroll */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    marginBottom: 24,
  },
  /* Error */
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.errorContainer,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    color: C.onErrorContainer,
    fontSize: 14,
    fontWeight: "500",
  },
  /* Fields */
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "500",
    color: C.onSurface,
  },
  /* Switch */
  switchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      default: { elevation: 2 },
    }),
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: C.onSurface,
  },
  switchHint: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
    maxWidth: 230,
  },
  /* Save */
  saveBtn: {
    flexDirection: "row",
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      default: { elevation: 4 },
    }),
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    color: C.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  /* Cancel */
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 20,
  },
  cancelBtnPressed: {
    opacity: 0.7,
  },
  cancelBtnText: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "600",
  },
});
