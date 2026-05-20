import { useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../src/lib/auth-context";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CostPlan() {
  const { couple, profile, partnerInfo, expenses } = useAuth();

  const summary = useMemo(() => {
    const budget = couple?.monthly_budget ?? 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthExpenses = expenses.filter((e: any) => {
      if (!e.due_date) return true;
      const d = new Date(e.due_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const remaining = budget - totalSpent;

    const byCategory: Record<string, number> = {};
    monthExpenses.forEach((e: any) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    const categoryBreakdown = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => ({ name, amount }));

    return { budget, totalSpent, remaining, categoryBreakdown, monthExpenses };
  }, [expenses, couple?.monthly_budget]);

  const splitA = couple?.split_ratio_a ?? 50;
  const splitB = couple?.split_ratio_b ?? 50;
  const userAAmount = summary.budget * (splitA / 100);
  const userBAmount = summary.budget * (splitB / 100);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Plano de custos</Text>
      <Text style={styles.subtitle}>
        Resumo do orçamento e divisão de custos do casal
      </Text>

      <View style={styles.budgetCard}>
        <Text style={styles.budgetLabel}>Orçamento mensal</Text>
        <Text style={styles.budgetValue}>{formatCurrency(summary.budget)}</Text>
        {summary.budget > 0 && (
          <View style={styles.budgetSubRow}>
            <View style={styles.budgetSubItem}>
              <Text style={styles.budgetSubLabel}>Gasto</Text>
              <Text style={[styles.budgetSubValue, { color: "#D32F2F" }]}>
                {formatCurrency(summary.totalSpent)}
              </Text>
            </View>
            <View style={styles.budgetDivider} />
            <View style={styles.budgetSubItem}>
              <Text style={styles.budgetSubLabel}>Disponível</Text>
              <Text
                style={[
                  styles.budgetSubValue,
                  { color: summary.remaining >= 0 ? "#2E7D32" : "#D32F2F" },
                ]}
              >
                {formatCurrency(summary.remaining)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.splitCard}>
        <Text style={styles.splitTitle}>Divisão de custos</Text>
        <View style={styles.splitRow}>
          <View style={styles.splitSide}>
            <View style={styles.splitAvatar}>
              <Text style={styles.splitAvatarText}>
                {profile?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ?? "??"}
              </Text>
            </View>
            <Text style={styles.splitName} numberOfLines={1}>
              {profile?.full_name}
            </Text>
            <Text style={styles.splitPercent}>{splitA}%</Text>
            <Text style={styles.splitAmount}>{formatCurrency(userAAmount)}</Text>
          </View>
          <View style={styles.splitDivider} />
          <View style={styles.splitSide}>
            <View style={[styles.splitAvatar, styles.splitAvatarPartner]}>
              <Text style={styles.splitAvatarText}>
                {partnerInfo?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ?? "??"}
              </Text>
            </View>
            <Text style={styles.splitName} numberOfLines={1}>
              {partnerInfo?.full_name}
            </Text>
            <Text style={styles.splitPercent}>{splitB}%</Text>
            <Text style={styles.splitAmount}>{formatCurrency(userBAmount)}</Text>
          </View>
        </View>
      </View>

      {summary.categoryBreakdown.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Gastos por categoria</Text>
          <View style={styles.categoryList}>
            {summary.categoryBreakdown.map((cat) => (
              <View key={cat.name} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(cat.amount)}
                  </Text>
                </View>
                <View style={styles.categoryBar}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      {
                        width: `${
                          summary.budget > 0
                            ? Math.min((cat.amount / summary.budget) * 100, 100)
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.categoryPercent}>
                  {summary.budget > 0
                    ? ((cat.amount / summary.budget) * 100).toFixed(1)
                    : 0}
                  % do orçamento
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Link href="/cost-plan/edit" asChild>
        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.editButtonPressed,
          ]}
        >
          <Text style={styles.editButtonText}>Editar plano de custos</Text>
        </Pressable>
      </Link>
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
  budgetCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 13,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  budgetValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  budgetSubRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetSubItem: {
    flex: 1,
    alignItems: "center",
  },
  budgetSubLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  budgetSubValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  budgetDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E0E0E0",
  },
  splitCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 24,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  splitSide: {
    flex: 1,
    alignItems: "center",
  },
  splitAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  splitAvatarPartner: {
    backgroundColor: "#4ECDC4",
  },
  splitAvatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  splitName: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
    maxWidth: 100,
  },
  splitPercent: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: 2,
  },
  splitAmount: {
    fontSize: 13,
    color: "#666",
  },
  splitDivider: {
    width: 1,
    height: 80,
    backgroundColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  categoryList: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    marginBottom: 24,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  categoryAmount: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  categoryBar: {
    height: 6,
    backgroundColor: "#E8E8E8",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  categoryBarFill: {
    height: "100%",
    backgroundColor: "#FF6B6B",
    borderRadius: 3,
  },
  categoryPercent: {
    fontSize: 11,
    color: "#999",
  },
  editButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
