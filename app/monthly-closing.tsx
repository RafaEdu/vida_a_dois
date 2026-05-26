import { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/lib/auth-context";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function MonthlyClosing() {
  const { couple, expenses, incomes, closeMonth } = useAuth();
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const alreadyClosed = couple?.last_closed_month === currentYearMonth;

  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthExpenses = expenses.filter((e) => {
      if (!e.due_date) return true;
      const d = new Date(e.due_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthIncomes = incomes.filter((i) => {
      const d = new Date(i.received_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomes = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
    const monthBalance = totalIncomes - totalExpenses;
    const budget = couple?.monthly_budget ?? 0;
    const sharedBalance = couple?.shared_balance ?? 0;

    return {
      totalExpenses,
      totalIncomes,
      monthBalance,
      budget,
      sharedBalance,
      monthExpenses,
      monthIncomes,
    };
  }, [expenses, incomes, couple]);

  const handleCloseMonth = async () => {
    if (closing) return;
    setError("");
    setClosing(true);
    try {
      const { error: closeError, result: closeResult } = await closeMonth();

      if (closeError) {
        setError(closeError);
      } else if (closeResult) {
        setResult(closeResult);
      }
    } catch {
      setError("Erro inesperado ao fechar o mês.");
    } finally {
      setClosing(false);
    }
  };

  const currentMonth = useMemo(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${mm}`;
  }, []);

  const monthAlreadyClosed = couple?.last_closed_month === currentMonth;

  const monthName = useMemo(() => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    return months[new Date().getMonth()];
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Fechamento do mês</Text>
      <Text style={styles.subtitle}>
        Resumo financeiro de {monthName}
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

<<<<<<< HEAD
      {alreadyClosed && (
        <View style={styles.idempotencyBox}>
          <Text style={styles.idempotencyTitle}>Mês já consolidado</Text>
          <Text style={styles.idempotencyText}>
            Este mês já foi consolidado e o saldo foi integrado ao Caixa Comum.
          </Text>
        </View>
      )}
=======
      {monthAlreadyClosed ? (
        <View style={styles.alreadyClosedCard}>
          <Text style={styles.alreadyClosedIcon}>{"\uD83D\uDD12"}</Text>
          <Text style={styles.alreadyClosedTitle}>Mês já fechado</Text>
          <Text style={styles.alreadyClosedText}>
            Este mês já foi fechado e os saldos foram integrados ao Caixa Comum.
          </Text>
        </View>
      ) : null}
>>>>>>> a7cf52451e8961595acf93985fb155e14ceb966e

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Mês fechado!</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Receitas do mês</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(result.total_incomes)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Despesas do mês</Text>
            <Text style={[styles.resultValue, { color: "#D32F2F" }]}>
              {formatCurrency(result.total_expenses)}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, { fontWeight: "700" }]}>
              Saldo do mês
            </Text>
            <Text
              style={[
                styles.resultValue,
                { fontWeight: "700", fontSize: 20 },
                { color: result.month_balance >= 0 ? "#2E7D32" : "#D32F2F" },
              ]}
            >
              {formatCurrency(result.month_balance)}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Saldo anterior do caixa</Text>
            <Text style={styles.resultValue}>
              {formatCurrency(result.previous_balance)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, { fontWeight: "700" }]}>
              Novo saldo do caixa comum
            </Text>
            <Text
              style={[styles.resultValue, { fontWeight: "700", fontSize: 22, color: "#FF6B6B" }]}
            >
              {formatCurrency(result.new_shared_balance)}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Resumo de {monthName}</Text>

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={styles.labelText}>Receitas</Text>
          </View>
          <Text style={[styles.rowValue, { color: "#2E7D32" }]}>
            {formatCurrency(summary.totalIncomes)}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={styles.labelText}>Despesas</Text>
          </View>
          <Text style={[styles.rowValue, { color: "#D32F2F" }]}>
            {formatCurrency(summary.totalExpenses)}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={styles.labelText}>Orçamento mensal</Text>
          </View>
          <Text style={styles.rowValue}>
            {formatCurrency(summary.budget)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={[styles.labelText, { fontWeight: "700" }]}>
              Saldo do mês
            </Text>
          </View>
          <Text
            style={[
              styles.rowValue,
              { fontWeight: "700", fontSize: 18 },
              { color: summary.monthBalance >= 0 ? "#2E7D32" : "#D32F2F" },
            ]}
          >
            {formatCurrency(summary.monthBalance)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={styles.labelText}>Caixa comum atual</Text>
          </View>
          <Text style={[styles.rowValue, { color: "#FF6B6B" }]}>
            {formatCurrency(summary.sharedBalance)}
          </Text>
        </View>

        {summary.monthBalance !== 0 && (
          <View style={styles.projectionRow}>
            <Text style={styles.projectionText}>
              {summary.monthBalance >= 0
                ? `Ao fechar, o caixa comum será de ${formatCurrency(summary.sharedBalance + summary.monthBalance)}`
                : `Ao fechar, o caixa comum será de ${formatCurrency(summary.sharedBalance + summary.monthBalance)}`}
            </Text>
          </View>
        )}
      </View>

      {summary.monthIncomes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Receitas do mês</Text>
          <View style={styles.list}>
            {summary.monthIncomes.map((income) => (
              <View key={income.id} style={styles.listItem}>
                <View style={styles.listLeft}>
                  <Text style={styles.listDescription} numberOfLines={1}>
                    {income.description}
                  </Text>
                  <Text style={styles.listTag}>
                    {income.is_extra ? "Extra" : "Salário"}
                  </Text>
                </View>
                <Text style={[styles.listAmount, { color: "#2E7D32" }]}>
                  {formatCurrency(income.amount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {summary.monthExpenses.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Despesas do mês</Text>
          <View style={styles.list}>
            {summary.monthExpenses.map((expense) => (
              <View key={expense.id} style={styles.listItem}>
                <View style={styles.listLeft}>
                  <Text style={styles.listCategory}>{expense.category}</Text>
                  <Text style={styles.listDescription} numberOfLines={1}>
                    {expense.description}
                  </Text>
                </View>
                <Text style={[styles.listAmount, { color: "#D32F2F" }]}>
                  {formatCurrency(expense.amount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

<<<<<<< HEAD
      {!result && !alreadyClosed && (
=======
      {!result && !monthAlreadyClosed && (
>>>>>>> a7cf52451e8961595acf93985fb155e14ceb966e
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            closing && styles.closeButtonDisabled,
            pressed && styles.closeButtonPressed,
          ]}
          onPress={handleCloseMonth}
          disabled={closing}
        >
          {closing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.closeButtonText}>Fechar mês</Text>
          )}
        </Pressable>
      )}

      {result && (
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      )}

      {!result && (
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.cancelButtonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Voltar</Text>
        </Pressable>
      )}
    </ScrollView>
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
  idempotencyBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFE082",
    alignItems: "center",
  },
  idempotencyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F57F17",
    marginBottom: 6,
  },
  idempotencyText: {
    fontSize: 14,
    color: "#795548",
    textAlign: "center",
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowLabel: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: "#666",
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },
  projectionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  projectionText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    marginTop: 8,
  },
  list: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 4,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    marginBottom: 24,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  listLeft: {
    flex: 1,
    marginRight: 12,
  },
  listCategory: {
    fontSize: 12,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 2,
  },
  listDescription: {
    fontSize: 14,
    color: "#333",
  },
  listTag: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  listAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  closeButtonDisabled: {
    opacity: 0.6,
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: "#F0FFF0",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#C8E6C9",
    marginVertical: 8,
  },
  backButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  alreadyClosedCard: {
    backgroundColor: "#F3F0FF",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D5CFF7",
  },
  alreadyClosedIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  alreadyClosedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6C5CE7",
    marginBottom: 8,
  },
  alreadyClosedText: {
    fontSize: 14,
    color: "#8E8CA6",
    textAlign: "center",
    lineHeight: 20,
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
