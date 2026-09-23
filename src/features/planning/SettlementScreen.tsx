import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useCouple } from "../../providers/CoupleProvider";
import { useFinance } from "../../providers/FinanceProvider";
import * as closingService from "../../services/monthlyClosing";
import type { MonthlyClosing } from "../../types/domain";
import {
  calculateSettlement,
  resolveSettlementOutcome,
  resolveSettlementPerspective,
  type SettlementOutcome,
} from "../../domain/finance/settlement";
import { selectExpensesByMonth } from "../../domain/finance/selectors";
import { resolveSettlementHeadline } from "./model";
import { formatCurrency } from "../../utils/currency";
import { formatYearMonthLong, getCurrentYearMonth } from "../../utils/date";
import { getInitials } from "../../utils/initials";
import { colors, radius, spacing, type ColorToken } from "../../theme";
import {
  AppText,
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MoneyText,
  Screen,
  SectionHeader,
} from "../../components/ui";
import { MonthPicker } from "../../components/finance";

interface OutcomePresentation {
  icon: "check-circle" | "trending-up" | "trending-down";
  background: string;
  iconColor: string;
}

/**
 * Acerto do casal (Fase 8): mostra quanto cada pessoa deveria ter pago, quanto
 * pagou de fato e quem adiantou a diferença no período. O cálculo fica no
 * domínio puro (`domain/finance/settlement`) e usa o snapshot do fechamento
 * quando o mês já está consolidado.
 */
