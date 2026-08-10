import { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../src/lib/auth-context";
import { C } from "../../../src/theme/colors";
import { styles } from "./styles";

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
