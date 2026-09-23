import type { CoupleStatus, Expense } from "../../types/domain";
import { DEFAULT_REMINDER_TIME } from "./preferences";
import type { NotificationPreferenceValues } from "./preferences";

export type NotificationCategory =
  | "dueSoon"
  | "pendingExpenses"
  | "closingReminder"
  | "inviteUpdates"
  | "sharedActivity";

export interface PlannedNotification {
  /** Identificador determinístico (evita agendamentos duplicados). */
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  date: Date;
}

/** Prefixo de todas as notificações gerenciadas por este app. */
export const NOTIFICATION_ID_PREFIX = "vida-a-dois:";

/** Quantos dias antes do vencimento o lembrete "vencimento próximo" dispara. */
export const DUE_SOON_DAYS = 1;

export interface ActivitySignal {
  latest_id: string;
  latest_created_at: string;
}

export interface BuildScheduledNotificationsInput {
  now: Date;
  preferences: NotificationPreferenceValues;
  coupleStatus: CoupleStatus | null;
  coupleId: string | null;
  expenses: Expense[];
  lastClosedMonth: string | null;
  currentYearMonth: string;
  lastActivitySeenAt: string | null;
  latestActivity: ActivitySignal | null;
  dueSoonDays?: number;
}

interface Reminder {
  hours: number;
  minutes: number;
}

export function parseReminderTime(value: string): Reminder {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || DEFAULT_REMINDER_TIME);
  if (!match) {
    const fallback = /^(\d{1,2}):(\d{2})/.exec(DEFAULT_REMINDER_TIME)!;
    return { hours: Number(fallback[1]), minutes: Number(fallback[2]) };
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    const fallback = /^(\d{1,2}):(\d{2})/.exec(DEFAULT_REMINDER_TIME)!;
    return { hours: Number(fallback[1]), minutes: Number(fallback[2]) };
  }
  return { hours, minutes };
}

/** Interpreta "YYYY-MM-DD" como data local (evita deslocamento por UTC). */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

export function atTime(date: Date, reminder: Reminder): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    reminder.hours,
    reminder.minutes,
    0,
    0,
  );
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

/** Próxima ocorrência do horário de lembrete a partir de `now`. */
export function nextReminder(now: Date, reminder: Reminder): Date {
  const today = atTime(now, reminder);
  return today.getTime() > now.getTime() ? today : addDays(today, 1);
}

/** Último dia do mês "YYYY-MM" às 00:00 local. */
export function lastDayOfMonth(yearMonth: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(year, month, 0);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateLabel(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/**
 * Calcula o conjunto exato de notificações locais desejadas. É pura e
 * determinística: o mesmo estado produz os mesmos ids, o que permite ao app
 * reconciliar agendamentos sem duplicatas.
 */
export function buildScheduledNotifications(
  input: BuildScheduledNotificationsInput,
): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  const preferences = input.preferences;

  if (!preferences.notifications_enabled) return planned;

  const now = input.now;
  const reminder = parseReminderTime(preferences.reminder_time);
  const dueSoonDays = input.dueSoonDays ?? DUE_SOON_DAYS;

  if (preferences.due_soon_enabled) {
    for (const expense of input.expenses) {
      if (expense.paid || !expense.due_date) continue;

      const due = parseDateOnly(expense.due_date);
      if (!due) continue;

      const dueEnd = endOfDay(due);
      if (dueEnd.getTime() < now.getTime()) continue;

      let fireAt = atTime(addDays(due, -dueSoonDays), reminder);
      if (fireAt.getTime() <= now.getTime()) {
        fireAt = nextReminder(now, reminder);
      }
      if (fireAt.getTime() > dueEnd.getTime()) continue;

      planned.push({
        id: `${NOTIFICATION_ID_PREFIX}due-soon:${expense.id}`,
        category: "dueSoon",
        title: "Vencimento próximo",
        body: `${expense.description} vence em ${formatDateLabel(due)}.`,
        date: fireAt,
      });
    }
  }

  if (preferences.pending_expenses_enabled) {
    const pendingCount = input.expenses.filter(
      (expense) => !expense.paid,
    ).length;
    if (pendingCount > 0) {
      const fireAt = nextReminder(now, reminder);
      planned.push({
        id: `${NOTIFICATION_ID_PREFIX}pending:${dateKey(fireAt)}`,
        category: "pendingExpenses",
        title: "Despesas pendentes",
        body:
          pendingCount === 1
            ? "Você tem 1 despesa aguardando pagamento."
            : `Você tem ${pendingCount} despesas aguardando pagamento.`,
        date: fireAt,
      });
    }
  }

  if (
    preferences.closing_reminder_enabled &&
    input.coupleStatus === "active" &&
    input.lastClosedMonth !== input.currentYearMonth
  ) {
    const monthEnd = lastDayOfMonth(input.currentYearMonth);
    if (monthEnd) {
      const fireAt = atTime(monthEnd, reminder);
      if (fireAt.getTime() > now.getTime()) {
        planned.push({
          id: `${NOTIFICATION_ID_PREFIX}closing:${input.currentYearMonth}`,
          category: "closingReminder",
          title: "Fechamento do mês",
          body: "O mês está acabando. Feche o mês para consolidar o caixa do casal.",
          date: fireAt,
        });
      }
    }
  }

  if (
    preferences.invite_updates_enabled &&
    input.coupleStatus === "pending" &&
    input.coupleId
  ) {
    planned.push({
      id: `${NOTIFICATION_ID_PREFIX}invite:${input.coupleId}`,
      category: "inviteUpdates",
      title: "Convite pendente",
      body: "Você tem um convite de vínculo aguardando confirmação.",
      date: nextReminder(now, reminder),
    });
  }

  if (preferences.shared_activity_enabled && input.latestActivity) {
    const latest = new Date(input.latestActivity.latest_created_at);
    const seen = input.lastActivitySeenAt
      ? new Date(input.lastActivitySeenAt)
      : null;

    if (!Number.isNaN(latest.getTime()) && (!seen || latest > seen)) {
      planned.push({
        id: `${NOTIFICATION_ID_PREFIX}activity:${input.latestActivity.latest_id}`,
        category: "sharedActivity",
        title: "Novidades no casal",
        body: "Há novidades compartilhadas no feed de atividade.",
        date: nextReminder(now, reminder),
      });
    }
  }

  const byId = new Map<string, PlannedNotification>();
  for (const item of planned) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }

  return Array.from(byId.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}
