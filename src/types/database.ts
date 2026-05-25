export interface Profile {
  id: string;
  full_name: string;
  birth_date: string | null;
  monthly_income: number | null;
  invite_code: string | null;
  created_at: string;
}

export interface Couple {
  id: string;
  user_a: string;
  user_b: string;
  status: "pending" | "active";
  split_ratio_a: number;
  split_ratio_b: number;
  monthly_budget: number;
  shared_balance: number;
  last_closed_month: string | null;
  created_at: string;
  linked_at: string | null;
}

export interface Expense {
  id: string;
  couple_id: string;
  created_by: string;
  paid_by: string | null;
  description: string;
  amount: number;
  category: string;
  due_date: string | null;
  paid: boolean;
  paid_at: string | null;
  is_recurring: boolean;
  created_at: string;
}

export interface ExpenseInput {
  description: string;
  amount: number;
  category: string;
  due_date?: string;
  paid?: boolean;
  paid_at?: string;
  paid_by?: string;
  is_recurring?: boolean;
}

export interface PartnerInfo {
  id: string;
  full_name: string;
}

export interface Income {
  id: string;
  couple_id: string;
  user_id: string;
  description: string;
  amount: number;
  is_extra: boolean;
  received_at: string;
  created_at: string;
}

export interface IncomeInput {
  description: string;
  amount: number;
  is_extra?: boolean;
  received_at?: string;
}

export interface CloseMonthResult {
  success: boolean;
  total_incomes: number;
  total_expenses: number;
  month_balance: number;
  previous_balance: number;
  new_shared_balance: number;
  monthly_budget: number;
}

export interface IdealSplit {
  ratio_a: number;
  ratio_b: number;
  calculated: boolean;
}

export type UserState =
  | "unverified"
  | "profile_incomplete"
  | "awaiting_partner"
  | "linked";

export const DEFAULT_CATEGORIES = [
  { name: "Aluguel / Financiamento", icon: "\u{1F3E0}", type: "Fixo" },
  { name: "Condomínio", icon: "\u{1F3E2}", type: "Fixo" },
  { name: "Água", icon: "\u{1F4A7}", type: "Variável" },
  { name: "Energia elétrica", icon: "\u{26A1}", type: "Variável" },
  { name: "Gás", icon: "\u{1F525}", type: "Variável" },
  { name: "Internet", icon: "\u{1F4E1}", type: "Fixo" },
  { name: "Alimentação (mercado)", icon: "\u{1F6D2}", type: "Variável" },
  { name: "Alimentação (restaurantes)", icon: "\u{1F37D}\uFE0F", type: "Variável" },
  { name: "Transporte (combustível)", icon: "\u{26FD}", type: "Variável" },
  { name: "Transporte (público / app)", icon: "\u{1F68C}", type: "Variável" },
  { name: "Saúde e farmácia", icon: "\u{1F48A}", type: "Variável" },
  { name: "Plano de saúde", icon: "\u{1F3E5}", type: "Fixo" },
  { name: "Streaming e assinaturas", icon: "\u{1F4FA}", type: "Fixo" },
  { name: "Lazer e entretenimento", icon: "\u{1F389}", type: "Variável" },
  { name: "Vestuário", icon: "\u{1F455}", type: "Variável" },
  { name: "Educação", icon: "\u{1F4DA}", type: "Fixo" },
  { name: "Pets", icon: "\u{1F43E}", type: "Variável" },
  { name: "Outros", icon: "\u{1F4E6}", type: "Variável" },
];
