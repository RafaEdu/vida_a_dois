import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type {
  Profile,
  Couple,
  UserState,
  PartnerInfo,
  Expense,
  ExpenseInput,
} from "../types/database";

interface AuthContextType {
  session: any;
  user: any;
  profile: Profile | null;
  couple: Couple | null;
  userState: UserState;
  partnerInfo: PartnerInfo | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; session?: any; user?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  resendVerification: (email: string) => Promise<{ error?: string }>;
  saveProfile: (data: {
    full_name: string;
    birth_date: string;
    monthly_income?: number;
  }) => Promise<{ error?: string; inviteCode?: string }>;
  lookupPartner: (
    inviteCode: string,
  ) => Promise<{ error?: string; partner?: PartnerInfo }>;
  linkPartner: (inviteCode: string) => Promise<{ error?: string }>;
  acceptInvitation: (coupleId: string) => Promise<{ error?: string }>;
  rejectInvitation: (coupleId: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  expenses: Expense[];
  addExpense: (data: ExpenseInput) => Promise<{ error?: string }>;
  updateExpense: (id: string, data: Partial<ExpenseInput>) => Promise<{ error?: string }>;
  deleteExpense: (id: string) => Promise<{ error?: string }>;
  fetchExpenses: () => Promise<void>;
  updateCostPlan: (data: { monthly_budget?: number; split_ratio_a?: number; split_ratio_b?: number }) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const getUserState = useCallback(
    (profile: Profile | null, couple: Couple | null): UserState => {
      if (!profile) return "profile_incomplete";
      if (!couple) return "awaiting_partner";
      if (couple.status === "pending") return "awaiting_partner";
      return "linked";
    },
    [],
  );

  const fetchCouple = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("couples")
      .select("*")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .maybeSingle();

    if (data) {
      setCouple(data);
      if (data.status === "active") {
        const partnerId = data.user_a === userId ? data.user_b : data.user_a;
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", partnerId)
          .single();
        setPartnerInfo(partnerProfile);
        const { data: expensesData } = await supabase
          .from("expenses")
          .select("*")
          .eq("couple_id", data.id)
          .order("created_at", { ascending: false });
        if (expensesData) setExpenses(expensesData as Expense[]);
      } else if (data.status === "pending") {
        const partnerId = data.user_a === userId ? data.user_b : data.user_a;
        const { data: pp } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", partnerId)
          .single();
        setPartnerInfo(pp);
      }
    } else {
      setCouple(null);
      setPartnerInfo(null);
      setExpenses([]);
    }
    return data;
  }, []);

  const refreshProfile = useCallback(
    async (userId?: string) => {
      const uid = userId || user?.id;
      if (!uid) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();
      setProfile(p);
      if (p) {
        await fetchCouple(uid);
      }
    },
    [user, fetchCouple],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile(session.user.id);
      } else {
        setProfile(null);
        setCouple(null);
        setPartnerInfo(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

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
            refreshProfile();
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
        () => { refreshProfile(); },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "couples",
          filter: `user_b=eq.${user.id}`,
        },
        () => { refreshProfile(); },
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
        () => { fetchExpenses(); },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "expenses",
          filter: `couple_id=eq.${couple.id}`,
        },
        () => { fetchExpenses(); },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "expenses",
          filter: `couple_id=eq.${couple.id}`,
        },
        () => { fetchExpenses(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
    };
  }, [couple?.id, couple?.status, user]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message, session: data.session, user: data.user };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message };
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([
      "@registration_step",
      "@profile_draft_name",
      "@profile_draft_birthdate",
      "@profile_draft_income",
    ]).catch(() => {});
    await supabase.auth.signOut();
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    return { error: error?.message };
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    return { error: error?.message };
  };

  const saveProfile = async (data: {
    full_name: string;
    birth_date: string;
    monthly_income?: number;
  }) => {
    if (!user) return { error: "No user" };

    let inviteCode = generateInviteCode();

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: data.full_name,
      birth_date: data.birth_date,
      monthly_income: data.monthly_income ?? null,
      invite_code: inviteCode,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        inviteCode = generateInviteCode();
        const { error: retryError } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: data.full_name,
          birth_date: data.birth_date,
          monthly_income: data.monthly_income ?? null,
          invite_code: inviteCode,
        });
        if (retryError) return { error: retryError.message };
      } else {
        return { error: insertError.message };
      }
    }

    await refreshProfile();
    return { inviteCode };
  };

  const lookupPartner = async (inviteCode: string) => {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "lookup_partner",
      { p_invite_code: inviteCode },
    );

    if (rpcError) return { error: rpcError.message };
    if (!rpcData || (Array.isArray(rpcData) && rpcData.length === 0))
      return { error: "Código inválido. Verifique e tente novamente." };

    const partner = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    return { partner: partner as PartnerInfo };
  };

  const linkPartner = async (inviteCode: string) => {
    if (!user) return { error: "No user" };
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "link_partner",
      { p_invite_code: inviteCode, p_current_user_id: user.id },
    );

    if (rpcError) return { error: rpcError.message };
    if (rpcData && (rpcData as any).error)
      return { error: (rpcData as any).error };

    await refreshProfile();
    return {};
  };

  const acceptInvitation = async (coupleId: string) => {
    if (!user) return { error: "No user" };
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "accept_invitation",
      { p_couple_id: coupleId, p_current_user_id: user.id },
    );

    if (rpcError) return { error: rpcError.message };
    if (rpcData && (rpcData as any).error)
      return { error: (rpcData as any).error };

    await refreshProfile();
    return {};
  };

  const rejectInvitation = async (coupleId: string) => {
    if (!user) return { error: "No user" };
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "reject_invitation",
      { p_couple_id: coupleId, p_current_user_id: user.id },
    );

    if (rpcError) return { error: rpcError.message };
    if (rpcData && (rpcData as any).error)
      return { error: (rpcData as any).error };

    setCouple(null);
    setPartnerInfo(null);
    return {};
  };

  const fetchExpenses = useCallback(async () => {
    if (!couple) return;
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false });
    if (data) setExpenses(data as Expense[]);
  }, [couple]);

  const addExpense = async (data: ExpenseInput) => {
    if (!user || !couple) return { error: "No user or couple" };
    const { error } = await supabase.from("expenses").insert({
      ...data,
      couple_id: couple.id,
      created_by: user.id,
      paid: data.paid ?? false,
    });
    if (error) return { error: error.message };
    await fetchExpenses();
    return {};
  };

  const updateExpense = async (id: string, data: Partial<ExpenseInput>) => {
    const { error } = await supabase.from("expenses").update(data).eq("id", id);
    if (error) return { error: error.message };
    await fetchExpenses();
    return {};
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchExpenses();
    return {};
  };

  const updateCostPlan = async (data: {
    monthly_budget?: number;
    split_ratio_a?: number;
    split_ratio_b?: number;
  }) => {
    if (!couple) return { error: "No couple" };
    const { error } = await supabase
      .from("couples")
      .update(data)
      .eq("id", couple.id);
    if (error) return { error: error.message };
    await refreshProfile();
    return {};
  };

  const userState = getUserState(profile, couple);

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
        signUp,
        signIn,
        signOut,
        verifyOtp,
        resendVerification,
        saveProfile,
        lookupPartner,
        linkPartner,
        acceptInvitation,
        rejectInvitation,
        refreshProfile,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        fetchExpenses,
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
