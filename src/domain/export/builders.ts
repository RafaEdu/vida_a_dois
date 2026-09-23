import type {
  Couple,
  CoupleActivity,
  Expense,
  FinancialGoal,
  GoalContribution,
  Income,
  MonthlyClosing,
} from "../../types/domain";
import { formatYearMonthLong } from "../../utils/date";
import {
  formatCsvBoolean,
  formatCsvDateOnly,
  formatCsvNumber,
  formatCsvTimestamp,
  toCsv,
} from "./csv";
import {
  buildMonthlySummaries,
  type ExportMonthlySummary,
} from "./monthlySummary";

export interface ExportMember {
  id: string;
  full_name: string | null;
}

export interface ExportDataset {
  couple: Couple;
  /** Id do usuário autenticado que está exportando. */
  selfId: string;
  members: ExportMember[];
  expenses: Expense[];
  incomes: Income[];
  closings: MonthlyClosing[];
  goals: FinancialGoal[];
  contributions: GoalContribution[];
  activity: CoupleActivity[];
}

export interface ExportFile {
  filename: string;
  mimeType: string;
  content: string;
}

export interface ExportBuildOptions {
  generatedAt?: Date;
}

const MIME_CSV = "text/csv";
const MIME_JSON = "application/json";

function resolveMemberName(
  members: ExportMember[],
  id: string | null | undefined,
): string {
  if (!id) return "";
  const member = members.find((candidate) => candidate.id === id);
  return member?.full_name?.trim() || "Não identificado";
}

