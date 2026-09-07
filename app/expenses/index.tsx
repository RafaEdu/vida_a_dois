import { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/lib/auth-context";
import { DEFAULT_CATEGORIES, type Expense, type Income } from "../../src/types/database";
import { C } from "../../src/theme/colors";
import { styles } from "./styles";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

type EditTarget =
  | { type: "expense"; item: Expense }
  | { type: "income"; item: Income }
  | null;

export default function ExpensesList() {
  const insets = useSafeAreaInsets();
  const {
    expenses,
    incomes,
    updateExpense,
    deleteExpense,
    updateIncome,
    deleteIncome,
    expensesLoading,
    incomesLoading,
  } = useAuth();

  const [tab, setTab] = useState<"expenses" | "incomes">("expenses");
  const [editing, setEditing] = useState<EditTarget>(null);

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => a.description.localeCompare(b.description)),
    [expenses],
  );

  const sortedIncomes = useMemo(
    () => [...incomes].sort((a, b) => a.description.localeCompare(b.description)),
    [incomes],
  );

  const handleTogglePaid = async (expense: Expense) => {
    if (expense.paid) {
      await updateExpense(expense.id, { paid: false, paid_at: null });
    } else {
      await updateExpense(expense.id, { paid: true, paid_at: new Date().toISOString() });
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert("Excluir despesa", `Deseja excluir "${expense.description}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteExpense(expense.id) },
    ]);
  };

  const handleDeleteIncome = (income: Income) => {
    Alert.alert("Excluir receita", `Deseja excluir "${income.description}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteIncome(income.id) },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Histórico" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.root, { paddingTop: insets.top }]}
      >
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === "expenses" && styles.tabActive]}
            onPress={() => setTab("expenses")}
          >
            <Text style={[styles.tabText, tab === "expenses" && styles.tabTextActive]}>
              Despesas
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === "incomes" && styles.tabActive]}
            onPress={() => setTab("incomes")}
          >
            <Text style={[styles.tabText, tab === "incomes" && styles.tabTextActive]}>
              Receitas
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {tab === "expenses" ? (
            expensesLoading ? (
              <Text style={styles.empty}>Carregando despesas...</Text>
            ) : sortedExpenses.length === 0 ? (
              <Text style={styles.empty}>Nenhuma despesa cadastrada.</Text>
            ) : (
              sortedExpenses.map((expense) => (
                <View key={expense.id} style={styles.item}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {expense.description}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {expense.category}
                      {expense.due_date ? ` · ${formatDate(expense.due_date)}` : ""}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text
                      style={[
                        styles.itemAmount,
                        { color: expense.paid ? C.progressGreen : C.primary },
                      ]}
                    >
                      {formatCurrency(expense.amount)}
                    </Text>
                    <View style={styles.itemActions}>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => handleTogglePaid(expense)}
                      >
                        <MaterialIcons
                          name={expense.paid ? "remove-circle-outline" : "check-circle"}
                          size={22}
                          color={expense.paid ? C.outline : C.primary}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => setEditing({ type: "expense", item: expense })}
                      >
                        <MaterialIcons name="edit" size={20} color={C.onSurfaceVariant} />
                      </Pressable>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => handleDeleteExpense(expense)}
                      >
                        <MaterialIcons name="delete-outline" size={20} color={C.error} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )
          ) : incomesLoading ? (
            <Text style={styles.empty}>Carregando receitas...</Text>
          ) : sortedIncomes.length === 0 ? (
            <Text style={styles.empty}>Nenhuma receita cadastrada.</Text>
          ) : (
            sortedIncomes.map((income) => (
              <View key={income.id} style={styles.item}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {income.description}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {income.is_extra ? "Extra" : "Salário"} · {formatDate(income.received_at)}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={[styles.itemAmount, { color: C.progressGreen }]}>
                    {formatCurrency(income.amount)}
                  </Text>
                  <View style={styles.itemActions}>
                    <Pressable
                      style={styles.iconBtn}
                      onPress={() => setEditing({ type: "income", item: income })}
                    >
                      <MaterialIcons name="edit" size={20} color={C.onSurfaceVariant} />
                    </Pressable>
                    <Pressable
                      style={styles.iconBtn}
                      onPress={() => handleDeleteIncome(income)}
                    >
                      <MaterialIcons name="delete-outline" size={20} color={C.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {editing && (
        <EditModal
          target={editing}
          onClose={() => setEditing(null)}
          onSaveExpense={async (id, data) => {
            await updateExpense(id, data);
            setEditing(null);
          }}
          onSaveIncome={async (id, data) => {
            await updateIncome(id, data);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function EditModal({
  target,
  onClose,
  onSaveExpense,
  onSaveIncome,
}: {
  target: Exclude<EditTarget, null>;
  onClose: () => void;
  onSaveExpense: (
    id: string,
    data: { description: string; amount: number; category: string },
  ) => Promise<void>;
  onSaveIncome: (
    id: string,
    data: { description: string; amount: number },
  ) => Promise<void>;
}) {
  const [description, setDescription] = useState(target.item.description);
  const [amountText, setAmountText] = useState(String(target.item.amount));
  const [category, setCategory] = useState(
    target.type === "expense" ? target.item.category : DEFAULT_CATEGORIES[0].name,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = useMemo(() => {
    const cleaned = amountText.replace(/[^\d,.]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }, [amountText]);

  const handleSave = async () => {
    setError("");
    if (!description.trim()) {
      setError("Informe a descrição.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Informe um valor válido.");
      return;
    }

    setSaving(true);
    if (target.type === "expense") {
      await onSaveExpense(target.item.id, {
        description: description.trim(),
        amount: parsedAmount,
        category,
      });
    } else {
      await onSaveIncome(target.item.id, {
        description: description.trim(),
        amount: parsedAmount,
      });
    }
    setSaving(false);
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {target.type === "expense" ? "Editar despesa" : "Editar receita"}
          </Text>

          {error ? <Text style={styles.modalError}>{error}</Text> : null}

          <Text style={styles.modalLabel}>Descrição</Text>
          <TextInput
            style={styles.modalInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição"
            placeholderTextColor={C.outlineVariant}
          />

          <Text style={styles.modalLabel}>Valor (R$)</Text>
          <TextInput
            style={styles.modalInput}
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0,00"
            keyboardType="decimal-pad"
            placeholderTextColor={C.outlineVariant}
          />

          {target.type === "expense" && (
            <>
              <Text style={styles.modalLabel}>Categoria</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.name}
                    style={[styles.chip, category === cat.name && styles.chipActive]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text
                      style={[styles.chipText, category === cat.name && styles.chipTextActive]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.modalSave, saving && styles.modalSaveDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.modalSaveText}>{saving ? "Salvando..." : "Salvar"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
