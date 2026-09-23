import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthSession } from "./AuthProvider";
import { useCouple } from "./CoupleProvider";
import { deriveFinanceLoadStatus } from "./bootstrap";
import * as expenseService from "../services/expense";
import * as incomeService from "../services/income";
import * as categoryBudgetService from "../services/categoryBudget";
import * as coupleService from "../services/couple";
import {
  applyExpenseDelta,
  applyIncomeDelta,
  subscribeToFinance,
} from "../services/realtime";
import { sortExpenses, sortIncomes } from "../domain/finance/order";
import { toAppError } from "../utils/result";
import type {
  CategoryBudget,
  CategoryBudgetInput,
  CloseMonthResult,
  Expense,
  ExpenseInput,
  Income,
  IncomeInput,
} from "../types/domain";

export interface FinanceContextValue {
  expenses: Expense[];
  incomes: Income[];
  categoryBudgets: CategoryBudget[];
  expensesLoading: boolean;
  incomesLoading: boolean;
  categoryBudgetsLoading: boolean;
  expensesError: string | null;
  incomesError: string | null;
  categoryBudgetsError: string | null;
  isBootstrapping: boolean;
  addExpense: (data: ExpenseInput) => Promise<{ error?: string }>;
  updateExpense: (
    id: string,
    data: Partial<ExpenseInput>,
  ) => Promise<{ error?: string }>;
  markExpensePaid: (id: string, payerId: string) => Promise<{ error?: string }>;
  deleteExpense: (id: string) => Promise<{ error?: string }>;
  fetchExpenses: () => Promise<void>;
  addIncome: (data: IncomeInput) => Promise<{ error?: string }>;
  updateIncome: (
    id: string,
    data: Partial<IncomeInput>,
  ) => Promise<{ error?: string }>;
  deleteIncome: (id: string) => Promise<{ error?: string }>;
  fetchIncomes: () => Promise<void>;
  saveCategoryBudget: (
    data: CategoryBudgetInput,
  ) => Promise<{ error?: string }>;
  removeCategoryBudget: (id: string) => Promise<{ error?: string }>;
  fetchCategoryBudgets: () => Promise<void>;
  closeMonth: () => Promise<{ error?: string; result?: CloseMonthResult }>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const { couple, refreshProfile } = useCouple();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [incomesLoading, setIncomesLoading] = useState(false);
  const [categoryBudgetsLoading, setCategoryBudgetsLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [incomesError, setIncomesError] = useState<string | null>(null);
  const [categoryBudgetsError, setCategoryBudgetsError] = useState<
    string | null
  >(null);
  const [loadedCoupleId, setLoadedCoupleId] = useState<string | null>(null);

  const coupleId = couple?.status === "active" ? couple.id : null;

  useEffect(() => {
    let active = true;

    if (!coupleId) {
      setExpenses([]);
      setIncomes([]);
      setCategoryBudgets([]);
      setExpensesError(null);
      setIncomesError(null);
      setCategoryBudgetsError(null);
      setLoadedCoupleId(null);
      return;
    }

    setExpensesLoading(true);
    setIncomesLoading(true);
    setCategoryBudgetsLoading(true);
    setExpensesError(null);
    setIncomesError(null);
    setCategoryBudgetsError(null);

    Promise.all([
      expenseService.fetchExpenses(coupleId),
      incomeService.fetchIncomes(coupleId),
      categoryBudgetService.fetchCategoryBudgets(coupleId),
    ])
      .then(([expenseResult, incomeResult, budgetResult]) => {
        if (!active) return;

        if (expenseResult.error) {
          setExpensesError(expenseResult.error.message);
        } else {
          setExpenses(sortExpenses(expenseResult.data));
          setExpensesError(null);
        }

        if (incomeResult.error) {
          setIncomesError(incomeResult.error.message);
        } else {
          setIncomes(sortIncomes(incomeResult.data));
          setIncomesError(null);
        }

        if (budgetResult.error) {
          setCategoryBudgetsError(budgetResult.error.message);
        } else {
          setCategoryBudgets(budgetResult.data);
          setCategoryBudgetsError(null);
        }

        setLoadedCoupleId(coupleId);
      })
      .catch((err) => {
        if (!active) return;
        const message = toAppError(
          err,
          "Erro ao carregar os lançamentos.",
        ).message;
        setExpensesError(message);
        setIncomesError(message);
        setCategoryBudgetsError(message);
        setLoadedCoupleId(coupleId);
      })
      .finally(() => {
        if (!active) return;
        setExpensesLoading(false);
        setIncomesLoading(false);
        setCategoryBudgetsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;

    return subscribeToFinance(coupleId, {
      onExpense: (payload) => {
        setExpenses((prev) => applyExpenseDelta(prev, payload));
      },
      onIncome: (payload) => {
        setIncomes((prev) => applyIncomeDelta(prev, payload));
      },
    });
  }, [coupleId]);

  const fetchExpenses = useCallback(async () => {
    if (!coupleId) return;
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const result = await expenseService.fetchExpenses(coupleId);
      if (result.error) {
        setExpensesError(result.error.message);
        return;
      }
      setExpenses(sortExpenses(result.data));
    } catch (err) {
      setExpensesError(toAppError(err, "Erro ao carregar despesas.").message);
    } finally {
      setExpensesLoading(false);
    }
  }, [coupleId]);

  const fetchIncomes = useCallback(async () => {
    if (!coupleId) return;
    setIncomesLoading(true);
    setIncomesError(null);
    try {
      const result = await incomeService.fetchIncomes(coupleId);
      if (result.error) {
        setIncomesError(result.error.message);
        return;
      }
      setIncomes(sortIncomes(result.data));
    } catch (err) {
      setIncomesError(toAppError(err, "Erro ao carregar receitas.").message);
    } finally {
      setIncomesLoading(false);
    }
  }, [coupleId]);

  const fetchCategoryBudgets = useCallback(async () => {
    if (!coupleId) return;
    setCategoryBudgetsLoading(true);
    setCategoryBudgetsError(null);
    try {
      const result = await categoryBudgetService.fetchCategoryBudgets(coupleId);
      if (result.error) {
        setCategoryBudgetsError(result.error.message);
        return;
      }
      setCategoryBudgets(result.data);
    } catch (err) {
      setCategoryBudgetsError(
        toAppError(err, "Erro ao carregar o orçamento por categoria.").message,
      );
    } finally {
      setCategoryBudgetsLoading(false);
    }
  }, [coupleId]);

  const saveCategoryBudget = useCallback(
    async (data: CategoryBudgetInput) => {
      if (!coupleId) return { error: "No couple" };
      try {
        const result = await categoryBudgetService.saveCategoryBudget(
          coupleId,
          data,
        );
        if (result.error) return { error: result.error.message };

        const saved = result.data;
        setCategoryBudgets((prev) => {
          const next = prev.filter((budget) => budget.id !== saved.id);
          return [...next, saved].sort((a, b) =>
            a.category.localeCompare(b.category),
          );
        });
        return {};
      } catch (err) {
        return {
          error: toAppError(err, "Erro ao salvar o orçamento da categoria.")
            .message,
        };
      }
    },
    [coupleId],
  );

  const removeCategoryBudget = useCallback(async (id: string) => {
    const { error } = await categoryBudgetService.deleteCategoryBudget(id);
    if (error) return { error };
    setCategoryBudgets((prev) => prev.filter((budget) => budget.id !== id));
    return {};
  }, []);

  const addExpense = useCallback(
    async (data: ExpenseInput) => {
      if (!user || !coupleId) return { error: "No user or couple" };
      try {
        const result = await expenseService.createExpense(
          coupleId,
          user.id,
          data,
        );
        if (result.error) return { error: result.error.message };

        setExpenses((prev) =>
          applyExpenseDelta(prev, {
            eventType: "INSERT",
            new: result.data,
            old: { id: result.data.id },
          }),
        );
        return {};
      } catch (err) {
        return { error: toAppError(err, "Erro ao salvar despesa.").message };
      }
    },
    [user, coupleId],
  );

  const updateExpense = useCallback(
    async (id: string, data: Partial<ExpenseInput>) => {
      try {
        const result = await expenseService.updateExpense(id, data);
        if (result.error) return { error: result.error.message };

        setExpenses((prev) =>
          applyExpenseDelta(prev, {
            eventType: "UPDATE",
            new: result.data,
            old: { id },
          }),
        );
        return {};
      } catch (err) {
        return { error: toAppError(err, "Erro ao atualizar despesa.").message };
      }
    },
    [],
  );

  const markExpensePaid = useCallback(async (id: string, payerId: string) => {
    try {
      const { error, result } = await expenseService.markExpensePaid(
        id,
        payerId,
      );
      if (error) return { error };

      if (result) {
        setExpenses((prev) => {
          let next = applyExpenseDelta(prev, {
            eventType: "UPDATE",
            new: result.expense,
            old: { id: result.expense.id },
          });

          if (result.nextExpense) {
            next = applyExpenseDelta(next, {
              eventType: "INSERT",
              new: result.nextExpense,
              old: { id: result.nextExpense.id },
            });
          }

          return next;
        });
      }

      return {};
    } catch (err) {
      return {
        error: toAppError(err, "Não foi possível confirmar o pagamento.")
          .message,
      };
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await expenseService.deleteExpense(id);
    if (error) return { error };
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    return {};
  }, []);

  const addIncome = useCallback(
    async (data: IncomeInput) => {
      if (!user || !coupleId) return { error: "No user or couple" };
      try {
        const result = await incomeService.createIncome(
          coupleId,
          user.id,
          data,
        );
        if (result.error) return { error: result.error.message };

        setIncomes((prev) =>
          applyIncomeDelta(prev, {
            eventType: "INSERT",
            new: result.data,
            old: { id: result.data.id },
          }),
        );
        return {};
      } catch (err) {
        return { error: toAppError(err, "Erro ao salvar receita.").message };
      }
    },
    [user, coupleId],
  );

  const updateIncome = useCallback(
    async (id: string, data: Partial<IncomeInput>) => {
      const result = await incomeService.updateIncome(id, data);
      if (result.error) return { error: result.error.message };

      setIncomes((prev) =>
        applyIncomeDelta(prev, {
          eventType: "UPDATE",
          new: result.data,
          old: { id },
        }),
      );
      return {};
    },
    [],
  );

  const deleteIncome = useCallback(async (id: string) => {
    const { error } = await incomeService.deleteIncome(id);
    if (error) return { error };
    setIncomes((prev) => prev.filter((income) => income.id !== id));
    return {};
  }, []);

  const closeMonth = useCallback(async () => {
    if (!coupleId) return { error: "No couple" };
    try {
      const { error, result } = await coupleService.closeMonth(coupleId);
      if (error) return { error };
      return { result };
    } catch (err) {
      return { error: toAppError(err, "Erro ao fechar o mês.").message };
    } finally {
      refreshProfile().catch(() => {});
    }
  }, [coupleId, refreshProfile]);

  const status = deriveFinanceLoadStatus({
    coupleId,
    coupleStatus: couple?.status,
    loadedCoupleId,
  });

  const value = useMemo<FinanceContextValue>(
    () => ({
      expenses,
      incomes,
      categoryBudgets,
      expensesLoading,
      incomesLoading,
      categoryBudgetsLoading,
      expensesError,
      incomesError,
      categoryBudgetsError,
      isBootstrapping: status === "loading",
      addExpense,
      updateExpense,
      markExpensePaid,
      deleteExpense,
      fetchExpenses,
      addIncome,
      updateIncome,
      deleteIncome,
      fetchIncomes,
      saveCategoryBudget,
      removeCategoryBudget,
      fetchCategoryBudgets,
      closeMonth,
    }),
    [
      expenses,
      incomes,
      categoryBudgets,
      expensesLoading,
      incomesLoading,
      categoryBudgetsLoading,
      expensesError,
      incomesError,
      categoryBudgetsError,
      status,
      addExpense,
      updateExpense,
      markExpensePaid,
      deleteExpense,
      fetchExpenses,
      addIncome,
      updateIncome,
      deleteIncome,
      fetchIncomes,
      saveCategoryBudget,
      removeCategoryBudget,
      fetchCategoryBudgets,
      closeMonth,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
