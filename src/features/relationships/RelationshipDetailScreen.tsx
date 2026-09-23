import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useCouple } from "../../providers/CoupleProvider";
import * as coupleService from "../../services/couple";
import { fetchExportDataset } from "../../services/export";
import type { ExportDataset } from "../../domain/export/builders";
import { getInitials } from "../../utils/initials";
import { formatCurrency } from "../../utils/currency";
import {
  formatDateFromTimestamp,
  formatDateOnlyForDisplay,
  formatYearMonthLong,
} from "../../utils/date";
import { colors, spacing } from "../../theme";
import {
  AppText,
  Avatar,
  Badge,
  Card,
  ErrorState,
  LoadingState,
  MoneyText,
  Screen,
  SectionHeader,
} from "../../components/ui";
import { ActivityItem } from "../activity/components/ActivityItem";
import {
  resolveRelationshipPeriod,
  resolveRelationshipStatus,
  summarizeRelationshipData,
} from "./model";
import { RelationshipExportCard } from "./components/RelationshipExportCard";

type LoadStatus = "loading" | "ready" | "error";

const RECENT_LIMIT = 20;
const ACTIVITY_LIMIT = 10;

/**
 * Detalhe somente leitura de um relacionamento (atual ou encerrado) com
 * parceiro, período, fechamentos, lançamentos, metas e atividade. Nenhuma
 * ação de escrita é oferecida aqui.
 */
