import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { deriveUserState } from "./user-state";
import { ok, toAppError, type ServiceResult } from "../utils/result";
import * as authService from "../services/auth";
import * as profileService from "../services/profile";
import * as coupleService from "../services/couple";
import * as expenseService from "../services/expense";
import * as incomeService from "../services/income";
import {
  applyExpenseDelta,
  applyIncomeDelta,
  type RealtimePayload,
} from "../services/realtime";
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
} from "../types/database";
import type { CostPlanInput } from "../services/couple";

export type BootstrapStatus = "loading" | "ready" | "error";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  couple: Couple | null;
  userState: UserState;
  partnerInfo: PartnerInfo | null;
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
  ) => Promise<{ error?: string; session?: Session | null; user?: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  resendVerification: (email: string) => Promise<{ error?: string }>;
  saveProfile: (data: {
    full_name: string;
    birth_date: string;
    monthly_income?: number;
  }) => Promise<{ error?: string; inviteCode?: string }>;
  updateProfile: (data: {
    full_name: string;
    monthly_income: number | null;
  }) => Promise<{ error?: string }>;
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
  markExpensePaid: (id: string) => Promise<{ error?: string }>;
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
  closeMonth: () => Promise<{ error?: string; result?: CloseMonthResult }>;
  fetchIdealSplit: () => Promise<ServiceResult<IdealSplit | null>>;
  updateCostPlan: (data: CostPlanInput) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [bootstrapStatus, setBootstrapStatus] =
    useState<BootstrapStatus>("loading");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [incomesLoading, setIncomesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [incomesError, setIncomesError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const setCurrentUser = useCallback((nextUser: User | null) => {
    userRef.current = nextUser;
    setUser(nextUser);
  }, []);

  const fetchCouple = useCallback(
    async (userId: string): Promise<Couple | null> => {
      const coupleResult = await coupleService.fetchCouple(userId);
      if (coupleResult.error) {
        throw new Error(coupleResult.error.message);
      }

      const data = coupleResult.data;

      if (data) {
        setCouple(data);

        const partnerResult = await coupleService.fetchPartner(data, userId);
        if (partnerResult.error) {
          throw new Error(partnerResult.error.message);
        }
        setPartnerInfo(partnerResult.data);

        if (data.status === "active") {
          const [expenseResult, incomeResult] = await Promise.all([
            expenseService.fetchExpenses(data.id),
            incomeService.fetchIncomes(data.id),
          ]);

          if (expenseResult.error) {
            setExpensesError(expenseResult.error.message);
          } else {
            setExpenses(expenseResult.data);
            setExpensesError(null);
          }

          if (incomeResult.error) {
            setIncomesError(incomeResult.error.message);
          } else {
            setIncomes(incomeResult.data);
            setIncomesError(null);
          }
        }
      } else {
        setCouple(null);
        setPartnerInfo(null);
        setExpenses([]);
        setIncomes([]);
      }
      return data;
    },
    [],
  );

  const refreshProfile = useCallback(
    async (userId?: string): Promise<void> => {
      const uid = userId ?? userRef.current?.id;
      if (!uid) return;
      if (refreshPromiseRef.current) return refreshPromiseRef.current;

      const task = (async () => {
        const profileResult = await profileService.fetchProfile(uid);
        if (profileResult.error) {
          throw new Error(profileResult.error.message);
        }

        setProfile(profileResult.data);
        if (profileResult.data) {
          await fetchCouple(uid);
        } else {
          setCouple(null);
          setPartnerInfo(null);
          setExpenses([]);
          setIncomes([]);
        }
      })().finally(() => {
        refreshPromiseRef.current = null;
      });

      refreshPromiseRef.current = task;
      return task;
    },
    [fetchCouple],
  );

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setBootstrapStatus("loading");
      setBootstrapError(null);

      try {
        const currentSession = await authService.getSession();
        if (!active) return;

        setSession(currentSession);
        setCurrentUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await refreshProfile(currentSession.user.id);
        }

        if (!active) return;
        setBootstrapStatus("ready");
      } catch (err) {
        if (!active) return;
        setBootstrapError(
          err instanceof Error ? err.message : "Erro ao inicializar a sessão.",
        );
        setBootstrapStatus("error");
      }
    };

    bootstrap();

    const unsubscribe = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setCurrentUser(newSession?.user ?? null);

      if (newSession?.user) {
        refreshProfile(newSession.user.id).catch((err) => {
          setBootstrapError(
            err instanceof Error ? err.message : "Erro ao carregar seus dados.",
          );
        });
      } else {
        setProfile(null);
        setCouple(null);
        setPartnerInfo(null);
        setExpenses([]);
        setIncomes([]);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshProfile, setCurrentUser, bootstrapAttempt]);

  useEffect(() => {
    if (!couple || !user) return;

    const channel = supabase
      .channel(`couple-${couple.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "couples",
          filter: `id=eq.${couple.id}`,
        },
        (payload) => {
          const updated = payload.new as Couple;
          setCouple(updated);
          if (updated.status === "active") {
            refreshProfile().catch(() => {});
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, user, refreshProfile]);

  useEffect(() => {
    if (!user) return;

    const insertChannel = supabase
      .channel(`couples-insert-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "couples",
          filter: `user_a=eq.${user.id}`,
        },
        () => {
          refreshProfile().catch(() => {});
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "couples",
          filter: `user_b=eq.${user.id}`,
        },
        () => {
          refreshProfile().catch(() => {});
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "couples",
          filter: `user_a=eq.${user.id}`,
        },
        () => {
          setCouple(null);
          setPartnerInfo(null);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "couples",
          filter: `user_b=eq.${user.id}`,
        },
        () => {
          setCouple(null);
          setPartnerInfo(null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(insertChannel);
    };
  }, [user, refreshProfile]);

  useEffect(() => {
    if (!couple || couple.status !== "active" || !user) return;

    const handleExpenseChange = (payload: RealtimePayload<Expense>) => {
      setExpenses((prev) => applyExpenseDelta(prev, payload));
    };

    const expensesChannel = supabase
      .channel(`expenses-${couple.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expenses",
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => handleExpenseChange(payload as unknown as RealtimePayload<Expense>),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "expenses",
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => handleExpenseChange(payload as unknown as RealtimePayload<Expense>),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "expenses",
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => handleExpenseChange(payload as unknown as RealtimePayload<Expense>),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
    };
  }, [couple?.id, couple?.status, user]);

  useEffect(() => {
    if (!couple || couple.status !== "active" || !user) return;

    const handleIncomeChange = (payload: RealtimePayload<Income>) => {
      setIncomes((prev) => applyIncomeDelta(prev, payload));
    };

    const incomesChannel = supabase
      .channel(`incomes-${couple.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "incomes",
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => handleIncomeChange(payload as unknown as RealtimePayload<Income>),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "incomes",
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => handleIncomeChange(payload as unknown as RealtimePayload<Income>),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "incomes",
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => handleIncomeChange(payload as unknown as RealtimePayload<Income>),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incomesChannel);
    };
  }, [couple?.id, couple?.status, user]);

  const signUp = async (email: string, password: string) => {
    return authService.signUp(email, password);
  };

  const signIn = async (email: string, password: string) => {
    return authService.signIn(email, password);
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([
      "@registration_step",
      "@profile_draft_name",
      "@profile_draft_birthdate",
      "@profile_draft_income",
    ]).catch(() => {});
    await authService.signOut();
  };

  const verifyOtp = async (email: string, token: string) => {
    return authService.verifyOtp(email, token);
  };

  const resendVerification = async (email: string) => {
    return authService.resendVerification(email);
  };

  const saveProfile = async (data: {
    full_name: string;
    birth_date: string;
    monthly_income?: number;
  }) => {
    if (!user) return { error: "No user" };

    const { error, profile: savedProfile } = await profileService.saveProfile(
      user.id,
      data,
    );
    if (error) return { error };

    await refreshProfile().catch(() => {});
    return { inviteCode: savedProfile?.invite_code ?? undefined };
  };

  const updateProfile = async (data: {
    full_name: string;
    monthly_income: number | null;
  }) => {
    if (!user) return { error: "No user" };

    const { error } = await profileService.updateProfile(user.id, data);
    if (error) return { error };

    await refreshProfile().catch(() => {});
    return {};
  };

  const lookupPartner = async (inviteCode: string) => {
    return coupleService.lookupPartner(inviteCode);
  };

  const linkPartner = async (inviteCode: string) => {
    if (!user) return { error: "No user" };
    const result = await coupleService.linkPartner(inviteCode);
    await refreshProfile().catch(() => {});
    return result;
  };

  const acceptInvitation = async (coupleId: string) => {
    if (!user) return { error: "No user" };
    const result = await coupleService.acceptInvitation(coupleId);
    await refreshProfile().catch(() => {});
    return result;
  };

  const rejectInvitation = async (coupleId: string) => {
    if (!user) return { error: "No user" };
    const result = await coupleService.rejectInvitation(coupleId);
    setCouple(null);
    setPartnerInfo(null);
    return result;
  };

  const fetchExpenses = useCallback(async () => {
    if (!couple) return;
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const result = await expenseService.fetchExpenses(couple.id);
      if (result.error) {
        setExpensesError(result.error.message);
        return;
      }
      setExpenses(result.data);
    } catch (err) {
      setExpensesError(toAppError(err, "Erro ao carregar despesas.").message);
    } finally {
      setExpensesLoading(false);
    }
  }, [couple]);

  const addExpense = async (data: ExpenseInput) => {
    if (!user || !couple) return { error: "No user or couple" };
    try {
      const { error } = await expenseService.createExpense(couple.id, user.id, data);
      if (error) return { error };
      return {};
    } catch (err: any) {
      return { error: err.message };
    } finally {
      fetchExpenses().catch(() => {});
    }
  };

  const updateExpense = async (id: string, data: Partial<ExpenseInput>) => {
    try {
      const { error } = await expenseService.updateExpense(id, data);
      if (error) return { error };
      return {};
    } catch (err: any) {
      return { error: err.message };
    } finally {
      fetchExpenses().catch(() => {});
    }
  };

  const markExpensePaid = async (id: string) => {
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
  };

  const deleteExpense = async (id: string) => {
    const { error } = await expenseService.deleteExpense(id);
    if (error) return { error };
    await fetchExpenses();
    return {};
  };

  const fetchIncomes = useCallback(async () => {
    if (!couple) return;
    setIncomesLoading(true);
    setIncomesError(null);
    try {
      const result = await incomeService.fetchIncomes(couple.id);
      if (result.error) {
        setIncomesError(result.error.message);
        return;
      }
      setIncomes(result.data);
    } catch (err) {
      setIncomesError(toAppError(err, "Erro ao carregar receitas.").message);
    } finally {
      setIncomesLoading(false);
    }
  }, [couple]);

  const addIncome = async (data: IncomeInput) => {
    if (!user || !couple) return { error: "No user or couple" };
    try {
      const { error } = await incomeService.createIncome(couple.id, user.id, data);
      if (error) return { error };
      return {};
    } catch (err: any) {
      return { error: err.message };
    } finally {
      fetchIncomes().catch(() => {});
    }
  };

  const updateIncome = async (id: string, data: Partial<IncomeInput>) => {
    const { error } = await incomeService.updateIncome(id, data);
    if (error) return { error };
    await fetchIncomes();
    return {};
  };

  const deleteIncome = async (id: string) => {
    const { error } = await incomeService.deleteIncome(id);
    if (error) return { error };
    await fetchIncomes();
    return {};
  };

  const closeMonth = async () => {
    if (!couple) return { error: "No couple" };
    try {
      const { error, result } = await coupleService.closeMonth(couple.id);
      if (error) return { error };
      return { result };
    } catch (err: any) {
      return { error: err.message };
    } finally {
      refreshProfile().catch(() => {});
    }
  };

  const fetchIdealSplit = useCallback(async () => {
    if (!couple) return ok(null);
    return coupleService.fetchIdealSplit(couple.id);
  }, [couple]);

  const updateCostPlan = async (data: CostPlanInput) => {
    if (!couple) return { error: "No couple" };
    try {
      const { error } = await coupleService.updateCostPlan(couple.id, data);
      if (error) return { error };
      return {};
    } catch (err: any) {
      return { error: err.message };
    } finally {
      refreshProfile().catch(() => {});
    }
  };

  const userState = deriveUserState(profile, couple);
  const loading = bootstrapStatus === "loading";

  const retryBootstrap = useCallback(() => {
    setBootstrapAttempt((attempt) => attempt + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        couple,
        userState,
        partnerInfo,
        loading,
        bootstrapStatus,
        bootstrapError,
        retryBootstrap,
        expensesLoading,
        incomesLoading,
        expensesError,
        incomesError,
        signUp,
        signIn,
        signOut,
        verifyOtp,
        resendVerification,
        saveProfile,
        updateProfile,
        lookupPartner,
        linkPartner,
        acceptInvitation,
        rejectInvitation,
        refreshProfile,
        expenses,
        addExpense,
        updateExpense,
        markExpensePaid,
        deleteExpense,
        fetchExpenses,
        incomes,
        addIncome,
        updateIncome,
        deleteIncome,
        fetchIncomes,
        closeMonth,
        fetchIdealSplit,
        updateCostPlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
