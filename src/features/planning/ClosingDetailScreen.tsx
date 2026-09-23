import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useCouple } from "../../providers/CoupleProvider";
import * as closingService from "../../services/monthlyClosing";
import type { MonthlyClosing } from "../../types/domain";
import { formatCurrency } from "../../utils/currency";
import { formatDateFromTimestamp, formatYearMonthLong } from "../../utils/date";
import { getInitials } from "../../utils/initials";
import { colors, spacing } from "../../theme";
import {
  AppText,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from "../../components/ui";
import { resolveClosingAuthorLabel } from "./model";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Detalhe somente-leitura de um fechamento consolidado. Os valores vêm do
 * snapshot em `monthly_closings`, não de recálculo sobre as despesas/receitas
 * atuais (que podem ter sido alteradas em outros meses).
 */
export function ClosingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { couple, profile, partnerInfo } = useCouple();
  const closingId = typeof params.id === "string" ? params.id : undefined;
  const [closing, setClosing] = useState<MonthlyClosing | null>(null);
  const [status, setStatus] = useState<LoadStatus>(
    closingId ? "loading" : "error",
  );
  const [error, setError] = useState<string | null>(
    closingId ? null : "Fechamento não encontrado.",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!closingId) return;
    let active = true;

    closingService
      .fetchMonthlyClosing(closingId)
      .then((result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error.message);
          setClosing(null);
          setStatus("error");
          return;
        }
        if (!result.data) {
          setError("Fechamento não encontrado.");
          setClosing(null);
          setStatus("error");
          return;
        }
        setClosing(result.data);
        setError(null);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o fechamento.",
        );
        setClosing(null);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [closingId, attempt]);

  const handleRetry = () => {
    if (!closingId) return;
    setStatus("loading");
    setAttempt((current) => current + 1);
  };

  if (status === "loading") {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando fechamento..." />
      </Screen>
    );
  }

  if (status === "error" || !closing) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Fechamento indisponível"
          message={error ?? undefined}
          onRetry={closingId ? handleRetry : undefined}
        />
      </Screen>
    );
  }

  const monthLabel = formatYearMonthLong(closing.year_month);
  const selfIsA = Boolean(couple && profile && couple.user_a === profile.id);
  const selfShare = selfIsA ? closing.split_ratio_a : closing.split_ratio_b;
  const partnerShare = selfIsA ? closing.split_ratio_b : closing.split_ratio_a;
  const selfInitials = getInitials(profile?.full_name, "??");
  const partnerInitials = getInitials(partnerInfo?.full_name, "??");
  const closedByLabel = resolveClosingAuthorLabel(
    closing.closed_by,
    profile?.id,
    profile?.full_name,
    partnerInfo?.id,
    partnerInfo?.full_name,
  );

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <SectionHeader title={monthLabel} subtitle="Resumo consolidado do mês" />

      <Card padded style={styles.card}>
        <InfoRow
          label="Receitas do mês"
          value={formatCurrency(closing.total_incomes)}
          valueColor="success"
        />
        <InfoRow
          label="Despesas do mês"
          value={formatCurrency(closing.total_expenses)}
          valueColor="danger"
        />
        <InfoRow
          label="Orçamento mensal"
          value={formatCurrency(closing.monthly_budget)}
        />

        <View style={styles.divider} />

        <InfoRow
          label="Saldo do mês"
          value={formatCurrency(closing.month_delta)}
          emphasis
          valueColor={closing.month_delta >= 0 ? "success" : "danger"}
        />
      </Card>

      <SectionHeader title="Caixa comum" />
      <Card padded style={styles.card}>
        <InfoRow
          label="Saldo antes do fechamento"
          value={formatCurrency(closing.shared_balance_before)}
        />
        <InfoRow
          label="Saldo depois do fechamento"
          value={formatCurrency(closing.shared_balance_after)}
          emphasis
          valueColor="primary"
        />
      </Card>

      <SectionHeader title="Divisão do mês" />
      <Card padded style={styles.card}>
        <ShareRow
          initials={selfInitials}
          name={profile?.full_name ?? "Você"}
          share={selfShare}
        />
        <ShareRow
          initials={partnerInitials}
          name={partnerInfo?.full_name ?? "Parceiro"}
          share={partnerShare}
        />
      </Card>

      <SectionHeader title="Auditoria" />
      <Card padded style={styles.card}>
        <InfoRow label="Fechado por" value={closedByLabel} />
        <InfoRow
          label="Data do fechamento"
          value={formatDateFromTimestamp(closing.closed_at)}
        />
      </Card>
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

interface ShareRowProps {
  initials: string;
  name: string;
  share: number;
}

function ShareRow({ initials, name, share }: ShareRowProps) {
  return (
    <View style={styles.row}>
      <AppText
        variant="bodySmall"
        color="textSecondary"
        style={styles.rowLabel}
      >
        {initials} · {name}
      </AppText>
      <AppText variant="bodySemibold" color="text" tabular>
        {`${Math.round(share)}%`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
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
});