export function RelationshipDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const coupleId = typeof params.id === "string" ? params.id : undefined;
  const { profile } = useCouple();
  const selfId = profile?.id ?? null;

  const [dataset, setDataset] = useState<ExportDataset | null>(null);
  const [status, setStatus] = useState<LoadStatus>(
    coupleId ? "loading" : "error",
  );
  const [error, setError] = useState<string | null>(
    coupleId ? null : "Relacionamento não encontrado.",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!coupleId || !selfId || !profile) return;
    let active = true;

    coupleService
      .fetchCoupleById(coupleId)
      .then(async (coupleResult) => {
        if (!active) return;

        if (coupleResult.error) {
          setError(coupleResult.error.message);
          setDataset(null);
          setStatus("error");
          return;
        }
        if (!coupleResult.data) {
          setError("Relacionamento não encontrado.");
          setDataset(null);
          setStatus("error");
          return;
        }

        const dataResult = await fetchExportDataset(coupleResult.data, {
          id: selfId,
          full_name: profile.full_name,
        });
        if (!active) return;

        if (dataResult.error) {
          setError(dataResult.error.message);
          setDataset(null);
          setStatus("error");
          return;
        }

        setDataset(dataResult.data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o relacionamento.",
        );
        setDataset(null);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [coupleId, selfId, profile, attempt]);

  const handleRetry = () => {
    setStatus("loading");
    setError(null);
    setAttempt((current) => current + 1);
  };

  const partnerMember = useMemo(
    () =>
      dataset?.members.find((member) => member.id !== dataset.selfId) ?? null,
    [dataset],
  );

  const totals = useMemo(
    () =>
      dataset
        ? summarizeRelationshipData({
            expenses: dataset.expenses,
            incomes: dataset.incomes,
            closings: dataset.closings,
            goals: dataset.goals,
          })
        : null,
    [dataset],
  );

  if (status === "loading") {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando relacionamento..." />
      </Screen>
    );
  }

  if (status === "error" || !dataset || !totals) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Relacionamento indisponível"
          message={error ?? undefined}
          onRetry={coupleId ? handleRetry : undefined}
        />
      </Screen>
    );
  }

  const { couple } = dataset;
  const statusMeta = resolveRelationshipStatus(couple.status);
  const period = resolveRelationshipPeriod(couple);
  const partnerName = partnerMember?.full_name?.trim() || "Parceiro";
  const isEnded = couple.status === "ended";
  const recentExpenses = [...dataset.expenses]
    .sort((a, b) =>
      (b.due_date ?? b.created_at).localeCompare(a.due_date ?? a.created_at),
    )
    .slice(0, RECENT_LIMIT);
  const recentIncomes = [...dataset.incomes]
    .sort((a, b) => b.received_at.localeCompare(a.received_at))
    .slice(0, RECENT_LIMIT);

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <Card padded style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Avatar
            initials={getInitials(partnerMember?.full_name, "??")}
            tone="primary"
            size="xl"
          />
          <View style={styles.headerText}>
            <AppText variant="h3" numberOfLines={1}>
              {partnerName}
            </AppText>
            <Badge label={statusMeta.label} tone={statusMeta.tone} />
          </View>
        </View>
        <View style={styles.periodRow}>
          <MaterialIcons
            name="date-range"
            size={16}
            color={colors.textSecondary}
          />
          <AppText variant="bodySmall" color="textSecondary">
            {period.label}
          </AppText>
        </View>
        {isEnded ? (
          <AppText variant="bodySmall" color="textSecondary">
            Este relacionamento está encerrado. Todo o conteúdo abaixo é somente
            leitura.
          </AppText>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Resumo"
          subtitle="Totais do relacionamento como um todo"
        />
        <Card padded style={styles.totalsCard}>
          <InfoRow
            label="Receitas"
            value={formatCurrency(totals.totalIncomes)}
            valueColor="success"
          />
          <InfoRow
            label="Despesas"
            value={formatCurrency(totals.totalExpenses)}
            valueColor="danger"
          />
          <View style={styles.divider} />
          <InfoRow
            label="Saldo"
            value={formatCurrency(totals.balance)}
            emphasis
            valueColor={totals.balance >= 0 ? "success" : "danger"}
          />
          <AppText variant="label" color="textSecondary">
            {totals.expensesCount} despesa(s) · {totals.incomesCount} receita(s)
            · {totals.closingsCount} fechamento(s) · {totals.goalsCount} meta(s)
          </AppText>
        </Card>
      </View>

      <RelationshipExportCard couple={couple} />

      <View style={styles.section}>
        <SectionHeader
          title="Fechamentos"
          subtitle="Snapshots consolidados do relacionamento"
        />
        {dataset.closings.length > 0 ? (
          <View style={styles.list}>
            {[...dataset.closings]
              .sort((a, b) => b.year_month.localeCompare(a.year_month))
              .map((closing) => (
                <Card key={closing.id} padded={false} style={styles.rowCard}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/closing-detail",
                        params: { id: closing.id },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir fechamento de ${formatYearMonthLong(
                      closing.year_month,
                    )}`}
                    style={({ pressed }) => [
                      styles.row,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <View style={styles.rowText}>
                      <AppText variant="bodySemibold">
                        {formatYearMonthLong(closing.year_month)}
                      </AppText>
                      <AppText variant="bodySmall" color="textSecondary">
                        Fechado em {formatDateFromTimestamp(closing.closed_at)}
                      </AppText>
                    </View>
                    <MoneyText
                      value={closing.month_delta}
                      variant="bodySemibold"
                      color={closing.month_delta >= 0 ? "success" : "danger"}
                      signed
                    />
                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </Card>
              ))}
          </View>
        ) : (
          <AppText variant="bodySmall" color="textSecondary">
            Nenhum mês foi fechado neste relacionamento.
          </AppText>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Despesas"
          subtitle={
            dataset.expenses.length > RECENT_LIMIT
              ? `Mostrando as ${RECENT_LIMIT} mais recentes`
              : undefined
          }
        />
        {recentExpenses.length > 0 ? (
          <Card padded style={styles.rowsCard}>
            {recentExpenses.map((expense) => (
              <View key={expense.id} style={styles.ledgerRow}>
                <View style={styles.rowText}>
                  <AppText variant="bodySmallMedium" numberOfLines={1}>
                    {expense.description}
                  </AppText>
                  <AppText variant="label" color="textSecondary">
                    {expense.due_date
                      ? formatDateOnlyForDisplay(expense.due_date)
                      : formatDateFromTimestamp(expense.created_at)}{" "}
                    · {expense.category}
                  </AppText>
                </View>
                <View style={styles.ledgerAmount}>
                  <MoneyText
                    value={expense.amount}
                    variant="bodySmallMedium"
                    color={expense.paid ? "text" : "textSecondary"}
                  />
                  <Badge
                    label={expense.paid ? "Pago" : "Pendente"}
                    tone={expense.paid ? "success" : "warning"}
                  />
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <AppText variant="bodySmall" color="textSecondary">
            Nenhuma despesa registrada.
          </AppText>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Receitas"
          subtitle={
            dataset.incomes.length > RECENT_LIMIT
              ? `Mostrando as ${RECENT_LIMIT} mais recentes`
              : undefined
          }
        />
        {recentIncomes.length > 0 ? (
          <Card padded style={styles.rowsCard}>
            {recentIncomes.map((income) => (
              <View key={income.id} style={styles.ledgerRow}>
                <View style={styles.rowText}>
                  <AppText variant="bodySmallMedium" numberOfLines={1}>
                    {income.description}
                  </AppText>
                  <AppText variant="label" color="textSecondary">
                    {formatDateFromTimestamp(income.received_at)}
                    {income.is_extra ? " · extra" : ""}
                  </AppText>
                </View>
                <MoneyText
                  value={income.amount}
                  variant="bodySmallMedium"
                  color="success"
                />
              </View>
            ))}
          </Card>
        ) : (
          <AppText variant="bodySmall" color="textSecondary">
            Nenhuma receita registrada.
          </AppText>
        )}
      </View>

      {dataset.goals.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Metas" subtitle="Objetivos do relacionamento" />
          <Card padded style={styles.rowsCard}>
            {dataset.goals.map((goal) => (
              <View key={goal.id} style={styles.ledgerRow}>
                <View style={styles.rowText}>
                  <AppText variant="bodySmallMedium" numberOfLines={1}>
                    {goal.title}
                  </AppText>
                  <AppText variant="label" color="textSecondary">
                    Meta: {formatCurrency(goal.target_amount)}
                  </AppText>
                </View>
                <Badge
                  label={
                    goal.status === "completed"
                      ? "Concluída"
                      : goal.status === "archived"
                        ? "Arquivada"
                        : "Ativa"
                  }
                  tone={goal.status === "active" ? "primary" : "neutral"}
                />
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {dataset.activity.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Atividade"
            subtitle="Eventos importantes do relacionamento"
          />
          <View style={styles.list}>
            {dataset.activity.slice(0, ACTIVITY_LIMIT).map((item) => (
              <ActivityItem key={item.id} activity={item} />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
  valueColor?: "text" | "textSecondary" | "success" | "danger" | "primary";
}

function InfoRow({
  label,
  value,
  emphasis = false,
  valueColor = "text",
}: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="bodySmall" color="textSecondary">
        {label}
      </AppText>
      <AppText
        variant={emphasis ? "bodySemibold" : "bodySmallMedium"}
        color={valueColor}
        tabular
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  headerCard: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  totalsCard: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  rowCard: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    minHeight: 64,
  },
  pressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  rowsCard: {
    gap: spacing.md,
  },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  ledgerAmount: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
});
