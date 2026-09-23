import { supabase } from "../lib/supabase";
import type { RecurrenceSeries, RecurrenceSeriesInput } from "../types/domain";
import {
  extractDomainError,
  fail,
  ok,
  rpcToAppError,
  toAppError,
} from "../utils/result";
import type { ServiceResult } from "../utils/result";

/**
 * Séries de despesas recorrentes do vínculo. A RLS permite leitura aos
 * participantes (inclusive histórico `ended`); a escrita é feita apenas pelas
 * RPCs `security definer` abaixo.
 */
export async function fetchRecurrenceSeries(
  coupleId: string,
): Promise<ServiceResult<RecurrenceSeries[]>> {
  const { data, error } = await supabase
    .from("expense_recurrence_series")
    .select("*")
    .eq("couple_id", coupleId)
    .order("active", { ascending: false })
    .order("next_due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar as recorrências."),
    );
  }
  return ok((data as RecurrenceSeries[]) ?? []);
}

interface SeriesRpcPayload {
  status?: string;
  series?: RecurrenceSeries;
  updated_occurrences?: number;
  cancelled_occurrences?: number;
}

export async function updateRecurrenceSeries(
  seriesId: string,
  input: RecurrenceSeriesInput,
): Promise<{ error?: string; series?: RecurrenceSeries }> {
  const { data, error } = await supabase.rpc("update_recurrence_series", {
    p_series_id: seriesId,
    p_description: input.description,
    p_category: input.category,
    p_amount: input.amount,
  });

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(
        data,
        error,
        "Não foi possível salvar a recorrência.",
      ).message,
    };
  }

  const payload = (data ?? {}) as SeriesRpcPayload;
  if (!payload.series) {
    return { error: "Resposta inválida ao salvar a recorrência." };
  }
  return { series: payload.series };
}

export async function setRecurrenceSeriesActive(
  seriesId: string,
  active: boolean,
): Promise<{ error?: string; series?: RecurrenceSeries }> {
  const { data, error } = await supabase.rpc("set_recurrence_series_active", {
    p_series_id: seriesId,
    p_active: active,
  });

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(
        data,
        error,
        "Não foi possível atualizar a recorrência.",
      ).message,
    };
  }

  const payload = (data ?? {}) as SeriesRpcPayload;
  if (!payload.series) {
    return { error: "Resposta inválida ao atualizar a recorrência." };
  }
  return { series: payload.series };
}

export async function endRecurrenceSeries(
  seriesId: string,
): Promise<{ error?: string; cancelledOccurrences?: number }> {
  const { data, error } = await supabase.rpc("end_recurrence_series", {
    p_series_id: seriesId,
  });

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(
        data,
        error,
        "Não foi possível encerrar a recorrência.",
      ).message,
    };
  }

  const payload = (data ?? {}) as SeriesRpcPayload;
  return { cancelledOccurrences: payload.cancelled_occurrences ?? 0 };
}
