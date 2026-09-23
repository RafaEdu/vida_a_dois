import { supabase } from "../lib/supabase";
import type { Expense, ExpenseInput } from "../types/domain";
import {
  extractDomainError,
  fail,
  ok,
  rpcToAppError,
  toAppError,
} from "../utils/result";
import type { ServiceResult } from "../utils/result";

export async function fetchExpenses(
  coupleId: string,
): Promise<ServiceResult<Expense[]>> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });

  if (error) {
    return fail(toAppError(error, "Não foi possível carregar as despesas."));
  }
  return ok((data as Expense[]) ?? []);
}

export async function createExpense(
  coupleId: string,
  userId: string,
  data: ExpenseInput,
): Promise<ServiceResult<Expense>> {
  const paid = data.paid ?? false;
  const { data: created, error } = await supabase
    .from("expenses")
    .insert({
      ...data,
      couple_id: coupleId,
      created_by: userId,
      paid,
      paid_by: paid ? (data.paid_by ?? userId) : null,
      is_recurring: data.is_recurring ?? false,
    })
    .select()
    .single();

  if (error) {
    return fail(toAppError(error, "Não foi possível salvar a despesa."));
  }
  return ok(created as Expense);
}

export async function updateExpense(
  id: string,
  data: Partial<ExpenseInput>,
): Promise<ServiceResult<Expense>> {
  const { data: updated, error } = await supabase
    .from("expenses")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return fail(toAppError(error, "Não foi possível atualizar a despesa."));
  }
  return ok(updated as Expense);
}

export interface MarkExpensePaidResult {
  status: "paid" | "already_paid";
  expense: Expense;
  nextExpense: Expense | null;
}

interface MarkExpensePaidPayload {
  status?: string;
  expense?: Expense;
  next_expense?: Expense | null;
}

export async function markExpensePaid(
  id: string,
  payerId: string,
): Promise<{ error?: string; result?: MarkExpensePaidResult }> {
  const { data, error } = await supabase.rpc("mark_expense_paid", {
    p_expense_id: id,
    p_payer_id: payerId,
  });

  if (error || extractDomainError(data)) {
    return {
      error: rpcToAppError(
        data,
        error,
        "Não foi possível confirmar o pagamento.",
      ).message,
    };
  }

  const payload = (data ?? {}) as MarkExpensePaidPayload;
  if (!payload.expense) {
    return { error: "Resposta inválida ao confirmar o pagamento." };
  }

  return {
    result: {
      status: payload.status === "already_paid" ? "already_paid" : "paid",
      expense: payload.expense,
      nextExpense: payload.next_expense ?? null,
    },
  };
}

export async function deleteExpense(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  return { error: error?.message };
}
