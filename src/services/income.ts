import { supabase } from "../lib/supabase";
import type { Income, IncomeInput } from "../types/domain";
import { fail, ok, toAppError } from "../utils/result";
import type { ServiceResult } from "../utils/result";

export async function fetchIncomes(
  coupleId: string,
): Promise<ServiceResult<Income[]>> {
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("couple_id", coupleId)
    .order("received_at", { ascending: false });

  if (error) {
    return fail(toAppError(error, "Não foi possível carregar as receitas."));
  }
  return ok(data ?? []);
}

export async function createIncome(
  coupleId: string,
  userId: string,
  data: IncomeInput,
): Promise<ServiceResult<Income>> {
  const { data: created, error } = await supabase
    .from("incomes")
    .insert({
      couple_id: coupleId,
      user_id: userId,
      description: data.description,
      amount: data.amount,
      is_extra: data.is_extra ?? true,
      received_at: data.received_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return fail(toAppError(error, "Não foi possível salvar a receita."));
  }
  return ok(created);
}

export async function updateIncome(
  id: string,
  data: Partial<IncomeInput>,
): Promise<ServiceResult<Income>> {
  const { data: updated, error } = await supabase
    .from("incomes")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return fail(toAppError(error, "Não foi possível atualizar a receita."));
  }
  return ok(updated);
}

export async function deleteIncome(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  return { error: error?.message };
}
