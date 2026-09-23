import { describe, expect, it } from "@jest/globals";
import type { Expense } from "../../../types/domain";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferenceValues,
} from "../preferences";
import {
  NOTIFICATION_ID_PREFIX,
  buildScheduledNotifications,
  type BuildScheduledNotificationsInput,
} from "../schedule";

const NOW = new Date(2026, 8, 22, 10, 0, 0); // 22/09/2026 10:00 local

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    couple_id: "c1",
    created_by: "u1",
    description: "Mercado",
    amount: 100,
    category: "Alimentação (mercado)",
    due_date: null,
    paid: false,
    paid_at: null,
    paid_by: null,
    is_recurring: false,
    recurrence_series_id: null,
    created_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

function preferences(
  overrides: Partial<NotificationPreferenceValues> = {},
): NotificationPreferenceValues {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...overrides };
}

function build(
  overrides: Partial<BuildScheduledNotificationsInput> = {},
): ReturnType<typeof buildScheduledNotifications> {
  return buildScheduledNotifications({
    now: NOW,
    preferences: preferences(),
    coupleStatus: "active",
    coupleId: "c1",
    expenses: [],
    lastClosedMonth: null,
    currentYearMonth: "2026-09",
    lastActivitySeenAt: null,
    latestActivity: null,
    ...overrides,
  });
}

describe("buildScheduledNotifications", () => {
  it("não agenda nada quando as notificações estão desativadas", () => {
    const planned = build({
      preferences: preferences({ notifications_enabled: false }),
      expenses: [makeExpense({ due_date: "2026-09-25" })],
      latestActivity: {
        latest_id: "a1",
        latest_created_at: "2026-09-22T08:00:00.000Z",
      },
    });

    expect(planned).toEqual([]);
  });

  it("agenda vencimento próximo um dia antes, no horário do lembrete", () => {
    const planned = build({
      expenses: [makeExpense({ id: "e1", due_date: "2026-09-25" })],
    });

    const dueSoon = planned.find((item) => item.id.endsWith("due-soon:e1"));
    expect(dueSoon).toBeDefined();
    expect(dueSoon?.category).toBe("dueSoon");
    expect(dueSoon?.date).toEqual(new Date(2026, 8, 24, 9, 0, 0));
  });

  it("antecipa para o próximo lembrete quando o vencimento é amanhã", () => {
    const planned = build({
      expenses: [makeExpense({ id: "e2", due_date: "2026-09-23" })],
    });

    const dueSoon = planned.find((item) => item.id.endsWith("due-soon:e2"));
    expect(dueSoon?.date).toEqual(new Date(2026, 8, 23, 9, 0, 0));
  });

  it("não agenda vencimento já expirado", () => {
    const planned = build({
      expenses: [makeExpense({ id: "e3", due_date: "2026-09-22" })],
    });

    expect(planned.some((item) => item.id.endsWith("due-soon:e3"))).toBe(false);
  });

  it("ignora despesas já pagas", () => {
    const planned = build({
      expenses: [makeExpense({ id: "e4", due_date: "2026-09-25", paid: true })],
    });

    expect(planned.some((item) => item.id.endsWith("due-soon:e4"))).toBe(false);
  });

  it("agenda um único resumo de pendências por dia-alvo", () => {
    const planned = build({
      expenses: [
        makeExpense({ id: "e5" }),
        makeExpense({ id: "e6", description: "Luz" }),
      ],
    });

    const pending = planned.filter(
      (item) => item.category === "pendingExpenses",
    );
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(`${NOTIFICATION_ID_PREFIX}pending:2026-09-23`);
    expect(pending[0].body).toContain("2 despesas");
    expect(pending[0].date).toEqual(new Date(2026, 8, 23, 9, 0, 0));
  });

  it("não agenda resumo quando não há pendências", () => {
    const planned = build({ expenses: [] });
    expect(planned.some((item) => item.category === "pendingExpenses")).toBe(
      false,
    );
  });

  it("agenda fechamento no último dia do mês quando ainda não fechado", () => {
    const planned = build();
    const closing = planned.find((item) => item.category === "closingReminder");

    expect(closing?.date).toEqual(new Date(2026, 8, 30, 9, 0, 0));
    expect(closing?.id).toBe(`${NOTIFICATION_ID_PREFIX}closing:2026-09`);
  });

  it("não agenda fechamento de mês já fechado", () => {
    const planned = build({ lastClosedMonth: "2026-09" });
    expect(planned.some((item) => item.category === "closingReminder")).toBe(
      false,
    );
  });

  it("agenda convite apenas para vínculo pendente", () => {
    const active = build({ coupleStatus: "active" });
    expect(active.some((item) => item.category === "inviteUpdates")).toBe(
      false,
    );

    const pending = build({ coupleStatus: "pending", coupleId: "c9" });
    const invite = pending.find((item) => item.category === "inviteUpdates");
    expect(invite?.id).toBe(`${NOTIFICATION_ID_PREFIX}invite:c9`);
  });

  it("agenda novidades apenas quando há atividade não vista", () => {
    const unseen = build({
      latestActivity: {
        latest_id: "a1",
        latest_created_at: "2026-09-22T08:00:00.000Z",
      },
      lastActivitySeenAt: null,
    });
    expect(unseen.some((item) => item.category === "sharedActivity")).toBe(
      true,
    );

    const seen = build({
      latestActivity: {
        latest_id: "a1",
        latest_created_at: "2026-09-22T08:00:00.000Z",
      },
      lastActivitySeenAt: "2026-09-22T09:00:00.000Z",
    });
    expect(seen.some((item) => item.category === "sharedActivity")).toBe(false);
  });

  it("respeita a desativação de cada categoria", () => {
    const planned = build({
      preferences: preferences({
        due_soon_enabled: false,
        pending_expenses_enabled: false,
        closing_reminder_enabled: false,
        invite_updates_enabled: false,
        shared_activity_enabled: false,
      }),
      coupleStatus: "pending",
      coupleId: "c1",
      expenses: [makeExpense({ id: "e7", due_date: "2026-09-25" })],
      latestActivity: {
        latest_id: "a1",
        latest_created_at: "2026-09-22T08:00:00.000Z",
      },
    });

    expect(planned).toEqual([]);
  });
});
