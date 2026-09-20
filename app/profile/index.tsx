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
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from "../../src/utils/currency";
import { formatDateOnlyForDisplay } from "../../src/utils/date";
import { styles } from "../../src/styles/profile";
import { C } from "../../src/theme/colors";

export default function Profile() {
  const { profile, signOut, updateProfile } = useAuth();
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

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await updateProfile({
        full_name: name.trim(),
        monthly_income: income ? parseCurrencyInput(income) : null,
      });

      if (updateError) {
        setError(updateError);
      } else {
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
                      {formatDateOnlyForDisplay(profile.birth_date)}
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
