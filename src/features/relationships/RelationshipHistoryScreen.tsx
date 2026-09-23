import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useCouple } from "../../providers/CoupleProvider";
import * as coupleService from "../../services/couple";
import * as relationshipService from "../../services/relationship";
import type { Couple, PartnerInfo } from "../../types/domain";
import { spacing } from "../../theme";
import {
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from "../../components/ui";
import { RelationshipCard } from "./components/RelationshipCard";

type LoadStatus = "loading" | "ready" | "error";

function openRelationship(id: string) {
  router.push({ pathname: "/relationship-detail", params: { id } });
}

/**
 * Histórico de relacionamentos do usuário (Fase 13): separa o vínculo atual
 * dos vínculos encerrados. Tudo é somente leitura; vínculos antigos nunca
 * aparecem como se fossem o casal atual.
 */
export function RelationshipHistoryScreen() {
  const { profile, couple, partnerInfo, partnerAvatarUrl } = useCouple();
  const userId = profile?.id ?? null;
  const currentCoupleId = couple?.id ?? null;

  const [ended, setEnded] = useState<Couple[]>([]);
  const [partners, setPartners] = useState<Record<string, PartnerInfo>>({});
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    coupleService
      .fetchRelationshipHistory(userId)
      .then(async (historyResult) => {
        if (!active) return;

        if (historyResult.error) {
          setError(historyResult.error.message);
          setEnded([]);
          setStatus("error");
          return;
        }

        setEnded(historyResult.data);

        const ids = historyResult.data.map((item) => item.id);
        if (currentCoupleId) ids.push(currentCoupleId);

        if (ids.length === 0) {
          setPartners({});
          setStatus("ready");
          return;
        }

        const partnersResult =
          await relationshipService.fetchPartnersByCoupleIds(ids);
        if (!active) return;

        setPartners(partnersResult.error ? {} : partnersResult.data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o histórico.",
        );
        setEnded([]);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [userId, currentCoupleId, attempt]);

  const handleRetry = () => {
    setStatus("loading");
    setError(null);
    setAttempt((current) => current + 1);
  };

  if (!profile) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando seu histórico..." />
      </Screen>
    );
  }

  if (status === "loading" && ended.length === 0 && !couple) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando seu histórico..." />
      </Screen>
    );
  }

  if (status === "error" && ended.length === 0) {
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
      <View style={styles.section}>
        <SectionHeader
          title="Relacionamento atual"
          subtitle="Seu vínculo aberto no momento"
        />
        {couple ? (
          <RelationshipCard
            couple={couple}
            partner={partners[couple.id] ?? partnerInfo}
            avatarUrl={partnerAvatarUrl}
            onPress={() => openRelationship(couple.id)}
          />
        ) : (
          <EmptyState
            icon="person-add-alt"
            title="Sem vínculo atual"
            description="Quando você formar um novo vínculo, ele aparece aqui."
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Encerrados"
          subtitle="Histórico preservado e somente leitura"
        />
        {status === "loading" ? (
          <LoadingState message="Carregando relacionamentos..." />
        ) : ended.length > 0 ? (
          <View style={styles.list}>
            {ended.map((item) => (
              <RelationshipCard
                key={item.id}
                couple={item}
                partner={partners[item.id] ?? null}
                onPress={() => openRelationship(item.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="history"
            title="Nenhum relacionamento encerrado"
            description="Vínculos encerrados continuam disponíveis aqui para consulta, sem apagar o histórico."
          />
        )}

        <AppText variant="bodySmall" color="textSecondary">
          Dados de relacionamentos encerrados são apenas para consulta. Para
          exportar, abra o relacionamento desejado.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
