import { useEffect, useRef, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../src/lib/auth-context";

function getInitials(name: string | undefined | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Home() {
  const {
    profile,
    partnerInfo,
    couple,
    userState,
    expenses,
    fetchExpenses,
    updateExpense,
    signOut,
  } = useAuth();
  const hasNavigated = useRef(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (userState !== "linked") {
      hasNavigated.current = true;
      router.replace("/");
    }
  }, [userState]);

  useEffect(() => {
    if (couple?.status === "active" && !hasFetched.current) {
      hasFetched.current = true;
      fetchExpenses();
    }
  }, [couple?.status, fetchExpenses]);

  const summary = useMemo(() => {
    const budget = couple?.monthly_budget ?? 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthExpenses = expenses.filter((e) => {
      if (!e.due_date) return true;
      const d = new Date(e.due_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget - totalSpent;
    const paid = monthExpenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);
    const pending = monthExpenses.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0);

    return { budget, totalSpent, remaining, paid, pending, monthExpenses };
  }, [expenses, couple?.monthly_budget]);

  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  const handleConfirmPayment = async (expenseId: string) => {
    await updateExpense(expenseId, {
      paid: true,
      paid_at: new Date().toISOString(),
    });
  };

  const getPayerName = (paidBy: string | null | undefined): string | null => {
    if (!paidBy) return null;
    if (paidBy === profile?.id) return null;
    return partnerInfo?.full_name ?? "Parceiro";
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.coupleCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.full_name)}
            </Text>
          </View>
          <Text style={styles.and}>&</Text>
          <View style={[styles.avatar, styles.partnerAvatar]}>
            <Text style={styles.avatarText}>
              {getInitials(partnerInfo?.full_name)}
            </Text>
          </View>
        </View>
        <Text style={styles.coupleText}>
          {profile?.full_name} & {partnerInfo?.full_name}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryBudget]}>
          <Text style={styles.summaryLabel}>Orçamento</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary.budget)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.summarySpent]}>
          <Text style={styles.summaryLabel}>Gasto no mês</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary.totalSpent)}
          </Text>
        </View>
        <View style={[styles.summaryCard, summary.remaining >= 0 ? styles.summaryRemaining : styles.summaryOver]}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary.remaining)}
          </Text>
        </View>
      </View>

      {summary.budget > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((summary.totalSpent / summary.budget) * 100, 100)}%`,
                  backgroundColor:
                    summary.remaining < 0
                      ? "#D32F2F"
                      : summary.totalSpent / summary.budget > 0.8
                        ? "#FFB347"
                        : "#4CAF50",
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              Pago: {formatCurrency(summary.paid)}
            </Text>
            <Text style={styles.progressText}>
              Pendente: {formatCurrency(summary.pending)}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Ações</Text>

      <View style={styles.actionsGrid}>
        <Link href="/expense/new" asChild>
          <Pressable style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}>
            <Text style={styles.actionIcon}>{"\uD83D\uDCB0"}</Text>
            <Text style={styles.actionTitle}>Cadastrar{"\n"}despesa</Text>
            <Text style={styles.actionSubtitle}>Adicionar novo gasto</Text>
          </Pressable>
        </Link>

        <Link href="/income/new" asChild>
          <Pressable style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}>
            <Text style={styles.actionIcon}>{"\uD83D\uDCC8"}</Text>
            <Text style={styles.actionTitle}>Adicionar{"\n"}receita</Text>
            <Text style={styles.actionSubtitle}>Registrar renda extra</Text>
          </Pressable>
        </Link>

        <Link href="/cost-plan" asChild>
          <Pressable style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}>
            <Text style={styles.actionIcon}>{"\uD83D\uDCCA"}</Text>
            <Text style={styles.actionTitle}>Visualizar{"\n"}plano de custos</Text>
            <Text style={styles.actionSubtitle}>Ver orçamento e gastos</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.actionsGrid}>
        <Link href="/cost-plan/edit" asChild>
          <Pressable style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}>
            <Text style={styles.actionIcon}>{"\u270F\uFE0F"}</Text>
            <Text style={styles.actionTitle}>Editar{"\n"}plano de custos</Text>
            <Text style={styles.actionSubtitle}>Ajustar orçamento</Text>
          </Pressable>
        </Link>

        <Link href="/monthly-closing" asChild>
          <Pressable style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}>
            <Text style={styles.actionIcon}>{"\uD83D\uDDD3\uFE0F"}</Text>
            <Text style={styles.actionTitle}>Fechamento{"\n"}do mês</Text>
            <Text style={styles.actionSubtitle}>Resumo e saldo</Text>
          </Pressable>
        </Link>

        <View style={[styles.actionCard, styles.actionCardEmpty]} />
      </View>

      {recentExpenses.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Despesas recentes</Text>
          <View style={styles.expenseList}>
            {recentExpenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseLeft}>
                  <View style={styles.expenseCategoryRow}>
                    <Text style={styles.expenseCategory}>{expense.category}</Text>
                    {expense.is_recurring && (
                      <View style={styles.recurringBadge}>
                        <Text style={styles.recurringBadgeText}>Recorrente</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.expenseDescription} numberOfLines={1}>
                    {expense.description}
                  </Text>
                  {getPayerName(expense.paid_by) && (
                    <Text style={styles.expensePayer}>
                      Pago por {getPayerName(expense.paid_by)}
                    </Text>
                  )}
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.amount)}
                  </Text>
                  <Text
                    style={[
                      styles.expenseStatus,
                      expense.paid && styles.expenseStatusPaid,
                    ]}
                  >
                    {expense.paid ? "Pago" : "Pendente"}
                  </Text>
                  {!expense.paid && expense.is_recurring && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && styles.confirmButtonPressed,
                      ]}
                      onPress={() => handleConfirmPayment(expense.id)}
                    >
                      <Text style={styles.confirmButtonText}>Confirmar</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {expenses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{"\uD83D\uDCB0"}</Text>
          <Text style={styles.emptyText}>
            Nenhuma despesa cadastrada ainda. Comece adicionando sua primeira despesa!
          </Text>
        </View>
      )}

      <View style={styles.linkRow}>
        <Link href="/profile" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.linkButton,
              pressed && styles.linkButtonPressed,
            ]}
          >
            <Text style={styles.linkButtonText}>Meu perfil</Text>
          </Pressable>
        </Link>
        <Pressable
          style={({ pressed }) => [
            styles.linkButton,
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
          ]}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  coupleCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 24,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  partnerAvatar: {
    backgroundColor: "#4ECDC4",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  and: {
    fontSize: 24,
    color: "#FF6B6B",
    fontWeight: "300",
    marginHorizontal: 12,
  },
  coupleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  summaryBudget: {
    backgroundColor: "#F3F0FF",
  },
  summarySpent: {
    backgroundColor: "#FFF0F0",
  },
  summaryRemaining: {
    backgroundColor: "#F0FFF0",
  },
  summaryOver: {
    backgroundColor: "#FFF0F0",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  progressContainer: {
    marginBottom: 28,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 12,
    color: "#888",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  actionCardPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 18,
  },
  actionSubtitle: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
  actionCardEmpty: {
    backgroundColor: "transparent",
    boxShadow: "none",
  },
  expenseList: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 4,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    marginBottom: 28,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  expenseLeft: {
    flex: 1,
    marginRight: 12,
  },
  expenseCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  recurringBadge: {
    backgroundColor: "#F3F0FF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  recurringBadgeText: {
    fontSize: 9,
    color: "#6C5CE7",
    fontWeight: "600",
  },
  expenseDescription: {
    fontSize: 14,
    color: "#333",
  },
  expensePayer: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  expenseStatus: {
    fontSize: 11,
    color: "#FFB347",
    fontWeight: "600",
  },
  expenseStatusPaid: {
    color: "#4CAF50",
  },
  confirmButton: {
    marginTop: 6,
    backgroundColor: "#4ECDC4",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confirmButtonPressed: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 28,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  linkRow: {
    gap: 12,
  },
  linkButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkButtonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  signOutButtonPressed: {
    backgroundColor: "#FAFAFA",
  },
  signOutText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
});
