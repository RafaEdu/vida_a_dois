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
import { DEFAULT_CATEGORIES } from "../../src/types/database";

export default function NewExpense() {
  const { addExpense, couple, user, profile, partnerInfo } = useAuth();
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [dueDate, setDueDate] = useState("");
  const [paid, setPaid] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [paidBy, setPaidBy] = useState<string>(user?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCategories, setShowCategories] = useState(false);

  const parsedAmount = useMemo(() => {
    const cleaned = amountText.replace(/[^\d,.]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }, [amountText]);

  const formatDate = (text: string): string => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

  const handleSave = async () => {
    setError("");
    if (!description.trim()) {
      setError("Informe a descrição da despesa.");
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

    setSaving(true);
    const { error: saveError } = await addExpense({
      description: description.trim(),
      amount: parsedAmount,
      category,
      due_date: dueDate || undefined,
      paid,
      paid_by: paidBy,
      is_recurring: isRecurring,
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
        <Text style={styles.title}>Cadastrar despesa</Text>
        <Text style={styles.subtitle}>
          Adicione um novo gasto ao plano do casal
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
            placeholder="Ex: Supermercado do mês"
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
          <Text style={styles.label}>Categoria</Text>
          <Pressable
            style={({ pressed }) => [
              styles.categorySelector,
              pressed && styles.categorySelectorPressed,
            ]}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text style={styles.categorySelectorText}>
              {category}
            </Text>
            <Text style={styles.categorySelectorArrow}>
              {showCategories ? "\u25B2" : "\u25BC"}
            </Text>
          </Pressable>

          {showCategories && (
            <View style={styles.categoryList}>
              {DEFAULT_CATEGORIES.map((cat: { name: string; icon: string; type: string }) => (
                <Pressable
                  key={cat.name}
                  style={({ pressed }) => [
                    styles.categoryItem,
                    category === cat.name && styles.categoryItemSelected,
                    pressed && styles.categoryItemPressed,
                  ]}
                  onPress={() => {
                    setCategory(cat.name);
                    setShowCategories(false);
                  }}
                >
                  <Text style={styles.categoryItemIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryItemText,
                      category === cat.name && styles.categoryItemTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  <Text style={styles.categoryItemType}>{cat.type}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Data de vencimento (opcional)</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={(t) => setDueDate(formatDate(t))}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Quem pagou?</Text>
          <View style={styles.paidByRow}>
            <Pressable
              style={[
                styles.paidByOption,
                paidBy === user?.id && styles.paidByOptionSelected,
              ]}
              onPress={() => setPaidBy(user?.id ?? "")}
            >
              <View style={styles.paidByAvatar}>
                <Text style={styles.paidByAvatarText}>
                  {profile?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() ?? "EU"}
                </Text>
              </View>
              <Text
                style={[
                  styles.paidByName,
                  paidBy === user?.id && styles.paidByNameSelected,
                ]}
                numberOfLines={1}
              >
                {profile?.full_name ?? "Você"}
              </Text>
              {paidBy === user?.id && (
                <Text style={styles.paidByCheck}>✓</Text>
              )}
            </Pressable>
            {partnerInfo && (
              <Pressable
                style={[
                  styles.paidByOption,
                  paidBy === partnerInfo.id && styles.paidByOptionSelected,
                ]}
                onPress={() => setPaidBy(partnerInfo.id)}
              >
                <View style={[styles.paidByAvatar, styles.paidByAvatarPartner]}>
                  <Text style={styles.paidByAvatarText}>
                    {partnerInfo.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() ?? "??"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.paidByName,
                    paidBy === partnerInfo.id && styles.paidByNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {partnerInfo.full_name}
                </Text>
                {paidBy === partnerInfo.id && (
                  <Text style={styles.paidByCheck}>✓</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Despesa recorrente</Text>
            <Text style={styles.switchHint}>
              {isRecurring
                ? "Gasto fixo mensal (ex: aluguel, internet)"
                : "Gasto pontual ou variável"}
            </Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: "#E0E0E0", true: "#C8E6C9" }}
            thumbColor={isRecurring ? "#4CAF50" : "#FAFAFA"}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Já foi pago?</Text>
          <Switch
            value={paid}
            onValueChange={setPaid}
            trackColor={{ false: "#E0E0E0", true: "#C8E6C9" }}
            thumbColor={paid ? "#4CAF50" : "#FAFAFA"}
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
            {saving ? "Salvando..." : "Salvar despesa"}
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
  categorySelector: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categorySelectorPressed: {
    opacity: 0.7,
  },
  categorySelectorText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  categorySelectorArrow: {
    fontSize: 12,
    color: "#999",
  },
  categoryList: {
    marginTop: 4,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    maxHeight: 240,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  categoryItemSelected: {
    backgroundColor: "#FFF0F0",
  },
  categoryItemPressed: {
    opacity: 0.7,
  },
  categoryItemIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  categoryItemTextSelected: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  categoryItemType: {
    fontSize: 11,
    color: "#999",
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
  },
  switchHint: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
    maxWidth: 220,
  },
  paidByRow: {
    flexDirection: "row",
    gap: 12,
  },
  paidByOption: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  paidByOptionSelected: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  paidByAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  paidByAvatarPartner: {
    backgroundColor: "#4ECDC4",
  },
  paidByAvatarText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  paidByName: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  paidByNameSelected: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  paidByCheck: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
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
