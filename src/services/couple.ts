import { supabase } from "../lib/supabase";
import type {
  Couple,
  CoupleSplitMode,
  PartnerInfo,
  PartnerLookup,
  CloseMonthResult,
  IdealSplit,
} from "../types/domain";
import {
  extractDomainError,
  fail,
  ok,
  rpcToAppError,
  toAppError,
} from "../utils/result";
import type { ServiceResult } from "../utils/result";

/**
 * Vínculo aberto relevante do usuário (`pending` ou `active`). Históricos
 * `ended` não aparecem aqui e não interferem no bootstrap.
 */
export async function fetchCurrentCouple(
  userId: string,
): Promise<ServiceResult<Couple | null>> {
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar o vínculo do casal."),
    );
  }
  return ok((data as Couple) ?? null);
}

/**
 * Relacionamentos encerrados do usuário, do mais recente para o mais antigo.
 * Apenas leitura; a experiência de histórico é construída na Fase 13.
 */
export async function fetchRelationshipHistory(
  userId: string,
): Promise<ServiceResult<Couple[]>> {
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq("status", "ended")
    .order("ended_at", { ascending: false });

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar o histórico de vínculos."),
    );
  }
  return ok((data as Couple[]) ?? []);
}

/**
 * Vínculo por id, em qualquer estado. Usado pelo histórico de relacionamentos
 * (Fase 13) para abrir um vínculo encerrado específico como somente leitura. A
 * RLS garante que o usuário só lê vínculos dos quais participa.
 */
export async function fetchCoupleById(
  id: string,
): Promise<ServiceResult<Couple | null>> {
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return fail(toAppError(error, "Não foi possível carregar o vínculo."));
  }
  return ok((data as Couple | null) ?? null);
}

export async function fetchPartner(
  couple: Couple,
  userId: string,
): Promise<ServiceResult<PartnerInfo | null>> {
  const partnerId = couple.user_a === userId ? couple.user_b : couple.user_a;
  // Escopo pelo vínculo atual: desde a Fase 3 um mesmo par pode ter vínculos
  // `ended` e um novo `pending`/`active`; sem o filtro de `couple_id` a view
  // devolveria mais de uma linha para o mesmo parceiro e o maybeSingle falharia.
  const { data, error } = await supabase
    .from("partner_profiles")
    .select("id, full_name, monthly_income, avatar_path")
    .eq("couple_id", couple.id)
    .eq("id", partnerId)
    .maybeSingle();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar os dados do parceiro."),
    );
  }
  return ok(data);
}

export async function lookupPartner(
  inviteCode: string,
): Promise<{ error?: string; partner?: PartnerLookup }> {
  const { data, error } = await supabase.rpc("lookup_partner", {
    p_invite_code: inviteCode,
  });

  if (error) {
    return {
      error: toAppError(error, "Não foi possível buscar o parceiro.").message,
    };
  }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { error: "Código inválido. Verifique e tente novamente." };
  }

  const partner = Array.isArray(data) ? data[0] : data;
  return { partner };
}

export async function linkPartner(
  inviteCode: string,
): Promise<{ error?: string }> {
  const { data, error } = await supabase.rpc("link_partner", {
    p_invite_code: inviteCode,
  });

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(data, error, "Não foi possível vincular o parceiro.")
        .message,
    };
  }
  return {};
}

export async function acceptInvitation(
  coupleId: string,
): Promise<{ error?: string }> {
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_couple_id: coupleId,
  });

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(data, error, "Não foi possível aceitar o convite.")
        .message,
    };
  }
  return {};
}

export async function rejectInvitation(
  coupleId: string,
): Promise<{ error?: string }> {
  const { data, error } = await supabase.rpc("reject_invitation", {
    p_couple_id: coupleId,
  });

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(data, error, "Não foi possível recusar o convite.")
        .message,
    };
  }
  return {};
}

/**
 * Encerra o vínculo ativo do usuário autenticado. Não recebe `couple_id`: a
 * RPC deriva a identidade de `auth.uid()` e localiza o vínculo no servidor.
 * Idempotente — repetir a chamada após o encerramento não é tratado como erro.
 */
export async function endRelationship(): Promise<{ error?: string }> {
  const { data, error } = await supabase.rpc("end_relationship");

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(data, error, "Não foi possível encerrar o vínculo.")
        .message,
    };
  }

  const status = (data as { status?: string } | null)?.status;
  if (status !== "ended" && status !== "already_ended") {
    return { error: "Não foi possível encerrar o vínculo." };
  }

  return {};
}

export async function closeMonth(
  coupleId: string,
): Promise<{ error?: string; result?: CloseMonthResult }> {
  const { data, error } = await supabase.rpc("close_month", {
    p_couple_id: coupleId,
  });

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(data, error, "Não foi possível fechar o mês.")
        .message,
    };
  }
  return { result: data as unknown as CloseMonthResult };
}

export interface CostPlanInput {
  monthly_budget?: number;
  split_mode?: CoupleSplitMode;
  split_ratio_a?: number;
  split_ratio_b?: number;
}

export async function updateCostPlan(
  coupleId: string,
  data: CostPlanInput,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("couples")
    .update(data)
    .eq("id", coupleId);

  if (error) {
    return {
      error: toAppError(error, "Não foi possível atualizar o plano de custos.")
        .message,
    };
  }
  return {};
}

export async function fetchIdealSplit(
  coupleId: string,
): Promise<ServiceResult<IdealSplit | null>> {
  const { data: coupleData, error: coupleError } = await supabase
    .from("couples")
    .select("user_a, user_b")
    .eq("id", coupleId)
    .maybeSingle();

  if (coupleError) {
    return fail(
      toAppError(coupleError, "Não foi possível carregar o plano de custos."),
    );
  }
  if (!coupleData) return ok(null);

  const { data: partner, error: partnerError } = await supabase
    .from("partner_profiles")
    .select("id, monthly_income")
    .eq("couple_id", coupleId)
    .maybeSingle();

  if (partnerError) {
    return fail(
      toAppError(partnerError, "Não foi possível carregar as rendas do casal."),
    );
  }
  if (!partner) return ok(null);

  const selfId =
    partner.id === coupleData.user_a ? coupleData.user_b : coupleData.user_a;

  const { data: self, error: selfError } = await supabase
    .from("profiles")
    .select("id, monthly_income")
    .eq("id", selfId)
    .maybeSingle();

  if (selfError) {
    return fail(
      toAppError(selfError, "Não foi possível carregar as rendas do casal."),
    );
  }
  if (!self) return ok(null);

  const incomeSelf = self.monthly_income;
  const incomePartner = partner.monthly_income;

  if (!incomeSelf || !incomePartner || incomeSelf + incomePartner === 0) {
    return ok(null);
  }

  const ratioSelf =
    Math.round((incomeSelf / (incomeSelf + incomePartner)) * 100 * 100) / 100;
  const selfIsA = selfId === coupleData.user_a;
  const ratioA = selfIsA ? ratioSelf : 100 - ratioSelf;
  const ratioB = 100 - ratioA;

  return ok({
    ratio_a: ratioA,
    ratio_b: ratioB,
    calculated: true,
  });
}
