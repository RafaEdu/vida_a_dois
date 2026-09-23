import { supabase } from "../lib/supabase";
import type { CoupleActivity } from "../types/domain";
import { fail, ok, toAppError } from "../utils/result";
import type { ServiceResult } from "../utils/result";

/** Tamanho padrão do feed: suficiente para contexto, sem carregar tudo. */
export const ACTIVITY_PAGE_SIZE = 50;

/**
 * Feed de atividade do vínculo, do evento mais recente para o mais antigo.
 * A RLS restringe a leitura aos participantes; vínculos `ended` continuam
 * lendo (somente leitura) e `pending` não tem acesso.
 */
export async function fetchCoupleActivity(
  coupleId: string,
  limit = ACTIVITY_PAGE_SIZE,
): Promise<ServiceResult<CoupleActivity[]>> {
  const { data, error } = await supabase
    .from("couple_activity")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar a atividade do casal."),
    );
  }
  return ok((data as CoupleActivity[]) ?? []);
}
