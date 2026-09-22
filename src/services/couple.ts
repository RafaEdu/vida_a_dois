import { supabase } from "../lib/supabase";
import type {
  Couple,
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

export async function fetchCouple(
  userId: string,
): Promise<ServiceResult<Couple | null>> {
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar o vínculo do casal."),
    );
  }
  return ok((data as Couple) ?? null);
}

export async function fetchPartner(
  couple: Couple,
  userId: string,
): Promise<ServiceResult<PartnerInfo | null>> {
  const partnerId = couple.user_a === userId ? couple.user_b : couple.user_a;
  const { data, error } = await supabase
    .from("partner_profiles")
    .select("id, full_name, monthly_income")
    .eq("id", partnerId)
    .maybeSingle();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar os dados do parceiro."),
    );
  }
  return ok((data as PartnerInfo) ?? null);
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
  return { partner: partner as PartnerLookup };
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
  } as IdealSplit);
}
