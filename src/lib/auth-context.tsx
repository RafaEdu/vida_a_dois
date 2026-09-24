import { useCallback, useMemo } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useAuthSession } from "../providers/AuthProvider";
import { useCouple } from "../providers/CoupleProvider";
import { useFinance } from "../providers/FinanceProvider";
import type { BootstrapStatus, LoadStatus } from "../providers/bootstrap";
import {
  deriveBootstrapStatus,
  isBootstrapLoading,
} from "../providers/bootstrap";
import type { ServiceResult } from "../utils/result";
import type { CostPlanInput } from "../services/couple";
import type { ProfileUpdateInput } from "../domain/account/schemas";
import type { AvatarPickerAsset } from "../domain/account/avatar";
import type {
  Profile,
  Couple,
  UserState,
  PartnerInfo,
  PartnerLookup,
  Expense,
  ExpenseInput,
  Income,
  IncomeInput,
  CloseMonthResult,
  IdealSplit,
  CategoryBudget,
  CategoryBudgetInput,
  FinancialGoal,
  FinancialGoalInput,
  GoalContribution,
  GoalContributionInput,
  GoalStatus,
} from "../types/domain";

export type { BootstrapStatus };

/**
 * Fachada de compatibilidade que agrega sessão, perfil/casal e finanças.
 *
 * **Não usar em código novo.** A separação canônica de contextos é:
 *
 * - autenticação/sessão -> `useAuthSession` (`providers/AuthProvider`);
 * - perfil e casal -> `useCouple` (`providers/CoupleProvider`);
 * - finanças -> `useFinance` (`providers/FinanceProvider`).
 *
 * Este agregador existe apenas para telas legadas que ainda consomem várias
 * áreas de uma vez. Novos consumidores devem importar os providers específicos
 * para não aumentar o acoplamento.
 */
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  couple: Couple | null;
  userState: UserState;
  partnerInfo: PartnerInfo | null;
  selfAvatarUrl: string | null;
  partnerAvatarUrl: string | null;
  loading: boolean;
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;
  retryBootstrap: () => void;
  expensesLoading: boolean;
  incomesLoading: boolean;
  expensesError: string | null;
  incomesError: string | null;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error?: string;
    session?: Session | null;
    user?: User | null;
  }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  resendVerification: (email: string) => Promise<{ error?: string }>;
  saveProfile: (data: {
    full_name: string;
    birth_date: string;
    monthly_income?: number;
  }) => Promise<{ error?: string; inviteCode?: string }>;
  updateProfile: (data: ProfileUpdateInput) => Promise<{ error?: string }>;
  uploadAvatar: (asset: AvatarPickerAsset) => Promise<{ error?: string }>;
  removeAvatar: () => Promise<{ error?: string }>;
  lookupPartner: (
    inviteCode: string,
  ) => Promise<{ error?: string; partner?: PartnerLookup }>;
  linkPartner: (inviteCode: string) => Promise<{ error?: string }>;
  acceptInvitation: (coupleId: string) => Promise<{ error?: string }>;
  rejectInvitation: (coupleId: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  expenses: Expense[];
  addExpense: (data: ExpenseInput) => Promise<{ error?: string }>;
  updateExpense: (
    id: string,
    data: Partial<ExpenseInput>,
  ) => Promise<{ error?: string }>;
  markExpensePaid: (id: string, payerId: string) => Promise<{ error?: string }>;
  deleteExpense: (id: string) => Promise<{ error?: string }>;
  fetchExpenses: () => Promise<void>;
  incomes: Income[];
  addIncome: (data: IncomeInput) => Promise<{ error?: string }>;
  updateIncome: (
    id: string,
    data: Partial<IncomeInput>,
  ) => Promise<{ error?: string }>;
  deleteIncome: (id: string) => Promise<{ error?: string }>;
  fetchIncomes: () => Promise<void>;
  categoryBudgets: CategoryBudget[];
  saveCategoryBudget: (
    data: CategoryBudgetInput,
  ) => Promise<{ error?: string }>;
  removeCategoryBudget: (id: string) => Promise<{ error?: string }>;
  fetchCategoryBudgets: () => Promise<void>;
  goals: FinancialGoal[];
  goalContributions: GoalContribution[];
  createGoal: (data: FinancialGoalInput) => Promise<{ error?: string }>;
  updateGoal: (
    id: string,
    data: FinancialGoalInput,
  ) => Promise<{ error?: string }>;
  setGoalStatus: (
    id: string,
    status: GoalStatus,
  ) => Promise<{ error?: string }>;
  addGoalContribution: (
    goalId: string,
    data: GoalContributionInput,
  ) => Promise<{ error?: string }>;
  fetchGoals: () => Promise<void>;
  closeMonth: () => Promise<{ error?: string; result?: CloseMonthResult }>;
  fetchIdealSplit: () => Promise<ServiceResult<IdealSplit | null>>;
  updateCostPlan: (data: CostPlanInput) => Promise<{ error?: string }>;
}

