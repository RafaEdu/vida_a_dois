import type { NotificationPreferences } from "../../types/domain";

/**
 * Campos de preferência editáveis pela pessoa. `last_activity_seen_at` é de
 * uso interno (marcação de leitura do feed) e fica fora deste tipo.
 */
export interface NotificationPreferenceValues {
  notifications_enabled: boolean;
  due_soon_enabled: boolean;
  pending_expenses_enabled: boolean;
  closing_reminder_enabled: boolean;
  invite_updates_enabled: boolean;
  shared_activity_enabled: boolean;
  reminder_time: string;
}

export const DEFAULT_REMINDER_TIME = "09:00";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferenceValues = {
  notifications_enabled: true,
  due_soon_enabled: true,
  pending_expenses_enabled: true,
  closing_reminder_enabled: true,
  invite_updates_enabled: true,
  shared_activity_enabled: true,
  reminder_time: DEFAULT_REMINDER_TIME,
};

/**
 * A coluna `time` do Postgres devolve "HH:MM:SS". A UI trabalha com "HH:MM";
 * qualquer valor inválido cai no padrão.
 */
export function normalizeReminderTime(
  value: string | null | undefined,
): string {
  if (!value) return DEFAULT_REMINDER_TIME;
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return DEFAULT_REMINDER_TIME;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return DEFAULT_REMINDER_TIME;

  return `${match[1]}:${match[2]}`;
}

/** Converte a linha do banco (ou a ausência dela) nos valores efetivos. */
export function toNotificationPreferenceValues(
  row: NotificationPreferences | null,
): NotificationPreferenceValues {
  if (!row) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

  return {
    notifications_enabled: row.notifications_enabled,
    due_soon_enabled: row.due_soon_enabled,
    pending_expenses_enabled: row.pending_expenses_enabled,
    closing_reminder_enabled: row.closing_reminder_enabled,
    invite_updates_enabled: row.invite_updates_enabled,
    shared_activity_enabled: row.shared_activity_enabled,
    reminder_time: normalizeReminderTime(row.reminder_time),
  };
}
