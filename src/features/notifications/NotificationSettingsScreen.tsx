import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useNotifications } from "../../providers/NotificationProvider";
import { spacing } from "../../theme";
import {
  AppText,
  Card,
  Chip,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
  SwitchRow,
} from "../../components/ui";
import type { NotificationPreferenceValues } from "../../domain/notifications/preferences";

const REMINDER_OPTIONS = ["08:00", "09:00", "12:00", "18:00", "20:00"];

interface CategoryOption {
  key: keyof NotificationPreferenceValues;
  label: string;
  description: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: "due_soon_enabled",
    label: "Vencimento próximo",
    description: "Um dia antes de uma conta vencer.",
  },
  {
    key: "pending_expenses_enabled",
    label: "Despesas pendentes",
    description: "Resumo diário enquanto houver contas em aberto.",
  },
  {
    key: "closing_reminder_enabled",
    label: "Fechamento do mês",
    description: "Lembrete no fim do mês para consolidar o caixa.",
  },
  {
    key: "invite_updates_enabled",
    label: "Convite e vínculo",
    description: "Quando houver um convite aguardando confirmação.",
  },
  {
    key: "shared_activity_enabled",
    label: "Novidades compartilhadas",
    description: "Quando houver novidades no feed de atividade.",
  },
];

/**
 * Preferências individuais de notificação. As notificações desta fase são
 * locais (agendadas no próprio aparelho) e ficam desativadas enquanto o usuário
 * não conceder permissão ao sistema.
 */
export function NotificationSettingsScreen() {
  const {
    preferences,
    loading,
    error,
    permissionGranted,
    updatePreferences,
    enableNotifications,
    refresh,
  } = useNotifications();
  const [saving, setSaving] = useState(false);

  const handleToggleEnabled = useCallback(
    async (value: boolean) => {
      if (!value) {
        await updatePreferences({ notifications_enabled: false });
        return;
      }

      setSaving(true);
      try {
        const granted = await enableNotifications();
        if (!granted) {
          Alert.alert(
            "Permissão necessária",
            "Ative as notificações nas configurações do sistema para receber os lembretes.",
          );
        }
      } finally {
        setSaving(false);
      }
    },
    [enableNotifications, updatePreferences],
  );

  const handleToggleCategory = useCallback(
    async (key: keyof NotificationPreferenceValues, value: boolean) => {
      const result = await updatePreferences({ [key]: value });
      if (result.error) {
        Alert.alert("Não foi possível salvar", result.error);
      }
    },
    [updatePreferences],
  );

  const handleSelectTime = useCallback(
    async (time: string) => {
      const result = await updatePreferences({ reminder_time: time });
      if (result.error) {
        Alert.alert("Não foi possível salvar", result.error);
      }
    },
    [updatePreferences],
  );

  if (loading) {
    return (
      <Screen edges={["left", "right"]}>
        <LoadingState message="Carregando suas preferências..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={["left", "right"]}>
        <ErrorState
          title="Não foi possível carregar suas preferências"
          message={error}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  const enabled = preferences.notifications_enabled;

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <SectionHeader
          title="Notificações"
          subtitle="Lembretes úteis sobre a vida financeira do casal"
        />
        <Card padded style={styles.card}>
          <SwitchRow
            label="Ativar notificações"
            description="Você pode desativar a qualquer momento."
            value={enabled}
            onValueChange={handleToggleEnabled}
            disabled={saving}
            testID="notifications-enabled"
          />
          {!permissionGranted && enabled ? (
            <AppText variant="bodySmall" color="warning">
              A permissão do sistema ainda não foi concedida; nenhum lembrete
              será agendado.
            </AppText>
          ) : null}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Categorias"
          subtitle="Escolha quais avisos fazem sentido para você"
        />
        <Card padded style={styles.card}>
          {CATEGORY_OPTIONS.map((option) => (
            <SwitchRow
              key={option.key}
              label={option.label}
              description={option.description}
              value={Boolean(preferences[option.key])}
              onValueChange={(value) =>
                void handleToggleCategory(option.key, value)
              }
              disabled={!enabled}
              testID={`notifications-${option.key}`}
            />
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Horário dos lembretes"
          subtitle="Quando os avisos do dia podem ser disparados"
        />
        <View style={styles.chips}>
          {REMINDER_OPTIONS.map((time) => (
            <Chip
              key={time}
              label={time}
              selected={preferences.reminder_time === time}
              disabled={!enabled}
              onPress={() => void handleSelectTime(time)}
            />
          ))}
        </View>
        <AppText variant="bodySmall" color="textSecondary">
          As notificações são agendadas no próprio aparelho e não usam servidor
          de push.
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
  card: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
