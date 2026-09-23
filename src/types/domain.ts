import type { Database } from "./database.generated";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];

export type CoupleStatus = "pending" | "active" | "ended";

export type Couple = Omit<Tables["couples"]["Row"], "status"> & {
  status: CoupleStatus;
};

export type Expense = Tables["expenses"]["Row"];

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

export interface CloseMonthResult {
  success: boolean;
  total_incomes: number;
  total_expenses: number;
  month_balance: number;
  previous_balance: number;
  new_shared_balance: number;
  monthly_budget: number;
  last_closed_month: string;
}

export interface IdealSplit {
  ratio_a: number;
  ratio_b: number;
  calculated: boolean;
}

export type UserState =
  "unverified" | "profile_incomplete" | "awaiting_partner" | "linked";
