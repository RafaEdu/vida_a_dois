import { supabase } from "../lib/supabase";
import type { NotificationPreferences } from "../types/domain";
import type { NotificationPreferenceValues } from "../domain/notifications/preferences";
import { fail, ok, toAppError } from "../utils/result";
import type { ServiceResult } from "../utils/result";

/**
 * Preferências de notificação da própria pessoa. A RLS restringe a linha ao
 * `auth.uid()`; `user_id` é derivado pelo banco no insert (default
 * `auth.uid()`), então o cliente nunca o envia.
 */
export async function fetchNotificationPreferences(): Promise<
  ServiceResult<NotificationPreferences | null>
> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .maybeSingle();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar suas preferências."),
    );
  }
  return ok((data as NotificationPreferences | null) ?? null);
}

/**
 * Cria ou atualiza as preferências. O upsert usa `user_id` como chave de
 * conflito, mas como o banco preenche a coluna com `auth.uid()` quando
 * omitida, a identidade nunca vem do cliente.
 */
export async function saveNotificationPreferences(
  values: Partial<NotificationPreferenceValues>,
): Promise<ServiceResult<NotificationPreferences>> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(values, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível salvar suas preferências."),
    );
  }
  return ok(data as NotificationPreferences);
}

/**
 * Marca o feed como visto na data informada, permitindo que o app pare de
 * lembrar de novidades já lidas. Usa upsert pelo mesmo motivo acima.
 */
export async function markActivitySeen(
  seenAt: string,
): Promise<ServiceResult<NotificationPreferences>> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert({ last_activity_seen_at: seenAt }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível atualizar a atividade como lida."),
    );
  }
  return ok(data as NotificationPreferences);
}
