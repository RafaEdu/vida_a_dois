import { useMemo, useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/lib/auth-context";
import type { IdealSplit } from "../../src/types/database";
import { formatCurrency } from "../../src/utils/currency";
import { getCurrentYearMonth } from "../../src/utils/date";
import {
  groupExpensesByCategory,
  selectExpensesByMonth,
  sumExpenses,
} from "../../src/domain/finance/selectors";
import { styles } from "../../src/styles/cost-plan";

export default function CostPlan() {
  const { couple, profile, partnerInfo, expenses, fetchIdealSplit } = useAuth();
  const [idealSplit, setIdealSplit] = useState<IdealSplit | null>(null);

  useEffect(() => {
    fetchIdealSplit().then((result) => setIdealSplit(result.data));
  }, [fetchIdealSplit]);

  const summary = useMemo(() => {
    const budget = couple?.monthly_budget ?? 0;
    const monthExpenses = selectExpensesByMonth(expenses, getCurrentYearMonth());
    const totalSpent = sumExpenses(monthExpenses);

    return {
      budget,
      totalSpent,
      remaining: budget - totalSpent,
      categoryBreakdown: groupExpensesByCategory(monthExpenses),
    };
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

      {(couple?.shared_balance ?? 0) !== 0 && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Caixa comum acumulado</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: (couple?.shared_balance ?? 0) >= 0 ? "#2E7D32" : "#D32F2F" },
            ]}
          >
            {formatCurrency(couple?.shared_balance ?? 0)}
          </Text>
        </View>
      )}

      {idealSplit && (
        <View style={styles.idealCard}>
          <Text style={styles.idealTitle}>Divisão ideal (proporcional à renda)</Text>
          <Text style={styles.idealDescription}>
            Calculado automaticamente com base no salário de cada um
          </Text>
          <View style={styles.idealRow}>
            <View style={styles.idealPerson}>
              <Text style={styles.idealName} numberOfLines={1}>
                {profile?.full_name}
              </Text>
              <Text style={styles.idealPercent}>{idealSplit.ratio_a}%</Text>
            </View>
            <Text style={styles.idealVs}>×</Text>
            <View style={styles.idealPerson}>
              <Text style={styles.idealName} numberOfLines={1}>
                {partnerInfo?.full_name}
              </Text>
              <Text style={styles.idealPercent}>{idealSplit.ratio_b}%</Text>
            </View>
          </View>
          {splitA !== idealSplit.ratio_a && (
            <Text style={styles.idealWarning}>
              A divisão atual ({splitA}% / {splitB}%) difere da divisão ideal.
              Você pode editá-la manualmente.
            </Text>
          )}
        </View>
      )}

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
