import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useCouple } from "../../providers/CoupleProvider";
import { useFinance } from "../../providers/FinanceProvider";
import * as recurrenceService from "../../services/recurrence";
import type {
  RecurrenceSeries,
  RecurrenceSeriesInput,
} from "../../types/domain";
import { spacing } from "../../theme";
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
import { summarizeRecurrences } from "./model";
import { RecurrenceSeriesCard } from "./components/RecurrenceSeriesCard";
import { RecurrenceEditModal } from "./components/RecurrenceEditModal";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Tela "Recorrências": lista as séries de despesas recorrentes do vínculo e
 * permite editar o template, pausar/reativar e encerrar (cancelando as
 * ocorrências futuras pendentes) sem apagar histórico. A regra de mês fechado
 * e a geração da próxima parcela vivem no banco (migration 016).
 */
export function RecurrencesScreen() {
  const { couple } = useCouple();
  const { fetchExpenses } = useFinance();
  const coupleId = couple?.id ?? null;
  const canManage = couple?.status === "active";

  const [series, setSeries] = useState<RecurrenceSeries[]>([]);
  const [status, setStatus] = useState<LoadStatus>(
    coupleId ? "loading" : "ready",
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<RecurrenceSeries | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!coupleId) return;

    let active = true;

    recurrenceService
      .fetchRecurrenceSeries(coupleId)
      .then((result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error.message);
          setSeries([]);
          setStatus("error");
          return;
        }
        setSeries(result.data);
        setError(null);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as recorrências.",
        );
        setSeries([]);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [coupleId, attempt]);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    setAttempt((current) => current + 1);
  }, []);

  const handleSaveEdit = useCallback(
    async (id: string, input: RecurrenceSeriesInput) => {
      const { error: saveError, series: updated } =
        await recurrenceService.updateRecurrenceSeries(id, input);
      if (saveError) return { error: saveError };

      if (updated) {
        setSeries((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
      }
      void fetchExpenses();
      return {};
    },
    [fetchExpenses],
  );

  const handleToggleActive = useCallback(async (item: RecurrenceSeries) => {
    setBusyId(item.id);
    const { error: toggleError, series: updated } =
      await recurrenceService.setRecurrenceSeriesActive(item.id, !item.active);
    setBusyId(null);

    if (toggleError) {
      Alert.alert("Não foi possível atualizar", toggleError);
      return;
    }
    if (updated) {
      setSeries((prev) =>
        prev.map((current) => (current.id === updated.id ? updated : current)),
      );
    }
  }, []);

  const handleEnd = useCallback(
    (item: RecurrenceSeries) => {
      Alert.alert(
        "Encerrar recorrência",
        `A recorrência "${item.description}" será encerrada e as ocorrências futuras ainda pendentes serão canceladas. O histórico e os meses já pagos são preservados.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Encerrar",
            style: "destructive",
            onPress: async () => {
              setBusyId(item.id);
              const { error: endError, cancelledOccurrences } =
                await recurrenceService.endRecurrenceSeries(item.id);
              setBusyId(null);

              if (endError) {
                Alert.alert("Não foi possível encerrar", endError);
                return;
              }
              setSeries((prev) =>
                prev.map((current) =>
                  current.id === item.id
                    ? { ...current, active: false }
                    : current,
                ),
              );
              void fetchExpenses();
              if (cancelledOccurrences && cancelledOccurrences > 0) {
                Alert.alert(
                  "Recorrência encerrada",
                  `${cancelledOccurrences} ocorrência(s) futura(s) cancelada(s).`,
                );
              }
            },
          },
        ],
      );
    },
    [fetchExpenses],
  );

  const summary = useMemo(() => summarizeRecurrences(series), [series]);

  if (!couple) {
    return (
      <Screen edges={["left", "right"]}>
        <EmptyState
          icon="link-off"
          title="Sem vínculo ativo"
          description="As recorrências ficam disponíveis enquanto existe um vínculo com o casal."
        />
      </Screen>
    );
  }

  if (status === "loading" && series.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando recorrências..." />
      </Screen>
    );
  }

  if (status === "error" && series.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Não foi possível carregar as recorrências"
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
        title="Recorrências"
        subtitle="Despesas fixas que se repetem todo mês"
      />

      {!canManage ? (
        <Card variant="subtle" padded style={styles.notice}>
          <AppText variant="bodySmall" color="textSecondary">
            Este vínculo não está ativo. As recorrências ficam somente para
            leitura.
          </AppText>
        </Card>
      ) : null}

      {series.length === 0 ? (
        <EmptyState
          icon="autorenew"
          title="Nenhuma recorrência"
          description="Marque uma despesa como recorrente ao criá-la para gerenciá-la aqui."
        />
      ) : (
        <>
          <Card padded style={styles.summaryCard}>
            <AppText variant="labelCaps" color="textSecondary">
              Recorrências ativas
            </AppText>
            <AppText variant="h2">
              {summary.activeCount === 1
                ? "1 ativa"
                : `${summary.activeCount} ativas`}
            </AppText>
            <View style={styles.summaryFooter}>
              <MoneyText
                value={summary.activeMonthlyAmount}
                variant="bodySemibold"
                color="primary"
              />
              <AppText variant="bodySmall" color="textSecondary">
                por mês
              </AppText>
            </View>
            {summary.pausedCount > 0 ? (
              <AppText variant="bodySmall" color="textSecondary">
                {summary.pausedCount === 1
                  ? "1 pausada"
                  : `${summary.pausedCount} pausadas`}
              </AppText>
            ) : null}
          </Card>

          <View style={styles.list}>
            {series.map((item) => (
              <RecurrenceSeriesCard
                key={item.id}
                series={item}
                busy={busyId === item.id}
                onEdit={setEditing}
                onToggleActive={handleToggleActive}
                onEnd={handleEnd}
              />
            ))}
          </View>
        </>
      )}

      {editing ? (
        <RecurrenceEditModal
          key={editing.id}
          series={editing}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  notice: {
    gap: spacing.xs,
  },
  summaryCard: {
    gap: spacing.xs,
  },
  summaryFooter: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
});
