import { supabase } from "../lib/supabase";
import type { MonthlyClosing } from "../types/domain";
import { fail, ok, toAppError } from "../utils/result";
import type { ServiceResult } from "../utils/result";

/**
 * Histórico de fechamentos do vínculo, do mês mais recente para o mais antigo.
 * A RLS de `monthly_closings` permite a leitura aos participantes do casal,
 * inclusive quando o vínculo já está `ended` (histórico somente leitura).
 */
export async function fetchMonthlyClosings(
  coupleId: string,
): Promise<ServiceResult<MonthlyClosing[]>> {
  const { data, error } = await supabase
    .from("monthly_closings")
    .select("*")
    .eq("couple_id", coupleId)
    .order("year_month", { ascending: false });

  if (error) {
    return fail(
      toAppError(
        error,
        "Não foi possível carregar o histórico de fechamentos.",
      ),
    );
  }
  return ok((data as MonthlyClosing[]) ?? []);
}

/**
 * Snapshot de um mês específico do vínculo. Usado pelo acerto do casal para
 * preferir os valores congelados no fechamento (split/totais) quando o mês já
 * está fechado. Retorna `null` quando o mês ainda não foi consolidado.
 */
export async function fetchMonthlyClosingByMonth(
  coupleId: string,
  yearMonth: string,
): Promise<ServiceResult<MonthlyClosing | null>> {
  const { data, error } = await supabase
    .from("monthly_closings")
    .select("*")
    .eq("couple_id", coupleId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar o fechamento do mês."),
    );
  }
  return ok((data as MonthlyClosing) ?? null);
}

export async function fetchMonthlyClosing(
  id: string,
): Promise<ServiceResult<MonthlyClosing | null>> {
  const { data, error } = await supabase
    .from("monthly_closings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return fail(toAppError(error, "Não foi possível carregar o fechamento."));
  }
  return ok((data as MonthlyClosing) ?? null);
}
