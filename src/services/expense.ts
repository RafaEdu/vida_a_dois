import { supabase } from "../lib/supabase";
import type { Expense, ExpenseInput } from "../types/database";

export async function fetchExpenses(coupleId: string): Promise<Expense[]> {
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  return (data as Expense[]) ?? [];
}

export async function createExpense(
  coupleId: string,
  userId: string,
  data: ExpenseInput,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("expenses").insert({
    ...data,
    couple_id: coupleId,
    created_by: userId,
    paid: data.paid ?? false,
    paid_by: data.paid_by || userId,
    is_recurring: data.is_recurring ?? false,
  });
  return { error: error?.message };
}

export async function updateExpense(
  id: string,
  data: Partial<ExpenseInput>,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("expenses").update(data).eq("id", id);
  if (error) return { error: error.message };

  if (data.paid) {
    const { data: updated } = await supabase
      .from("expenses")
      .select("is_recurring")
      .eq("id", id)
      .single();

    if (updated?.is_recurring) {
      const { data: original } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();

      if (original) {
        const nextDueDate = original.due_date
          ? new Date(original.due_date)
          : new Date();
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        await supabase.from("expenses").insert({
          couple_id: original.couple_id,
          created_by: original.created_by,
          description: original.description,
          amount: original.amount,
          category: original.category,
          due_date: nextDueDate.toISOString().slice(0, 10),
          paid: false,
          paid_at: null,
          paid_by: original.paid_by,
          is_recurring: true,
        });
      }
    }
  }

  return {};
}

export async function deleteExpense(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  return { error: error?.message };
}