export function SettlementScreen() {
  const params = useLocalSearchParams<{ yearMonth?: string }>();
  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const [selectedMonth, setSelectedMonth] = useState(
    typeof params.yearMonth === "string" && params.yearMonth
      ? params.yearMonth
      : currentYearMonth,
  );

  const { couple, profile, partnerInfo } = useCouple();
  const { expenses, expensesLoading, expensesError, fetchExpenses } =
    useFinance();
  const coupleId = couple?.id ?? null;

  const [closingState, setClosingState] = useState<{
    month: string;
    data: MonthlyClosing | null;
  } | null>(null);

  useEffect(() => {
    if (!coupleId) return;

    let active = true;

    closingService
      .fetchMonthlyClosingByMonth(coupleId, selectedMonth)
      .then((result) => {
        if (!active) return;
        setClosingState({
          month: selectedMonth,
          data: result.error ? null : result.data,
        });
      })
      .catch(() => {
        if (active) setClosingState({ month: selectedMonth, data: null });
      });

    return () => {
      active = false;
    };
  }, [coupleId, selectedMonth]);

  // O snapshot só vale para o mês atualmente selecionado; enquanto o mês novo
  // ainda não foi buscado, o resultado é tratado como prévia.
  const closing =
    closingState && closingState.month === selectedMonth
      ? closingState.data
      : null;
  const closingLoading =
    Boolean(coupleId) && closingState?.month !== selectedMonth;

  const monthExpenses = useMemo(
    () => selectExpensesByMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const splitRatioA = closing?.split_ratio_a ?? couple?.split_ratio_a ?? 50;
  const splitRatioB = closing?.split_ratio_b ?? couple?.split_ratio_b ?? 50;

  const settlement = useMemo(() => {
    if (!couple) return null;
    return calculateSettlement({
      expenses: monthExpenses,
      splitRatioA,
      userIdA: couple.user_a,
      userIdB: couple.user_b,
    });
  }, [couple, monthExpenses, splitRatioA]);

  const selfIsA = Boolean(couple && profile && couple.user_a === profile.id);
  const perspective = settlement
    ? resolveSettlementPerspective(settlement, selfIsA)
    : null;
  const outcome = perspective
    ? resolveSettlementOutcome(perspective.selfDifference)
    : null;

  const isClosed = Boolean(closing);
  const isCurrentMonth = selectedMonth === currentYearMonth;
  const selfName = profile?.full_name ?? "Você";
  const partnerName = partnerInfo?.full_name ?? "Seu parceiro";
  const selfRatio = selfIsA ? splitRatioA : splitRatioB;
  const partnerRatio = selfIsA ? splitRatioB : splitRatioA;

  const hasAnyData = expenses.length > 0;
  const showInitialLoading = (expensesLoading || closingLoading) && !hasAnyData;
  const showInitialError = Boolean(expensesError) && !hasAnyData;

  const handleRetry = () => {
    void fetchExpenses();
  };

  if (!couple) {
    return (
      <Screen edges={["left", "right"]}>
        <EmptyState
          icon="link-off"
          title="Sem vínculo ativo"
          description="O acerto do casal fica disponível enquanto existe um vínculo ativo."
        />
      </Screen>
    );
  }

  if (showInitialError) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Não foi possível carregar o acerto"
          message={expensesError ?? undefined}
          onRetry={handleRetry}
        />
      </Screen>
    );
  }

  if (showInitialLoading) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando acerto..." />
      </Screen>
    );
  }

  const headline =
    outcome && perspective
      ? resolveSettlementHeadline(outcome, partnerName)
      : null;
  const presentation = outcome ? presentationFor(outcome.outcome) : null;

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.periodBlock}>
        <MonthPicker
          value={selectedMonth}
          onChange={setSelectedMonth}
          maxYearMonth={currentYearMonth}
        />
        <Badge
          label={isClosed ? "Mês fechado" : "Prévia do mês"}
          tone={isClosed ? "success" : "warning"}
          icon={isClosed ? "lock" : "schedule"}
        />
      </View>

      <View style={styles.stateNote}>
        <MaterialIcons
          name={isClosed ? "verified" : "info-outline"}
          size={16}
          color={isClosed ? colors.success : colors.warning}
        />
        <AppText variant="bodySmall" color="textSecondary" style={styles.note}>
          {isClosed
            ? `Resultado estável a partir do fechamento de ${formatYearMonthLong(
                closing?.year_month ?? selectedMonth,
              )}.`
            : "Este mês ainda está aberto: o acerto é uma prévia e pode mudar até o fechamento."}
        </AppText>
      </View>

      {settlement && perspective && outcome && headline && presentation ? (
        <>
          {settlement.totalPaid === 0 && settlement.totalPending === 0 ? (
            <EmptyState
              icon="receipt-long"
              title="Nenhuma despesa no período"
              description="Quando houver despesas neste mês, o acerto aparece aqui."
            />
          ) : (
            <>
              <Card
                padded
                style={[
                  styles.heroCard,
                  { backgroundColor: presentation.background },
                ]}
              >
                <MaterialIcons
                  name={presentation.icon}
                  size={28}
                  color={presentation.iconColor}
                />
                <AppText variant="h2" align="center">
                  {headline.title}
                </AppText>
                <AppText
                  variant="bodySmall"
                  color="textSecondary"
                  align="center"
                >
                  {headline.description}
                </AppText>
              </Card>

              <SectionHeader
                title="Resumo do período"
                subtitle={
                  isCurrentMonth
                    ? "Prévia do mês corrente"
                    : formatYearMonthLong(selectedMonth)
                }
              />
              <Card padded style={styles.card}>
                <InfoRow
                  label="Total efetivamente pago"
                  value={formatCurrency(settlement.totalPaid)}
                  emphasis
                />
                <InfoRow
                  label="Ainda pendente"
                  value={formatCurrency(settlement.totalPending)}
                  valueColor={
                    settlement.totalPending > 0 ? "warning" : "textSecondary"
                  }
                />
                {closing ? (
                  <InfoRow
                    label="Despesas consolidadas no fechamento"
                    value={formatCurrency(closing.total_expenses)}
                    valueColor="textSecondary"
                  />
                ) : null}

                {settlement.totalPending > 0 ? (
                  <AppText variant="bodySmall" color="textSecondary">
                    Despesas pendentes não entram no acerto até serem pagas.
                  </AppText>
                ) : null}
              </Card>

              <SectionHeader
                title="Responsabilidade e pagamento"
                subtitle="Quem deveria pagar e quem pagou de fato"
              />
              <Card padded style={styles.card}>
                <PartyBlock
                  initials={getInitials(selfName, "??")}
                  name={selfName}
                  tone="partnerA"
                  ratio={selfRatio}
                  expected={perspective.selfExpected}
                  paid={perspective.selfPaid}
                  difference={perspective.selfDifference}
                />

                <View style={styles.divider} />

                <PartyBlock
                  initials={getInitials(partnerName, "??")}
                  name={partnerName}
                  tone="partnerB"
                  ratio={partnerRatio}
                  expected={perspective.partnerExpected}
                  paid={perspective.partnerPaid}
                  difference={perspective.partnerDifference}
                />

                <AppText variant="bodySmall" color="textSecondary">
                  Diferença positiva significa que a pessoa pagou mais do que a
                  própria parte; negativa, que pagou menos.
                </AppText>
              </Card>
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function presentationFor(outcome: SettlementOutcome): OutcomePresentation {
  if (outcome === "self_advanced") {
    return {
      icon: "trending-up",
      background: colors.primarySoft,
      iconColor: colors.primary,
    };
  }

  if (outcome === "partner_advanced") {
    return {
      icon: "trending-down",
      background: colors.surfaceSubtle,
      iconColor: colors.textSecondary,
    };
  }

  return {
    icon: "check-circle",
    background: colors.successSoft,
    iconColor: colors.success,
  };
}

interface InfoRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
  valueColor?: ColorToken;
}

function InfoRow({
  label,
  value,
  emphasis = false,
  valueColor = "text",
}: InfoRowProps) {
  return (
    <View style={styles.row}>
      <AppText
        variant="bodySmall"
        color="textSecondary"
        style={styles.rowLabel}
      >
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

interface PartyBlockProps {
  initials: string;
  name: string;
  tone: "partnerA" | "partnerB";
  ratio: number;
  expected: number;
  paid: number;
  difference: number;
}

function PartyBlock({
  initials,
  name,
  tone,
  ratio,
  expected,
  paid,
  difference,
}: PartyBlockProps) {
  const differenceColor: ColorToken =
    difference > 0 ? "success" : difference < 0 ? "danger" : "textSecondary";

  return (
    <View style={styles.party}>
      <View style={styles.partyHeader}>
        <Avatar initials={initials} tone={tone} size="md" />
        <View style={styles.partyIdentity}>
          <AppText variant="bodySemibold" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary" tabular>
            {`${Math.round(ratio)}% da divisão`}
          </AppText>
        </View>
      </View>

      <InfoRow label="Responsabilidade" value={formatCurrency(expected)} />
      <InfoRow label="Pagou" value={formatCurrency(paid)} />
      <View style={styles.row}>
        <AppText
          variant="bodySmall"
          color="textSecondary"
          style={styles.rowLabel}
        >
          Diferença
        </AppText>
        <MoneyText
          value={difference}
          variant="bodySmallMedium"
          color={differenceColor}
          signed
          accessibilityLabel={`Diferença: ${formatCurrency(difference)}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  periodBlock: {
    alignItems: "center",
    gap: spacing.md,
  },
  stateNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  note: {
    flex: 1,
  },
  heroCard: {
    alignItems: "center",
    gap: spacing.sm,
  },
  card: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  party: {
    gap: spacing.xs,
  },
  partyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  partyIdentity: {
    flex: 1,
    gap: 2,
  },
});
