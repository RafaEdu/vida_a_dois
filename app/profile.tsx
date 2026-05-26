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
import { Stack } from "expo-router/stack";
import { useAuth } from "../src/lib/auth-context";
import { supabase } from "../src/lib/supabase";

function formatCurrency(value: number | null): string {
  if (!value) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name);
    }
  }, [profile]);

  const formatCurrencyInput = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    const number = Number(digits) / 100;
    if (number === 0 && digits.length === 0) return "";
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const parseCurrencyInput = (value: string): number => {
    return Number(value.replace(/\D/g, "")) / 100;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          monthly_income: income ? parseCurrencyInput(income) : null,
        })
        .eq("id", profile?.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        await refreshProfile();
        setEditing(false);
      }
    } catch {
      setError("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Meu perfil" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#FAFAFA" }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ?? "?"}
              </Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} selectable>{error}</Text>
            </View>
          ) : null}

          {editing ? (
            <>
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
                <Text style={styles.label}>Renda mensal líquida</Text>
                <TextInput
                  style={styles.input}
                  value={income}
                  onChangeText={(text) => setIncome(formatCurrencyInput(text))}
                  placeholder="R$ 0,00"
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.editButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    saving && styles.buttonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.buttonText}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.cancelButtonPressed,
                  ]}
                  onPress={() => {
                    setEditing(false);
                    setName(profile?.full_name ?? "");
                    setIncome("");
                    setError("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nome</Text>
                  <Text style={styles.infoValue}>{profile?.full_name}</Text>
                </View>
                {profile?.birth_date && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nascimento</Text>
                    <Text style={styles.infoValue}>
                      {new Date(profile.birth_date).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Renda mensal</Text>
                  <Text style={styles.infoValue}>
                    {formatCurrency(profile?.monthly_income ?? null)}
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.editButtonPressed,
                ]}
                onPress={() => {
                  setEditing(true);
                  setIncome("");
                  setError("");
                }}
              >
                <Text style={styles.editButtonText}>Editar perfil</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.signOutButtonPressed,
                ]}
                onPress={signOut}
              >
                <Text style={styles.signOutText}>Sair da conta</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  infoLabel: {
    fontSize: 14,
    color: "#999",
  },
  infoValue: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
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
  editButtons: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
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
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  signOutButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  signOutButtonPressed: {
    opacity: 0.7,
  },
  signOutText: {
    color: "#999",
    fontSize: 15,
    fontWeight: "600",
  },
});
