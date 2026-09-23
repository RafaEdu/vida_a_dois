import { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useCouple } from "../../providers/CoupleProvider";
import { useNotifications } from "../../providers/NotificationProvider";
import { spacing } from "../../theme";
import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from "../../components/ui";
import { ActivityItem } from "./components/ActivityItem";

/**
 * Feed de atividade do vínculo: somente eventos relevantes (despesa paga, mês
 * fechado, mudança de orçamento/divisão, meta concluída, recorrência encerrada
 * e vínculo encerrado). Vínculo encerrado permanece somente leitura.
 */
export function ActivityScreen() {
  const { couple, activity, activityLoading, activityError, fetchActivity } =
    useCouple();
  const { markActivitySeen } = useNotifications();

  useEffect(() => {
    void fetchActivity();
  }, [fetchActivity]);

  // Abrir o feed conta como "visto" e desativa o lembrete de novidades.
  useEffect(() => {
    if (activity.length > 0) {
      void markActivitySeen();
    }
  }, [activity, markActivitySeen]);

  const handleRetry = useCallback(() => {
    void fetchActivity();
  }, [fetchActivity]);

  if (activityLoading && activity.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando a atividade..." />
      </Screen>
    );
  }

  if (activityError && activity.length === 0) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Não foi possível carregar a atividade"
          message={activityError}
          onRetry={handleRetry}
        />
      </Screen>
    );
  }

  if (!couple) {
    return (
      <Screen edges={["left", "right"]}>
        <EmptyState
          icon="link-off"
          title="Sem vínculo ativo"
          description="O feed de atividade fica disponível quando existe um vínculo com o casal."
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
        title="Atividade do casal"
        subtitle="Eventos relevantes do nosso vínculo, do mais recente ao mais antigo"
      />

      {couple.status === "ended" ? (
        <Card variant="subtle" padded style={styles.notice}>
          <AppText variant="bodySmall" color="textSecondary">
            Este vínculo está encerrado. O feed fica apenas para consulta do
            histórico.
          </AppText>
        </Card>
      ) : null}

      {activity.length === 0 ? (
        <EmptyState
          icon="history"
          title="Nenhuma atividade ainda"
          description="Quando houver eventos relevantes — como uma despesa paga ou um mês fechado — eles aparecem aqui."
        />
      ) : (
        <View style={styles.list}>
          {activity.map((item) => (
            <ActivityItem key={item.id} activity={item} />
          ))}
        </View>
      )}
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
  list: {
    gap: spacing.md,
  },
});
