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
import * as coupleService from "../services/couple";
import {
  applyExpenseDelta,
  applyIncomeDelta,
  subscribeToFinance,
} from "../services/realtime";
import { sortExpenses, sortIncomes } from "../domain/finance/order";
import { toAppError } from "../utils/result";
import type {
  CloseMonthResult,
  Expense,
  ExpenseInput,
  Income,
  IncomeInput,
} from "../types/database";

export interface FinanceContextValue {
  expenses: Expense[];
  incomes: Income[];
  expensesLoading: boolean;
  incomesLoading: boolean;
  expensesError: string | null;
  incomesError: string | null;
  isBootstrapping: boolean;
  addExpense: (data: ExpenseInput) => Promise<{ error?: string }>;
  updateExpense: (
    id: string,
    data: Partial<ExpenseInput>,
  ) => Promise<{ error?: string }>;
  markExpensePaid: (id: string) => Promise<{ error?: string }>;
  deleteExpense: (id: string) => Promise<{ error?: string }>;
  fetchExpenses: () => Promise<void>;
  addIncome: (data: IncomeInput) => Promise<{ error?: string }>;
  updateIncome: (
    id: string,
    data: Partial<IncomeInput>,
  ) => Promise<{ error?: string }>;
  deleteIncome: (id: string) => Promise<{ error?: string }>;
  fetchIncomes: () => Promise<void>;
  closeMonth: () => Promise<{ error?: string; result?: CloseMonthResult }>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const { couple, refreshProfile } = useCouple();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [incomesLoading, setIncomesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [incomesError, setIncomesError] = useState<string | null>(null);
  const [loadedCoupleId, setLoadedCoupleId] = useState<string | null>(null);

  const coupleId = couple?.status === "active" ? couple.id : null;

  useEffect(() => {
    let active = true;

    if (!coupleId) {
      setExpenses([]);
      setIncomes([]);
      setExpensesError(null);
      setIncomesError(null);
      setLoadedCoupleId(null);
      return;
    }

    setExpensesLoading(true);
    setIncomesLoading(true);
    setExpensesError(null);
    setIncomesError(null);

    Promise.all([
      expenseService.fetchExpenses(coupleId),
      incomeService.fetchIncomes(coupleId),
    ])
      .then(([expenseResult, incomeResult]) => {
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
        setLoadedCoupleId(coupleId);
      })
      .finally(() => {
        if (!active) return;
        setExpensesLoading(false);
        setIncomesLoading(false);
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

  const markExpensePaid = useCallback(async (id: string) => {
    try {
      const { error, result } = await expenseService.markExpensePaid(id);
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
      expensesLoading,
      incomesLoading,
      expensesError,
      incomesError,
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
      closeMonth,
    }),
    [
      expenses,
      incomes,
      expensesLoading,
      incomesLoading,
      expensesError,
      incomesError,
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
