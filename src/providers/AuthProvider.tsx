import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import * as authService from "../services/auth";
import { clearOnboardingDraft } from "../lib/onboarding-draft";
import type { LoadStatus } from "./bootstrap";

export interface AuthSessionContextValue {
  session: Session | null;
  user: User | null;
  status: LoadStatus;
  error: string | null;
  retry: () => void;
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
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  resendVerification: (email: string) => Promise<{ error?: string }>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setStatus("loading");
      setError(null);

      try {
        const currentSession = await authService.getSession();
        if (!active) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (!active) return;
        setStatus("ready");
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Erro ao inicializar a sessão.",
        );
        setStatus("error");
      }
    };

    bootstrap();

    const unsubscribe = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);

  const signUp = useCallback(
    (email: string, password: string) => authService.signUp(email, password),
    [],
  );

  const signIn = useCallback(
    (email: string, password: string) => authService.signIn(email, password),
    [],
  );

  const signOut = useCallback(async () => {
    await clearOnboardingDraft().catch(() => {});
    await authService.signOut();
  }, []);

  const verifyOtp = useCallback(
    (email: string, token: string) => authService.verifyOtp(email, token),
    [],
  );

  const resendVerification = useCallback(
    (email: string) => authService.resendVerification(email),
    [],
  );

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session,
      user,
      status,
      error,
      retry,
      signUp,
      signIn,
      signOut,
      verifyOtp,
      resendVerification,
    }),
    [
      session,
      user,
      status,
      error,
      retry,
      signUp,
      signIn,
      signOut,
      verifyOtp,
      resendVerification,
    ],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthProvider");
  }
  return ctx;
}
