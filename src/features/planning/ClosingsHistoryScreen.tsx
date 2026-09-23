import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useCouple } from "../../providers/CoupleProvider";
import * as closingService from "../../services/monthlyClosing";
import type { MonthlyClosing } from "../../types/domain";
import { formatCurrency } from "../../utils/currency";
import { formatDateFromTimestamp, formatYearMonthLong } from "../../utils/date";
import { colors, radius, spacing } from "../../theme";
import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MoneyText,
  Screen,
  SectionHeader,
} from "../../components/ui";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Histórico de fechamentos do vínculo atual. Somente leitura: cada item abre o
 * snapshot consolidado (Parte D da Fase 7). O acesso a históricos de vínculos
 * `ended` é construído na Fase 13 (histórico de relacionamentos).
 */
export function ClosingsHistoryScreen() {
  const { couple } = useCouple();
  const coupleId = couple?.id ?? null;
  const [closings, setClosings] = useState<MonthlyClosing[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!coupleId) return;
    let active = true;

    closingService
      .fetchMonthlyClosings(coupleId)
      .then((result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error.message);
          setClosings([]);
          setStatus("error");
          return;
        }
        setClosings(result.data);
        setError(null);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o histórico.",
        );
        setClosings([]);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [coupleId, attempt]);

  const handleRetry = () => {
    setStatus("loading");
    setAttempt((current) => current + 1);
  };

  const totalConsolidated = useMemo(
    () => closings.reduce((sum, closing) => sum + closing.month_delta, 0),
    [closings],
  );

  if (!couple) {
    return (
      <Screen edges={["left", "right"]}>
        <EmptyState
          icon="link-off"
          title="Sem vínculo ativo"
          description="O histórico de fechamentos fica disponível enquanto existe um vínculo com o casal."
        />
      </Screen>
    );
  }

  if (status === "loading" && closings.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando histórico..." />
      </Screen>
    );
  }

  if (status === "error" && closings.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Não foi possível carregar o histórico"
          message={error ?? undefined}
          onRetry={handleRetry}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <SectionHeader
        title="Histórico de fechamentos"
        subtitle="Snapshots consolidados de cada mês"
      />

      {closings.length === 0 ? (
        <EmptyState
          icon="event-available"
          title="Nenhum mês fechado ainda"
          description="Ao fechar um mês, o resumo consolidado aparece aqui para consulta."
        />
      ) : (
        <>
          <Card padded style={styles.totalCard}>
            <AppText variant="labelCaps" color="textSecondary">
              Total consolidado no caixa
            </AppText>
            <MoneyText
              value={totalConsolidated}
              variant="h2"
              color={totalConsolidated >= 0 ? "text" : "danger"}
              signed
            />
            <AppText variant="bodySmall" color="textSecondary">
              Soma dos saldos mensais já integrados ao caixa comum.
            </AppText>
          </Card>

          <View style={styles.list}>
            {closings.map((closing) => (
              <ClosingRow key={closing.id} closing={closing} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function ClosingRow({ closing }: { closing: MonthlyClosing }) {
  return (
    <Card padded={false} style={styles.rowCard}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/closing-detail",
            params: { id: closing.id },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Abrir fechamento de ${formatYearMonthLong(closing.year_month)}`}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.rowIcon}>
          <MaterialIcons
            name="event-available"
            size={20}
            color={colors.primary}
          />
        </View>

        <View style={styles.rowText}>
          <AppText variant="bodySemibold">
            {formatYearMonthLong(closing.year_month)}
          </AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Fechado em {formatDateFromTimestamp(closing.closed_at)}
          </AppText>
        </View>

        <View style={styles.rowAmount}>
          <MoneyText
            value={closing.month_delta}
            variant="bodySemibold"
            color={closing.month_delta >= 0 ? "success" : "danger"}
            signed
          />
          <AppText variant="bodySmall" color="textSecondary" tabular>
            {formatCurrency(closing.shared_balance_after)}
          </AppText>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={22}
          color={colors.textSecondary}
        />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  totalCard: {
    gap: spacing.xs,
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
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowAmount: {
    alignItems: "flex-end",
    gap: 2,
  },
});
