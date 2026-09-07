import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export function onAuthStateChange(
  cb: (session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) =>
    cb(session),
  );
  return () => data.subscription.unsubscribe();
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ error?: string; session?: Session | null; user?: User | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message, session: data.session, user: data.user };
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message };
}

export async function signOut(): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message };
}

export async function verifyOtp(
  email: string,
  token: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  return { error: error?.message };
}

export async function resendVerification(
  email: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  return { error: error?.message };
}
