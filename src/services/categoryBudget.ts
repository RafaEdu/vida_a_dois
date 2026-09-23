import { supabase } from "../lib/supabase";
import type { CategoryBudget, CategoryBudgetInput } from "../types/domain";
import { fail, ok, toAppError } from "../utils/result";
import type { ServiceResult } from "../utils/result";

/**
 * Limites mensais por categoria do vínculo. A RLS permite leitura a membros de
 * vínculos `active`/`ended` e escrita apenas a membro de vínculo `active`,
 * então o CRUD acontece direto na tabela (sem RPC).
 */
export async function fetchCategoryBudgets(
  coupleId: string,
): Promise<ServiceResult<CategoryBudget[]>> {
  const { data, error } = await supabase
    .from("category_budgets")
    .select("*")
    .eq("couple_id", coupleId)
    .order("category", { ascending: true });

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar o orçamento por categoria."),
    );
  }
  return ok((data as CategoryBudget[]) ?? []);
}

/**
 * Cria ou atualiza o limite de uma categoria. A unicidade `(couple_id,
 * category)` é garantida no banco; o upsert respeita as policies de INSERT/
 * UPDATE da RLS.
 */
export async function saveCategoryBudget(
  coupleId: string,
  input: CategoryBudgetInput,
): Promise<ServiceResult<CategoryBudget>> {
  const { data, error } = await supabase
    .from("category_budgets")
    .upsert(
      {
        couple_id: coupleId,
        category: input.category,
        monthly_amount: input.monthly_amount,
      },
      { onConflict: "couple_id,category" },
    )
    .select()
    .single();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível salvar o orçamento da categoria."),
    );
  }
  return ok(data as CategoryBudget);
}

export async function deleteCategoryBudget(
  id: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("category_budgets")
    .delete()
    .eq("id", id);
  return { error: error?.message };
}