function expenseDateSortKey(expense: Expense): string {
  return expense.due_date ?? expense.created_at;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Sufixo de nome de arquivo `AAAAMMDD-HHmm` em horário local. */
export function formatFilenameTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function buildExportFilename(
  prefix: string,
  extension: string,
  generatedAt: Date = new Date(),
): string {
  return `vida-a-dois-${slugify(prefix)}-${formatFilenameTimestamp(
    generatedAt,
  )}.${extension}`;
}

function buildExpenseRows(dataset: ExportDataset): string[][] {
  const { expenses, members } = dataset;
  return [...expenses]
    .sort((a, b) => expenseDateSortKey(a).localeCompare(expenseDateSortKey(b)))
    .map((expense) => [
      expense.due_date
        ? formatCsvDateOnly(expense.due_date)
        : formatCsvTimestamp(expense.created_at),
      expense.description,
      expense.category,
      formatCsvNumber(expense.amount),
      expense.paid ? "Pago" : "Pendente",
      formatCsvTimestamp(expense.paid_at),
      resolveMemberName(members, expense.paid_by),
      formatCsvBoolean(expense.is_recurring),
    ]);
}

export function buildExpensesCsv(
  dataset: ExportDataset,
  options: ExportBuildOptions = {},
): ExportFile {
  const content = toCsv(
    [
      "Data",
      "Descrição",
      "Categoria",
      "Valor",
      "Status",
      "Pago em",
      "Pago por",
      "Recorrente",
    ],
    buildExpenseRows(dataset),
  );
  return {
    filename: buildExportFilename("despesas", "csv", options.generatedAt),
    mimeType: MIME_CSV,
    content,
  };
}

function buildIncomeRows(dataset: ExportDataset): string[][] {
  const { incomes, members } = dataset;
  return [...incomes]
    .sort((a, b) => a.received_at.localeCompare(b.received_at))
    .map((income) => [
      formatCsvTimestamp(income.received_at),
      income.description,
      formatCsvNumber(income.amount),
      formatCsvBoolean(income.is_extra),
      resolveMemberName(members, income.user_id),
    ]);
}

export function buildIncomesCsv(
  dataset: ExportDataset,
  options: ExportBuildOptions = {},
): ExportFile {
  const content = toCsv(
    ["Data", "Descrição", "Valor", "Extra", "Recebido por"],
    buildIncomeRows(dataset),
  );
  return {
    filename: buildExportFilename("receitas", "csv", options.generatedAt),
    mimeType: MIME_CSV,
    content,
  };
}

function buildClosingRows(dataset: ExportDataset): string[][] {
  const { closings, members } = dataset;
  return [...closings]
    .sort((a, b) => b.year_month.localeCompare(a.year_month))
    .map((closing) => [
      formatYearMonthLong(closing.year_month),
      formatCsvNumber(closing.total_incomes),
      formatCsvNumber(closing.total_expenses),
      formatCsvNumber(closing.monthly_budget),
      formatCsvNumber(closing.month_delta),
      formatCsvNumber(closing.shared_balance_before),
      formatCsvNumber(closing.shared_balance_after),
      resolveMemberName(members, closing.closed_by),
      formatCsvTimestamp(closing.closed_at),
      formatCsvNumber(closing.split_ratio_a),
      formatCsvNumber(closing.split_ratio_b),
    ]);
}

export function buildClosingsCsv(
  dataset: ExportDataset,
  options: ExportBuildOptions = {},
): ExportFile {
  const content = toCsv(
    [
      "Mês",
      "Receitas",
      "Despesas",
      "Orçamento",
      "Saldo do mês",
      "Caixa antes",
      "Caixa depois",
      "Fechado por",
      "Fechado em",
      "Divisão A (%)",
      "Divisão B (%)",
    ],
    buildClosingRows(dataset),
  );
  return {
    filename: buildExportFilename("fechamentos", "csv", options.generatedAt),
    mimeType: MIME_CSV,
    content,
  };
}

function buildMonthlySummaryRows(
  summaries: ExportMonthlySummary[],
): string[][] {
  return summaries.map((summary) => [
    formatYearMonthLong(summary.yearMonth),
    formatCsvNumber(summary.totalIncomes),
    formatCsvNumber(summary.totalExpenses),
    formatCsvNumber(summary.balance),
    summary.closed ? "Sim" : "Não",
    summary.sharedBalanceAfter == null
      ? ""
      : formatCsvNumber(summary.sharedBalanceAfter),
  ]);
}

export function buildMonthlySummaryCsv(
  dataset: ExportDataset,
  options: ExportBuildOptions = {},
): ExportFile {
  const summaries = buildMonthlySummaries(
    dataset.expenses,
    dataset.incomes,
    dataset.closings,
  );
  const content = toCsv(
    [
      "Mês",
      "Receitas",
      "Despesas",
      "Saldo do mês",
      "Fechado",
      "Caixa após fechamento",
    ],
    buildMonthlySummaryRows(summaries),
  );
  return {
    filename: buildExportFilename("resumo-mensal", "csv", options.generatedAt),
    mimeType: MIME_CSV,
    content,
  };
}

interface JsonBackup {
  aplicativo: string;
  formato: string;
  gerado_em: string;
  relacionamento: {
    status: string;
    inicio: string | null;
    fim: string | null;
    parceiro: string;
    modo_divisao: string;
    divisao_a: number;
    divisao_b: number;
  };
  despesas: unknown[];
  receitas: unknown[];
  fechamentos: unknown[];
  resumo_mensal: unknown[];
  metas: unknown[];
  contribuicoes: unknown[];
}

/**
 * Backup JSON estruturado. Não inclui tokens, ids internos de sessão nem
 * chaves estrangeiras sem valor para o usuário; nomes são resolvidos a partir
 * dos membros acessíveis.
 */
export function buildJsonBackup(
  dataset: ExportDataset,
  options: ExportBuildOptions = {},
): ExportFile {
  const generatedAt = options.generatedAt ?? new Date();
  const { couple, members, selfId } = dataset;
  const partnerId = selfId === couple.user_a ? couple.user_b : couple.user_a;
  const partnerName = resolveMemberName(members, partnerId) || "Parceiro";

  const goalTitleById = new Map(
    dataset.goals.map((goal) => [goal.id, goal.title]),
  );

  const backup: JsonBackup = {
    aplicativo: "Vida a Dois",
    formato: "vida-a-dois.backup.v1",
    gerado_em: generatedAt.toISOString(),
    relacionamento: {
      status: couple.status,
      inicio: couple.linked_at ?? couple.created_at,
      fim: couple.ended_at,
      parceiro: partnerName,
      modo_divisao: couple.split_mode,
      divisao_a: couple.split_ratio_a,
      divisao_b: couple.split_ratio_b,
    },
    despesas: [...dataset.expenses]
      .sort((a, b) =>
        expenseDateSortKey(a).localeCompare(expenseDateSortKey(b)),
      )
      .map((expense) => ({
        data: expense.due_date ?? expense.created_at,
        descricao: expense.description,
        categoria: expense.category,
        valor: expense.amount,
        status: expense.paid ? "pago" : "pendente",
        pago_em: expense.paid_at,
        pago_por: resolveMemberName(members, expense.paid_by) || null,
        recorrente: expense.is_recurring,
      })),
    receitas: [...dataset.incomes]
      .sort((a, b) => a.received_at.localeCompare(b.received_at))
      .map((income) => ({
        data: income.received_at,
        descricao: income.description,
        valor: income.amount,
        extra: income.is_extra,
        recebido_por: resolveMemberName(members, income.user_id) || null,
      })),
    fechamentos: [...dataset.closings]
      .sort((a, b) => b.year_month.localeCompare(a.year_month))
      .map((closing) => ({
        mes: closing.year_month,
        receitas: closing.total_incomes,
        despesas: closing.total_expenses,
        orcamento: closing.monthly_budget,
        saldo_mes: closing.month_delta,
        caixa_antes: closing.shared_balance_before,
        caixa_depois: closing.shared_balance_after,
        fechado_por: resolveMemberName(members, closing.closed_by) || null,
        fechado_em: closing.closed_at,
        divisao_a: closing.split_ratio_a,
        divisao_b: closing.split_ratio_b,
      })),
    resumo_mensal: buildMonthlySummaries(
      dataset.expenses,
      dataset.incomes,
      dataset.closings,
    ).map((summary) => ({
      mes: summary.yearMonth,
      receitas: summary.totalIncomes,
      despesas: summary.totalExpenses,
      saldo_mes: summary.balance,
      fechado: summary.closed,
      caixa_apos_fechamento: summary.sharedBalanceAfter,
    })),
    metas: dataset.goals.map((goal) => ({
      titulo: goal.title,
      valor_alvo: goal.target_amount,
      data_alvo: goal.target_date,
      status: goal.status,
    })),
    contribuicoes: [...dataset.contributions]
      .sort((a, b) => a.contributed_at.localeCompare(b.contributed_at))
      .map((contribution) => ({
        meta: goalTitleById.get(contribution.goal_id) ?? null,
        valor: contribution.amount,
        contribuido_em: contribution.contributed_at,
        observacao: contribution.note,
      })),
  };

  return {
    filename: buildExportFilename("backup", "json", generatedAt),
    mimeType: MIME_JSON,
    content: JSON.stringify(backup, null, 2),
  };
}
