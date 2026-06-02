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
import { DEFAULT_CATEGORIES } from "../../src/types/database";

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
  primaryContainer: "#4169f2",
  onPrimaryContainer: "#fffbff",
  primaryFixedDim: "#b7c4ff",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  avatarRed: "#ff5252",
  avatarTeal: "#39b5bf",
};

const shadowSm = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  default: { elevation: 2 },
});

function formatCurrencyBR(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function NewExpense() {
  const insets = useSafeAreaInsets();
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

  const handleDateChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 4) {
      masked = digits.slice(0, 4) + "-" + digits.slice(4);
    }
    if (digits.length > 6) {
      masked = digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6);
    }
    setDueDate(masked);
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
    if (dueDate && !isValidDate(dueDate)) {
      setError("Data inválida. Use o formato AAAA-MM-DD.");
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
      style={[styles.root, { paddingTop: insets.top }]}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nova despesa</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Adicione um novo gasto ao plano do casal
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
            placeholder="Ex: Supermercado do mês"
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

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Categoria</Text>
          <Pressable
            style={styles.selector}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text style={styles.selectorText}>{category}</Text>
            <MaterialIcons
              name={showCategories ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={20}
              color={C.outline}
            />
          </Pressable>

          {showCategories && (
            <View style={styles.categoryList}>
              <ScrollView style={styles.categoryScroll} nestedScrollEnabled>
                {DEFAULT_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.name}
                    style={[
                      styles.categoryItem,
                      category === cat.name && styles.categoryItemSelected,
                    ]}
                    onPress={() => {
                      setCategory(cat.name);
                      setShowCategories(false);
                    }}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <View style={styles.categoryInfo}>
                      <Text
                        style={[
                          styles.categoryName,
                          category === cat.name && styles.categoryNameSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                      <Text style={styles.categoryType}>{cat.type}</Text>
                    </View>
                    {category === cat.name && (
                      <MaterialIcons name="check" size={18} color={C.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Due Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Data de vencimento (opcional)</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={handleDateChange}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={C.outlineVariant}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        {/* Paid By */}
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
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.paidByName,
                    paidBy === user?.id && styles.paidByNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {profile?.full_name ?? "Você"}
                </Text>
              </View>
              {paidBy === user?.id && (
                <MaterialIcons name="check-circle" size={20} color={C.primary} />
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
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.paidByName,
                      paidBy === partnerInfo.id && styles.paidByNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {partnerInfo.full_name}
                  </Text>
                </View>
                {paidBy === partnerInfo.id && (
                  <MaterialIcons name="check-circle" size={20} color={C.primary} />
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Recurring Toggle */}
        <View style={[styles.switchCard, shadowSm]}>
          <View style={{ flex: 1 }}>
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
            trackColor={{ false: C.surfaceVariant, true: C.primaryFixedDim }}
            thumbColor={isRecurring ? C.primary : C.surfaceContainerLowest}
          />
        </View>

        {/* Paid Toggle */}
        <View style={[styles.switchCard, shadowSm]}>
          <Text style={styles.switchLabel}>Já foi pago?</Text>
          <Switch
            value={paid}
            onValueChange={setPaid}
            trackColor={{ false: C.surfaceVariant, true: C.primaryFixedDim }}
            thumbColor={paid ? C.primary : C.surfaceContainerLowest}
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
            {saving ? "Salvando..." : "Salvar despesa"}
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
  /* Selector (Category) */
  selector: {
    backgroundColor: C.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "500",
    color: C.onSurface,
    flex: 1,
  },
  /* Category List */
  categoryList: {
    marginTop: 4,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      default: { elevation: 4 },
    }),
  },
  categoryScroll: {
    maxHeight: 280,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F8",
    gap: 12,
  },
  categoryItemSelected: {
    backgroundColor: C.surfaceContainerLow,
  },
  categoryIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurface,
  },
  categoryNameSelected: {
    color: C.primary,
    fontWeight: "600",
  },
  categoryType: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  /* Paid By */
  paidByRow: {
    flexDirection: "row",
    gap: 12,
  },
  paidByOption: {
    flex: 1,
    backgroundColor: C.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: C.outlineVariant,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  paidByOptionSelected: {
    borderColor: C.primary,
    backgroundColor: C.surfaceContainerLow,
  },
  paidByAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.avatarRed,
    justifyContent: "center",
    alignItems: "center",
  },
  paidByAvatarPartner: {
    backgroundColor: C.avatarTeal,
  },
  paidByAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  paidByName: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    fontWeight: "500",
  },
  paidByNameSelected: {
    color: C.primary,
    fontWeight: "600",
  },
  /* Switches */
  switchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
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
