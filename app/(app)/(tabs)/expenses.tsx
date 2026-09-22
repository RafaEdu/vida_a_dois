import { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../../src/lib/auth-context";
import { type Expense, type Income } from "../../../src/types/domain";
import { formatCurrency } from "../../../src/utils/currency";
import { EditModal, type EditTarget } from "../../../src/components/finance";
import { TabScreenHeader } from "../../../src/components/shell";
import { C } from "../../../src/theme/colors";
import { styles } from "../../../src/styles/expenses";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}`;
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function ExpensesList() {
  const insets = useSafeAreaInsets();
  const {
    expenses,
    incomes,
    updateExpense,
    markExpensePaid,
    deleteExpense,
    updateIncome,
    deleteIncome,
    expensesLoading,
    incomesLoading,
  } = useAuth();

  const [tab, setTab] = useState<"expenses" | "incomes">("expenses");
  const [editing, setEditing] = useState<EditTarget>(null);

  const sortedExpenses = useMemo(
    () =>
      [...expenses].sort((a, b) => a.description.localeCompare(b.description)),
    [expenses],
  );

  const sortedIncomes = useMemo(
    () =>
      [...incomes].sort((a, b) => a.description.localeCompare(b.description)),
    [incomes],
  );

  const handleTogglePaid = async (expense: Expense) => {
    if (expense.paid) {
      await updateExpense(expense.id, { paid: false, paid_at: null });
    } else {
      await markExpensePaid(expense.id);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert("Excluir despesa", `Deseja excluir "${expense.description}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => deleteExpense(expense.id),
      },
    ]);
  };

  const handleDeleteIncome = (income: Income) => {
    Alert.alert("Excluir receita", `Deseja excluir "${income.description}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => deleteIncome(income.id),
      },
    ]);
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.root}
      >
        <TabScreenHeader title="Lançamentos" />

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === "expenses" && styles.tabActive]}
            onPress={() => setTab("expenses")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "expenses" && styles.tabTextActive,
              ]}
            >
              Despesas
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === "incomes" && styles.tabActive]}
            onPress={() => setTab("incomes")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "incomes" && styles.tabTextActive,
              ]}
            >
              Receitas
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 96 },
          ]}
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
                      {expense.due_date
                        ? ` · ${formatDate(expense.due_date)}`
                        : ""}
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
                          name={
                            expense.paid
                              ? "remove-circle-outline"
                              : "check-circle"
                          }
                          size={22}
                          color={expense.paid ? C.outline : C.primary}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() =>
                          setEditing({ type: "expense", item: expense })
                        }
                      >
                        <MaterialIcons
                          name="edit"
                          size={20}
                          color={C.onSurfaceVariant}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => handleDeleteExpense(expense)}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={20}
                          color={C.error}
                        />
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
                    {income.is_extra ? "Extra" : "Salário"} ·{" "}
                    {formatDate(income.received_at)}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={[styles.itemAmount, { color: C.progressGreen }]}>
                    {formatCurrency(income.amount)}
                  </Text>
                  <View style={styles.itemActions}>
                    <Pressable
                      style={styles.iconBtn}
                      onPress={() =>
                        setEditing({ type: "income", item: income })
                      }
                    >
                      <MaterialIcons
                        name="edit"
                        size={20}
                        color={C.onSurfaceVariant}
                      />
                    </Pressable>
                    <Pressable
                      style={styles.iconBtn}
                      onPress={() => handleDeleteIncome(income)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={20}
                        color={C.error}
                      />
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
          key={`${editing.type}-${editing.item.id}`}
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
