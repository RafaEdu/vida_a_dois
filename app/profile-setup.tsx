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
import { useAuth } from "../src/lib/auth-context";
import { router } from "expo-router";

export default function ProfileSetup() {
  const { userState, saveProfile } = useAuth();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [income, setIncome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userState !== "profile_incomplete") {
      router.replace("/");
    }
  }, [userState]);

  const formatBirthDate = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const isDateValid = (dateStr: string): boolean => {
    if (dateStr.length !== 10) return false;
    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      year > 1900 &&
      year < new Date().getFullYear()
    );
  };

  const handleSave = async () => {
    setError("");
    if (!name.trim()) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!isDateValid(birthDate)) {
      setError("Informe uma data de nascimento válida (DD/MM/AAAA).");
      return;
    }

    setLoading(true);
    const [day, month, year] = birthDate.split("/").map(Number);
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const { error: saveError } = await saveProfile({
      full_name: name.trim(),
      birth_date: isoDate,
      monthly_income: income ? parseCurrency(income) : undefined,
    });
    setLoading(false);

    if (saveError) {
      setError(saveError);
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
        <View style={styles.header}>
          <Text style={styles.title}>Seu perfil</Text>
          <Text style={styles.subtitle}>
            Conte um pouco sobre você para seu parceiro
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.step}>Etapa 2 de 2</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} selectable>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              autoComplete="name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Data de nascimento</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatBirthDate(text))}
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Renda mensal líquida</Text>
            <TextInput
              style={styles.input}
              value={income}
              onChangeText={(text) => setIncome(formatCurrency(text))}
              placeholder="R$ 0,00"
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />
            <Text style={styles.optionalHint}>
              Pode preencher depois — vamos perguntar isso no planejamento
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              loading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Salvando..." : "Salvar e continuar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  step: {
    fontSize: 13,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
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
  optionalHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  buttonDisabled: {
    backgroundColor: "#FFB3B3",
    boxShadow: "none",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