/**
 * @deprecated Use `useAuthSession`, `useCouple` e `useFinance` diretamente.
 * Mantido apenas como fachada de compatibilidade para telas legadas; não
 * adicionar novos consumidores.
 */
export function useAuth(): AuthContextType {
  const auth = useAuthSession();
  const coupleCtx = useCouple();
  const finance = useFinance();

  const status: LoadStatus = deriveBootstrapStatus(
    auth.status,
    coupleCtx.status,
  );
  const loading = isBootstrapLoading(
    auth.status,
    coupleCtx.status,
    finance.isBootstrapping ? "loading" : "ready",
  );
  const bootstrapError = auth.error ?? coupleCtx.error;

  const retryBootstrap = useCallback(() => {
    auth.retry();
    coupleCtx.retry();
  }, [auth, coupleCtx]);

  return useMemo(
    () => ({
      session: auth.session,
      user: auth.user,
      profile: coupleCtx.profile,
      couple: coupleCtx.couple,
      userState: coupleCtx.userState,
      partnerInfo: coupleCtx.partnerInfo,
      selfAvatarUrl: coupleCtx.selfAvatarUrl,
      partnerAvatarUrl: coupleCtx.partnerAvatarUrl,
      loading,
      bootstrapStatus: status,
      bootstrapError,
      retryBootstrap,
      expensesLoading: finance.expensesLoading,
      incomesLoading: finance.incomesLoading,
      expensesError: finance.expensesError,
      incomesError: finance.incomesError,
      signUp: auth.signUp,
      signIn: auth.signIn,
      signOut: auth.signOut,
      updatePassword: auth.updatePassword,
      verifyOtp: auth.verifyOtp,
      resendVerification: auth.resendVerification,
      saveProfile: coupleCtx.saveProfile,
      updateProfile: coupleCtx.updateProfile,
      uploadAvatar: coupleCtx.uploadAvatar,
      removeAvatar: coupleCtx.removeAvatar,
      lookupPartner: coupleCtx.lookupPartner,
      linkPartner: coupleCtx.linkPartner,
      acceptInvitation: coupleCtx.acceptInvitation,
      rejectInvitation: coupleCtx.rejectInvitation,
      refreshProfile: coupleCtx.refreshProfile,
      expenses: finance.expenses,
      addExpense: finance.addExpense,
      updateExpense: finance.updateExpense,
      markExpensePaid: finance.markExpensePaid,
      deleteExpense: finance.deleteExpense,
      fetchExpenses: finance.fetchExpenses,
      incomes: finance.incomes,
      addIncome: finance.addIncome,
      updateIncome: finance.updateIncome,
      deleteIncome: finance.deleteIncome,
      fetchIncomes: finance.fetchIncomes,
      categoryBudgets: finance.categoryBudgets,
      saveCategoryBudget: finance.saveCategoryBudget,
      removeCategoryBudget: finance.removeCategoryBudget,
      fetchCategoryBudgets: finance.fetchCategoryBudgets,
      goals: finance.goals,
      goalContributions: finance.goalContributions,
      createGoal: finance.createGoal,
      updateGoal: finance.updateGoal,
      setGoalStatus: finance.setGoalStatus,
      addGoalContribution: finance.addGoalContribution,
      fetchGoals: finance.fetchGoals,
      closeMonth: finance.closeMonth,
      fetchIdealSplit: coupleCtx.fetchIdealSplit,
      updateCostPlan: coupleCtx.updateCostPlan,
    }),
    [auth, coupleCtx, finance, loading, status, bootstrapError, retryBootstrap],
  );
}
