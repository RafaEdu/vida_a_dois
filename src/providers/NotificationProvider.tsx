import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuthSession } from "./AuthProvider";
import { useCouple } from "./CoupleProvider";
import { useFinance } from "./FinanceProvider";
import * as notificationPreferencesService from "../services/notificationPreferences";
import {
  clearScheduledNotifications,
  configureNotificationHandler,
  hasNotificationPermission,
  requestNotificationPermission,
  syncScheduledNotifications,
} from "../services/localNotifications";
import { buildScheduledNotifications } from "../domain/notifications/schedule";
import type { ActivitySignal } from "../domain/notifications/schedule";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  toNotificationPreferenceValues,
  type NotificationPreferenceValues,
} from "../domain/notifications/preferences";
import { getCurrentYearMonth } from "../utils/date";
import { toAppError } from "../utils/result";

const SYNC_DEBOUNCE_MS = 1200;

export interface NotificationContextValue {
  preferences: NotificationPreferenceValues;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  updatePreferences: (
    patch: Partial<NotificationPreferenceValues>,
  ) => Promise<{ error?: string }>;
  /** Pede permissão ao SO e ativa as notificações quando concedida. */
  enableNotifications: () => Promise<boolean>;
  /** Marca o feed como lido no horário atual. */
  markActivitySeen: () => Promise<void>;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const { couple, activity } = useCouple();
  const { expenses } = useFinance();

  const [preferences, setPreferences] = useState<NotificationPreferenceValues>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [lastActivitySeenAt, setLastActivitySeenAt] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const latestActivity = useMemo<ActivitySignal | null>(() => {
    const latest = activity[0];
    if (!latest) return null;
    return { latest_id: latest.id, latest_created_at: latest.created_at };
  }, [activity]);

  useEffect(() => {
    configureNotificationHandler();
    let active = true;
    hasNotificationPermission()
      .then((granted) => {
        if (active) setPermissionGranted(granted);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!user) {
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
      setLastActivitySeenAt(null);
      setLoading(false);
      setError(null);
      clearScheduledNotifications().catch(() => {});
      return;
    }

    setLoading(true);
    setError(null);

    notificationPreferencesService
      .fetchNotificationPreferences()
      .then((result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error.message);
          return;
        }
        setPreferences(toNotificationPreferenceValues(result.data));
        setLastActivitySeenAt(result.data?.last_activity_seen_at ?? null);
      })
      .catch((err) => {
        if (active) {
          setError(
            toAppError(err, "Erro ao carregar suas preferências.").message,
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, attempt]);

  const updatePreferences = useCallback(
    async (patch: Partial<NotificationPreferenceValues>) => {
      try {
        const result =
          await notificationPreferencesService.saveNotificationPreferences(
            patch,
          );
        if (result.error) return { error: result.error.message };

        setPreferences((prev) => ({ ...prev, ...patch }));
        if (result.data.last_activity_seen_at !== undefined) {
          setLastActivitySeenAt(result.data.last_activity_seen_at);
        }
        if (patch.notifications_enabled === false) {
          await clearScheduledNotifications().catch(() => {});
        }
        return {};
      } catch (err) {
        return {
          error: toAppError(err, "Erro ao salvar suas preferências.").message,
        };
      }
    },
    [],
  );

  const enableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (!granted) return false;

    const result = await notificationPreferencesService
      .saveNotificationPreferences({ notifications_enabled: true })
      .catch(() => null);

    if (result && !result.error) {
      setPreferences((prev) => ({ ...prev, notifications_enabled: true }));
    }
    return true;
  }, []);

  const markActivitySeen = useCallback(async () => {
    if (!latestActivity) return;
    if (
      lastActivitySeenAt &&
      new Date(lastActivitySeenAt).getTime() >=
        new Date(latestActivity.latest_created_at).getTime()
    ) {
      return;
    }

    const seenAt = new Date().toISOString();
    try {
      const result =
        await notificationPreferencesService.markActivitySeen(seenAt);
      if (!result.error) setLastActivitySeenAt(seenAt);
    } catch {
      // Marcar como lido é best-effort; não deve quebrar a tela.
    }
  }, [latestActivity, lastActivitySeenAt]);

  const refresh = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    if (!user || !permissionGranted) return;

    const timer = setTimeout(() => {
      const planned = buildScheduledNotifications({
        now: new Date(),
        preferences: preferencesRef.current,
        coupleStatus: couple?.status ?? null,
        coupleId: couple?.id ?? null,
        expenses,
        lastClosedMonth: couple?.last_closed_month ?? null,
        currentYearMonth: getCurrentYearMonth(),
        lastActivitySeenAt,
        latestActivity,
      });

      syncScheduledNotifications(planned).catch(() => {});
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [
    user,
    permissionGranted,
    couple?.status,
    couple?.id,
    couple?.last_closed_month,
    expenses,
    preferences,
    lastActivitySeenAt,
    latestActivity,
  ]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      preferences,
      loading,
      error,
      permissionGranted,
      updatePreferences,
      enableNotifications,
      markActivitySeen,
      refresh,
    }),
    [
      preferences,
      loading,
      error,
      permissionGranted,
      updatePreferences,
      enableNotifications,
      markActivitySeen,
      refresh,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return ctx;
}
