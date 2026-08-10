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
import { Stack } from "expo-router/stack";
import { useAuth } from "../../src/lib/auth-context";
import { supabase } from "../../src/lib/supabase";
import { styles } from "./styles";
import { C } from "../../src/theme/colors";

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
        style={{ flex: 1, backgroundColor: C.surface }}
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
