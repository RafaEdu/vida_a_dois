import { supabase } from "../lib/supabase";
import type {
  Couple,
  PartnerInfo,
  PartnerLookup,
  CloseMonthResult,
  IdealSplit,
} from "../types/database";

export async function fetchCouple(userId: string): Promise<Couple | null> {
  const { data } = await supabase
    .from("couples")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();
  return (data as Couple) ?? null;
}

export async function fetchPartner(
  couple: Couple,
  userId: string,
): Promise<PartnerInfo | null> {
  const partnerId = couple.user_a === userId ? couple.user_b : couple.user_a;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, monthly_income")
    .eq("id", partnerId)
    .single();
  return (data as PartnerInfo) ?? null;
}

export async function lookupPartner(
  inviteCode: string,
): Promise<{ error?: string; partner?: PartnerLookup }> {
  const { data, error } = await supabase.rpc("lookup_partner", {
    p_invite_code: inviteCode,
  });

  if (error) return { error: error.message };
  if (!data || (Array.isArray(data) && data.length === 0))
    return { error: "Código inválido. Verifique e tente novamente." };

  const partner = Array.isArray(data) ? data[0] : data;
  return { partner: partner as PartnerLookup };
}

export async function linkPartner(
  inviteCode: string,
): Promise<{ error?: string }> {
  const { data, error } = await supabase.rpc("link_partner", {
    p_invite_code: inviteCode,
  });

  if (error) return { error: error.message };
  const rpcError = (data as { error?: string } | null)?.error;
  if (rpcError) return { error: rpcError };
  return {};
}

export async function acceptInvitation(
  coupleId: string,
): Promise<{ error?: string }> {
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_couple_id: coupleId,
  });

  if (error) return { error: error.message };
  const rpcError = (data as { error?: string } | null)?.error;
  if (rpcError) return { error: rpcError };
  return {};
}

export async function rejectInvitation(
  coupleId: string,
): Promise<{ error?: string }> {
  const { data, error } = await supabase.rpc("reject_invitation", {
    p_couple_id: coupleId,
  });

  if (error) return { error: error.message };
  const rpcError = (data as { error?: string } | null)?.error;
  if (rpcError) return { error: rpcError };
  return {};
}

export async function closeMonth(
  coupleId: string,
): Promise<{ error?: string; result?: CloseMonthResult }> {
  const { data, error } = await supabase.rpc("close_month", {
    p_couple_id: coupleId,
  });

  if (error) return { error: error.message };
  const rpcError = (data as { error?: string } | null)?.error;
  if (rpcError) return { error: rpcError };
  return { result: data as CloseMonthResult };
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
  return { error: error?.message };
}

export async function fetchIdealSplit(
  coupleId: string,
): Promise<IdealSplit | null> {
  const { data: coupleData } = await supabase
    .from("couples")
    .select("user_a, user_b")
    .eq("id", coupleId)
    .single();

  if (!coupleData) return null;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, monthly_income")
    .in("id", [coupleData.user_a, coupleData.user_b]);

  if (!profiles || profiles.length < 2) return null;

  const incomeA = profiles.find((p) => p.id === coupleData.user_a)
    ?.monthly_income;
  const incomeB = profiles.find((p) => p.id === coupleData.user_b)
    ?.monthly_income;

  if (!incomeA || !incomeB || incomeA + incomeB === 0) return null;

  const ratioA = Math.round((incomeA / (incomeA + incomeB)) * 100 * 100) / 100;
  const ratioB = 100 - ratioA;

  return { ratio_a: ratioA, ratio_b: ratioB, calculated: true } as IdealSplit;
}
