import { supabase } from "../lib/supabase";
import type { PartnerInfo } from "../types/domain";
import { fail, ok, toAppError } from "../utils/result";
import type { ServiceResult } from "../utils/result";

/**
 * Perfis dos parceiros de vários vínculos em uma única leitura, indexados pelo
 * `couple_id`. A view `partner_profiles` só devolve o parceiro de vínculos dos
 * quais `auth.uid()` participa (qualquer estado), então a leitura é limitada
 * ao escopo do usuário autenticado. Usado pelo histórico de relacionamentos
 * (Fase 13) para evitar uma consulta por vínculo.
 */
export async function fetchPartnersByCoupleIds(
  coupleIds: string[],
): Promise<ServiceResult<Record<string, PartnerInfo>>> {
  if (coupleIds.length === 0) return ok({});

  const { data, error } = await supabase
    .from("partner_profiles")
    .select("couple_id, id, full_name, monthly_income, avatar_path")
    .in("couple_id", coupleIds);

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar os parceiros do histórico."),
    );
  }

  const byCouple: Record<string, PartnerInfo> = {};
  for (const row of data ?? []) {
    byCouple[row.couple_id] = {
      id: row.id,
      full_name: row.full_name,
      monthly_income: row.monthly_income,
      avatar_path: row.avatar_path,
    };
  }

  return ok(byCouple);
}
