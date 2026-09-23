import { supabase } from "../lib/supabase";
import type {
  FinancialGoal,
  FinancialGoalInput,
  GoalContribution,
  GoalContributionInput,
  GoalStatus,
} from "../types/domain";
import { fail, ok, toAppError } from "../utils/result";
import type { ServiceResult } from "../utils/result";

/**
 * Metas financeiras compartilhadas do vínculo. A RLS permite leitura aos
 * participantes (inclusive histórico `ended`) e escrita apenas a membro de
 * vínculo `active`. `created_by`/`user_id` são derivados de `auth.uid()` pelo
 * banco; o cliente nunca envia esses campos.
 */
export async function fetchFinancialGoals(
  coupleId: string,
): Promise<ServiceResult<FinancialGoal[]>> {
  const { data, error } = await supabase
    .from("financial_goals")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar as metas do casal."),
    );
  }
  return ok((data as FinancialGoal[]) ?? []);
}

/**
 * Contribuições de uma meta em ordem cronológica (histórico). A RLS limita a
 * leitura aos membros do casal da meta.
 */
export async function fetchGoalContributions(
  goalId: string,
): Promise<ServiceResult<GoalContribution[]>> {
  const { data, error } = await supabase
    .from("goal_contributions")
    .select("*")
    .eq("goal_id", goalId)
    .order("contributed_at", { ascending: true });

  if (error) {
    return fail(
      toAppError(error, "Não foi possível carregar as contribuições da meta."),
    );
  }
  return ok((data as GoalContribution[]) ?? []);
}

export interface GoalsOverview {
  goals: FinancialGoal[];
  contributions: GoalContribution[];
}

/**
 * Metas e contribuições do vínculo em uma única leitura, para o provider
 * calcular o progresso sem fazer uma consulta por meta.
 */
export async function fetchGoalsOverview(
  coupleId: string,
): Promise<ServiceResult<GoalsOverview>> {
  const goalsResult = await fetchFinancialGoals(coupleId);
  if (goalsResult.error) {
    return fail(goalsResult.error);
  }

  const goals = goalsResult.data;
  if (goals.length === 0) {
    return ok({ goals, contributions: [] });
  }

  const goalIds = goals.map((goal) => goal.id);
  const { data, error } = await supabase
    .from("goal_contributions")
    .select("*")
    .in("goal_id", goalIds)
    .order("contributed_at", { ascending: true });

  if (error) {
    return fail(
      toAppError(
        error,
        "Não foi possível carregar as contribuições das metas.",
      ),
    );
  }

  return ok({ goals, contributions: (data as GoalContribution[]) ?? [] });
}

export async function createFinancialGoal(
  coupleId: string,
  input: FinancialGoalInput,
): Promise<ServiceResult<FinancialGoal>> {
  const { data, error } = await supabase
    .from("financial_goals")
    .insert({
      couple_id: coupleId,
      title: input.title,
      target_amount: input.target_amount,
      target_date: input.target_date,
    })
    .select()
    .single();

  if (error) {
    return fail(toAppError(error, "Não foi possível criar a meta."));
  }
  return ok(data as FinancialGoal);
}

export async function updateFinancialGoal(
  id: string,
  input: FinancialGoalInput,
): Promise<ServiceResult<FinancialGoal>> {
  const { data, error } = await supabase
    .from("financial_goals")
    .update({
      title: input.title,
      target_amount: input.target_amount,
      target_date: input.target_date,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return fail(toAppError(error, "Não foi possível salvar a meta."));
  }
  return ok(data as FinancialGoal);
}

export async function setFinancialGoalStatus(
  id: string,
  status: GoalStatus,
): Promise<ServiceResult<FinancialGoal>> {
  const { data, error } = await supabase
    .from("financial_goals")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível atualizar o estado da meta."),
    );
  }
  return ok(data as FinancialGoal);
}

export async function createGoalContribution(
  goalId: string,
  input: GoalContributionInput,
): Promise<ServiceResult<GoalContribution>> {
  const payload: {
    goal_id: string;
    amount: number;
    note: string | null;
    contributed_at?: string;
  } = {
    goal_id: goalId,
    amount: input.amount,
    note: input.note?.trim() ? input.note.trim() : null,
  };

  if (input.contributed_at) {
    payload.contributed_at = input.contributed_at;
  }

  const { data, error } = await supabase
    .from("goal_contributions")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return fail(
      toAppError(error, "Não foi possível registrar a contribuição."),
    );
  }
  return ok(data as GoalContribution);
}
