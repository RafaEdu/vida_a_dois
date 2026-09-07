import { supabase } from "../lib/supabase";
import type { Income, IncomeInput } from "../types/database";

export async function fetchIncomes(coupleId: string): Promise<Income[]> {
  const { data } = await supabase
    .from("incomes")
    .select("*")
    .eq("couple_id", coupleId)
    .order("received_at", { ascending: false });
  return (data as Income[]) ?? [];
}

export async function createIncome(
  coupleId: string,
  userId: string,
  data: IncomeInput,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("incomes").insert({
    couple_id: coupleId,
    user_id: userId,
    description: data.description,
    amount: data.amount,
    is_extra: data.is_extra ?? true,
    received_at: data.received_at || new Date().toISOString(),
  });
  return { error: error?.message };
}

export async function updateIncome(
  id: string,
  data: Partial<IncomeInput>,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("incomes").update(data).eq("id", id);
  return { error: error?.message };
}

export async function deleteIncome(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  return { error: error?.message };
}
