import * as activityService from "./activity";
import * as closingService from "./monthlyClosing";
import * as coupleService from "./couple";
import * as expenseService from "./expense";
import * as goalService from "./goal";
import * as incomeService from "./income";
import type { Couple } from "../types/domain";
import type { ExportDataset, ExportMember } from "../domain/export/builders";
import { fail, ok } from "../utils/result";
import type { AppError, ServiceResult } from "../utils/result";

/** Limite de eventos de atividade incluídos na exportação/consulta. */
export const EXPORT_ACTIVITY_LIMIT = 200;

/**
 * Monta o conjunto de dados exportável de um vínculo. Todas as leituras
 * passam pela RLS: só é possível montar o dataset de um casal do qual o
 * usuário autenticado participa (ativo ou encerrado). Nenhum identificador de
 * sessão é lido; apenas dados do relacionamento.
 */
export async function fetchExportDataset(
  couple: Couple,
  self: { id: string; full_name: string | null },
): Promise<ServiceResult<ExportDataset>> {
  const [expenses, incomes, closings, goalsOverview, activity, partner] =
    await Promise.all([
      expenseService.fetchExpenses(couple.id),
      incomeService.fetchIncomes(couple.id),
      closingService.fetchMonthlyClosings(couple.id),
      goalService.fetchGoalsOverview(couple.id),
      activityService.fetchCoupleActivity(couple.id, EXPORT_ACTIVITY_LIMIT),
      coupleService.fetchPartner(couple, self.id),
    ]);

  const error: AppError | null =
    expenses.error ??
    incomes.error ??
    closings.error ??
    goalsOverview.error ??
    activity.error ??
    partner.error;
  if (error) return fail(error);

  const partnerId = self.id === couple.user_a ? couple.user_b : couple.user_a;
  const members: ExportMember[] = [
    { id: self.id, full_name: self.full_name },
    {
      id: partner.data?.id ?? partnerId,
      full_name: partner.data?.full_name ?? null,
    },
  ];

  return ok({
    couple,
    selfId: self.id,
    members,
    expenses: expenses.data ?? [],
    incomes: incomes.data ?? [],
    closings: closings.data ?? [],
    goals: goalsOverview.data?.goals ?? [],
    contributions: goalsOverview.data?.contributions ?? [],
    activity: activity.data ?? [],
  });
}
