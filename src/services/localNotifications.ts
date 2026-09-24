import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import type * as ExpoNotifications from "expo-notifications";
import type { PlannedNotification } from "../domain/notifications/schedule";
import { NOTIFICATION_ID_PREFIX } from "../domain/notifications/schedule";

export const NOTIFICATION_CHANNEL_ID = "vida-a-dois-default";

type NotificationsModule = typeof ExpoNotifications;

/**
 * No Expo Go (`StoreClient`) o import de `expo-notifications` lança em
 * tempo de carregamento no Android desde o SDK 53. Carregamos o módulo sob
 * demanda e apenas fora do Expo Go, para que o app continue abrindo; as
 * notificações locais passam a valer em development/standalone builds.
 */
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let modulePromise: Promise<NotificationsModule | null> | null = null;

function loadNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGo) return Promise.resolve(null);
  if (!modulePromise) {
    modulePromise = import("expo-notifications").catch(() => null);
  }
  return modulePromise;
}

let handlerConfigured = false;

/**
 * Permite que notificações agendadas apareçam também com o app aberto. É
 * idempotente e nunca lança, para não derrubar o bootstrap.
 */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  void loadNotifications().then((Notifications) => {
    if (!Notifications) return;
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    } catch {
      // Ambiente sem suporte a notificações (ex.: web): segue sem handler.
    }
  });
}

function isAuthorized(
  Notifications: NotificationsModule,
  status: ExpoNotifications.NotificationPermissionsStatus,
): boolean {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/** Consulta a permissão atual sem abrir prompt. */
export async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  try {
    const status = await Notifications.getPermissionsAsync();
    return isAuthorized(Notifications, status);
  } catch {
    return false;
  }
}

/** Pede permissão ao usuário (chamado só a partir de ação explícita). */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  try {
    const status = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return isAuthorized(Notifications, status);
  } catch {
    return false;
  }
}

async function ensureChannel(
  Notifications: NotificationsModule,
): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: "Lembretes do casal",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function isManaged(identifier: string): boolean {
  return identifier.startsWith(NOTIFICATION_ID_PREFIX);
}

/**
 * Reconcilia os agendamentos locais com o conjunto desejado, garantindo que
 * não existam duplicatas: mantém o que já está agendado com o mesmo id,
 * cancela os gerenciados que saíram do conjunto e agenda apenas os novos.
 */
export async function syncScheduledNotifications(
  planned: PlannedNotification[],
): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  await ensureChannel(Notifications);

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const managed = scheduled.filter((request) => isManaged(request.identifier));
  const scheduledIds = new Set(managed.map((request) => request.identifier));
  const plannedIds = new Set(planned.map((item) => item.id));

  for (const request of managed) {
    if (!plannedIds.has(request.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }

  for (const item of planned) {
    if (scheduledIds.has(item.id)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: {
        title: item.title,
        body: item.body,
        data: { category: item.category },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.date,
        channelId:
          Platform.OS === "android" ? NOTIFICATION_CHANNEL_ID : undefined,
      },
    });
  }
}

/** Cancela todos os agendamentos deste app (usado no logout e ao desativar). */
export async function clearScheduledNotifications(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (isManaged(request.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
  }
}
