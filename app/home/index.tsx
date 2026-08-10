import { useEffect, useRef, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
} from "react-native";
import { Link, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/auth-context";
import { C } from "../../src/theme/colors";
import { shadow, shadowNav } from "../../src/theme/shadows";
import { styles } from "./styles";

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);

  if (diff === 0) {
    return `Hoje, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }
  if (diff === 1) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function Home() {
  const insets = useSafeAreaInsets();
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

    return { budget, totalSpent, remaining, paid, pending };
  }, [expenses, couple?.monthly_budget]);

  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  const progressPct =
    summary.budget > 0
      ? Math.min((summary.totalSpent / summary.budget) * 100, 100)
      : 0;

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

  const getCategoryIcon = (category: string): keyof typeof MaterialIcons.glyphMap => {
    const lower = category.toLowerCase();
    if (lower.includes("aluguel") || lower.includes("financiamento") || lower.includes("condomínio")) return "home";
    if (lower.includes("supermercado") || lower.includes("alimentação") || lower.includes("mercado")) return "shopping-cart";
    if (lower.includes("transporte") || lower.includes("combustível")) return "local-gas-station";
    if (lower.includes("saúde") || lower.includes("farmácia") || lower.includes("plano")) return "local-hospital";
    if (lower.includes("streaming") || lower.includes("internet")) return "wifi";
    if (lower.includes("energia") || lower.includes("água") || lower.includes("gás")) return "bolt";
    if (lower.includes("lazer") || lower.includes("entretenimento")) return "celebration";
    if (lower.includes("educação")) return "school";
    if (lower.includes("vestuário")) return "checkroom";
    return "receipt";
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, shadow]}>
        <View style={styles.headerContent}>
          <View style={styles.avatarStack}>
            <View style={styles.avatarBack}>
              <Text style={styles.avatarBackText}>
                {getInitials(profile?.full_name)}
              </Text>
            </View>
            <View style={styles.avatarFront}>
              <Text style={styles.avatarFrontText}>
                {getInitials(partnerInfo?.full_name)}
              </Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Vida a Dois</Text>
          <MaterialIcons name="notifications" size={24} color={C.primary} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Couple Identity Card */}
        <View style={[styles.coupleCard, shadow]}>
          <View style={styles.coupleAvatars}>
            <View style={styles.coupleAvatarA}>
              <Text style={styles.coupleAvatarText}>
                {getInitials(profile?.full_name)}
              </Text>
            </View>
            <View style={styles.coupleAvatarB}>
              <Text style={styles.coupleAvatarText}>
                {getInitials(partnerInfo?.full_name)}
              </Text>
            </View>
          </View>
          <Text style={styles.coupleName}>
            {profile?.full_name} & {partnerInfo?.full_name}
          </Text>
          <Text style={styles.coupleSubtitle}>Dashboard Financeiro do Casal</Text>
        </View>

        {/* Bento Grid Metrics */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: C.primaryContainer }]}>
            <Text style={styles.metricLabel}>ORÇAMENTO</Text>
            <Text style={styles.metricValue}>{formatCurrency(summary.budget)}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: C.secondaryContainer }]}>
            <Text style={styles.metricLabel}>GASTO MÊS</Text>
            <Text style={styles.metricValue}>{formatCurrency(summary.totalSpent)}</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: C.tertiaryContainer }]}>
            <Text style={styles.metricLabel}>SALDO</Text>
            <Text style={styles.metricValue}>{formatCurrency(summary.remaining)}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        {summary.budget > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <View>
                <Text style={styles.progressLabelTitle}>Pago</Text>
                <Text style={styles.progressLabelValue}>{formatCurrency(summary.paid)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.progressLabelTitle}>Pendente</Text>
                <Text style={styles.progressLabelValue}>{formatCurrency(summary.pending)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <Text style={styles.sectionTitle}>Ações</Text>
        <View style={styles.actionsGrid}>
          <Link href="/expense/new" asChild>
            <Pressable style={styles.actionItem}>
              <View style={styles.actionIconCircle}>
                <MaterialIcons name="payments" size={24} color={C.onSurface} />
              </View>
              <Text style={styles.actionLabel}>Cadastrar{"\n"}despesa</Text>
            </Pressable>
          </Link>
          <Link href="/income/new" asChild>
            <Pressable style={styles.actionItem}>
              <View style={styles.actionIconCircle}>
                <MaterialIcons name="trending-up" size={24} color={C.onSurface} />
              </View>
              <Text style={styles.actionLabel}>Adicionar{"\n"}receita</Text>
            </Pressable>
          </Link>
          <Link href="/cost-plan" asChild>
            <Pressable style={styles.actionItem}>
              <View style={styles.actionIconCircle}>
                <MaterialIcons name="analytics" size={24} color={C.onSurface} />
              </View>
              <Text style={styles.actionLabel}>Plano de{"\n"}custos</Text>
            </Pressable>
          </Link>
          <Link href="/cost-plan/edit" asChild>
            <Pressable style={styles.actionItem}>
              <View style={styles.actionIconCircle}>
                <MaterialIcons name="edit-note" size={24} color={C.onSurface} />
              </View>
              <Text style={styles.actionLabel}>Editar{"\n"}plano</Text>
            </Pressable>
          </Link>
          <Link href="/monthly-closing" asChild>
            <Pressable style={styles.actionItem}>
              <View style={[styles.actionIconCircle, styles.actionIconDanger]}>
                <MaterialIcons name="calendar-today" size={24} color={C.onSecondary} />
              </View>
              <Text style={styles.actionLabel}>Fechamento</Text>
            </Pressable>
          </Link>
          <Link href="/profile" asChild>
            <Pressable style={styles.actionItem}>
              <View style={styles.actionIconCircle}>
                <MaterialIcons name="person" size={24} color={C.onSurface} />
              </View>
              <Text style={styles.actionLabel}>Meu perfil</Text>
            </Pressable>
          </Link>
        </View>

        {/* Recent Expenses */}
        {recentExpenses.length > 0 && (
          <>
            <View style={styles.expenseHeader}>
              <Text style={styles.sectionTitle}>Despesas recentes</Text>
              <Link href="/expense/new" asChild>
                <Pressable>
                  <Text style={styles.seeAllText}>VER TUDO</Text>
                </Pressable>
              </Link>
            </View>
            <View style={styles.expenseList}>
              {recentExpenses.map((expense) => {
                const icon = getCategoryIcon(expense.category);
                const isPaid = expense.paid;
                return (
                  <View key={expense.id} style={[styles.expenseItem, { borderLeftColor: isPaid ? C.progressGreen : C.primary }]}>
                    <View style={styles.expenseIconBox}>
                      <MaterialIcons
                        name={icon}
                        size={22}
                        color={isPaid ? C.progressGreen : C.primary}
                      />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle} numberOfLines={1}>
                        {expense.description || expense.category}
                      </Text>
                      <View style={styles.expenseMeta}>
                        <View style={styles.expenseBadge}>
                          <Text style={styles.expenseBadgeText}>
                            {expense.is_recurring ? "Recorrente" : "Variável"}
                          </Text>
                        </View>
                        {expense.due_date ? (
                          <Text style={styles.expenseDate}>{formatDate(expense.due_date)}</Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.expenseAmountCol}>
                      <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                      {getPayerName(expense.paid_by) ? (
                        <Text style={styles.expensePayer}>{getPayerName(expense.paid_by)}</Text>
                      ) : (
                        <Text style={styles.expensePayer}>Você</Text>
                      )}
                      {!expense.paid && (
                        <Pressable
                          style={styles.confirmBtn}
                          onPress={() => handleConfirmPayment(expense.id)}
                        >
                          <MaterialIcons name="check-circle" size={14} color={C.onPrimary} />
                          <Text style={styles.confirmBtnText}>Pagar</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Empty State */}
        {expenses.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={48} color={C.outlineVariant} />
            <Text style={styles.emptyText}>
              Nenhuma despesa cadastrada ainda.
            </Text>
            <Text style={styles.emptySubtext}>
              Comece adicionando sua primeira despesa!
            </Text>
          </View>
        )}

        {/* Motivational Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerText}>
              Organização é a base da nossa prosperidade.
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <MaterialIcons name="logout" size={18} color={C.onSurfaceVariant} />
          <Text style={styles.signOutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, shadowNav, { paddingBottom: insets.bottom }]}>
        <View style={styles.navItemActive}>
          <MaterialIcons name="home" size={22} color={C.onPrimaryContainer} />
          <Text style={styles.navLabelActive}>Início</Text>
        </View>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="history" size={22} color={C.onSurfaceVariant} />
          <Text style={styles.navLabel}>Histórico</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="leaderboard" size={22} color={C.onSurfaceVariant} />
          <Text style={styles.navLabel}>Gráficos</Text>
        </Pressable>
        <Link href="/profile" asChild>
          <Pressable style={styles.navItem}>
            <MaterialIcons name="person" size={22} color={C.onSurfaceVariant} />
            <Text style={styles.navLabel}>Perfil</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
