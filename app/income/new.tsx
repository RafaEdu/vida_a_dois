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
import { useAuth } from "../../src/lib/auth-context";

export default function NewIncome() {
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

<<<<<<< HEAD
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
=======
  const formatDate = (text: string): string => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
>>>>>>> a7cf52451e8961595acf93985fb155e14ceb966e
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
        ? new Date(receivedDate).toISOString()
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
      style={{ flex: 1, backgroundColor: "#FAFAFA" }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.title}>Adicionar receita</Text>
        <Text style={styles.subtitle}>
          Registre uma receita adicional do casal
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Freelance, Bônus, Venda..."
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0,00"
            keyboardType="decimal-pad"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Data de recebimento (opcional)</Text>
          <TextInput
            style={styles.input}
            value={receivedDate}
<<<<<<< HEAD
            onChangeText={handleDateChange}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#999"
            keyboardType="number-pad"
=======
            onChangeText={(t) => setReceivedDate(formatDate(t))}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#999"
            keyboardType="numeric"
>>>>>>> a7cf52451e8961595acf93985fb155e14ceb966e
            maxLength={10}
          />
        </View>

        <View style={styles.switchRow}>
          <View>
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
            trackColor={{ false: "#E0E0E0", true: "#C8E6C9" }}
            thumbColor={isExtra ? "#4CAF50" : "#FAFAFA"}
          />
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
            {saving ? "Salvando..." : "Salvar receita"}
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A1A",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  switchHint: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: "#4ECDC4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    boxShadow: "0 2px 8px rgba(78, 205, 196, 0.3)",
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
