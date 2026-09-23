import type { Database } from "./database.generated";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];

export type CoupleStatus = "pending" | "active" | "ended";

export type CoupleSplitMode = "manual" | "income_based";

export type Couple = Omit<Tables["couples"]["Row"], "status" | "split_mode"> & {
  status: CoupleStatus;
  split_mode: CoupleSplitMode;
};

export type Expense = Tables["expenses"]["Row"];

export type RecurrenceSeries = Tables["expense_recurrence_series"]["Row"];

export type RecurrenceFrequency = "monthly";

export interface RecurrenceSeriesInput {
  description: string;
  category: string;
  amount: number;
}

export type Income = Tables["incomes"]["Row"];

export interface ExpenseInput {
  description: string;
  amount: number;
  category: string;
  due_date?: string;
  paid?: boolean;
  paid_at?: string | null;
  paid_by?: string | null;
  is_recurring?: boolean;
}

export interface IncomeInput {
  description: string;
  amount: number;
  is_extra?: boolean;
  received_at?: string;
}

export interface PartnerInfo {
  id: string;
  full_name: string;
  monthly_income: number | null;
  avatar_path: string | null;
}

export interface PartnerLookup {
  full_name: string;
}

export type MonthlyClosing = Tables["monthly_closings"]["Row"];

export interface CloseMonthResult {
  success: boolean;
  already_closed: boolean;
  id: string;
  year_month: string;
  total_incomes: number;
  total_expenses: number;
  monthly_budget: number;
  split_ratio_a: number;
  split_ratio_b: number;
  shared_balance_before: number;
  month_delta: number;
  shared_balance_after: number;
  closed_by: string | null;
  closed_at: string;
  last_closed_month: string;
}

export interface IdealSplit {
  ratio_a: number;
  ratio_b: number;
  calculated: boolean;
}

export type UserState =
  "unverified" | "profile_incomplete" | "awaiting_partner" | "linked";
