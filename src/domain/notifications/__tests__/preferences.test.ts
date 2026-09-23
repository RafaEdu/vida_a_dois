import { describe, expect, it } from "@jest/globals";
import type { NotificationPreferences } from "../../../types/domain";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_REMINDER_TIME,
  normalizeReminderTime,
  toNotificationPreferenceValues,
} from "../preferences";

function makeRow(
  overrides: Partial<NotificationPreferences> = {},
): NotificationPreferences {
  return {
    user_id: "u1",
    notifications_enabled: true,
    due_soon_enabled: true,
    pending_expenses_enabled: true,
    closing_reminder_enabled: true,
    invite_updates_enabled: true,
    shared_activity_enabled: true,
    reminder_time: "09:00:00",
    last_activity_seen_at: null,
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("normalizeReminderTime", () => {
  it("converte HH:MM:SS em HH:MM", () => {
    expect(normalizeReminderTime("18:30:00")).toBe("18:30");
  });

  it("usa o padrão para valores ausentes ou inválidos", () => {
    expect(normalizeReminderTime(null)).toBe(DEFAULT_REMINDER_TIME);
    expect(normalizeReminderTime("")).toBe(DEFAULT_REMINDER_TIME);
    expect(normalizeReminderTime("25:00:00")).toBe(DEFAULT_REMINDER_TIME);
    expect(normalizeReminderTime("abc")).toBe(DEFAULT_REMINDER_TIME);
  });
});

describe("toNotificationPreferenceValues", () => {
  it("usa os padrões quando não há linha", () => {
    expect(toNotificationPreferenceValues(null)).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
  });

  it("mapeia a linha do banco, normalizando o horário", () => {
    expect(
      toNotificationPreferenceValues(
        makeRow({ reminder_time: "20:00:00", due_soon_enabled: false }),
      ),
    ).toEqual({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      due_soon_enabled: false,
      reminder_time: "20:00",
    });
  });
});
