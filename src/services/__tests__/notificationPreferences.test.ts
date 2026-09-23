import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { supabase } from "../../lib/supabase";
import type { NotificationPreferences } from "../../types/domain";
import {
  fetchNotificationPreferences,
  markActivitySeen,
  saveNotificationPreferences,
} from "../notificationPreferences";

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

interface QueryResult {
  data: unknown;
  error: unknown;
}

interface MockRecord {
  table: string;
  select?: string;
  upsert?: { values: unknown; options: unknown };
  isMaybeSingle: boolean;
}

const fromMock = supabase.from as unknown as {
  mockReset: () => void;
  mockImplementation: (fn: (table: string) => unknown) => void;
};

let queryResult: QueryResult;
let chainCalls: MockRecord[];

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

beforeEach(() => {
  queryResult = { data: null, error: null };
  chainCalls = [];
  fromMock.mockReset();

  fromMock.mockImplementation((table: string) => {
    const record: MockRecord = { table, isMaybeSingle: false };
    const resolve = (): Promise<QueryResult> => Promise.resolve(queryResult);

    const api = {
      select(columns?: string) {
        record.select = columns ?? "*";
        return api;
      },
      upsert(values: unknown, options: unknown) {
        record.upsert = { values, options };
        return api;
      },
      maybeSingle() {
        record.isMaybeSingle = true;
        chainCalls.push(record);
        return resolve();
      },
      single() {
        chainCalls.push(record);
        return resolve();
      },
      then(
        onFulfilled: (value: QueryResult) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        chainCalls.push(record);
        return resolve().then(onFulfilled, onRejected);
      },
    };

    return api;
  });
});

describe("fetchNotificationPreferences", () => {
  it("lê a própria linha sem filtrar por user_id", async () => {
    const row = makeRow();
    queryResult = { data: row, error: null };

    const result = await fetchNotificationPreferences();

    expect(result.error).toBeNull();
    expect(result.data).toEqual(row);

    const record = chainCalls[0];
    expect(record.table).toBe("notification_preferences");
    expect(record.select).toBe("*");
    expect(record.isMaybeSingle).toBe(true);
  });

  it("retorna null quando não há linha", async () => {
    queryResult = { data: null, error: null };

    const result = await fetchNotificationPreferences();

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it("propaga erro de leitura", async () => {
    queryResult = { data: null, error: { message: "denied" } };

    const result = await fetchNotificationPreferences();

    expect(result.error?.message).toBe("denied");
  });
});

describe("saveNotificationPreferences", () => {
  it("faz upsert por user_id sem enviar user_id (derivado no banco)", async () => {
    const row = makeRow({ notifications_enabled: false });
    queryResult = { data: row, error: null };

    const result = await saveNotificationPreferences({
      notifications_enabled: false,
    });

    expect(result.data).toEqual(row);

    const record = chainCalls[0];
    expect(record.table).toBe("notification_preferences");
    expect(record.upsert).toEqual({
      values: { notifications_enabled: false },
      options: { onConflict: "user_id" },
    });
  });

  it("propaga erro de escrita", async () => {
    queryResult = { data: null, error: { message: "policy" } };

    const result = await saveNotificationPreferences({
      due_soon_enabled: false,
    });

    expect(result.error?.message).toBe("policy");
  });
});

describe("markActivitySeen", () => {
  it("atualiza apenas last_activity_seen_at via upsert", async () => {
    const seenAt = "2026-09-22T12:00:00.000Z";
    queryResult = {
      data: makeRow({ last_activity_seen_at: seenAt }),
      error: null,
    };

    await markActivitySeen(seenAt);

    expect(chainCalls[0].upsert).toEqual({
      values: { last_activity_seen_at: seenAt },
      options: { onConflict: "user_id" },
    });
  });
});
