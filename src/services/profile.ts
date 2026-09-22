import { supabase } from "../lib/supabase";
import type { Profile } from "../types/domain";
import { fail, ok, toAppError } from "../utils/result";
import type { ServiceResult } from "../utils/result";

export async function fetchProfile(
  userId: string,
): Promise<ServiceResult<Profile | null>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return fail(toAppError(error, "Não foi possível carregar o perfil."));
  }
  return ok((data as Profile) ?? null);
}

export interface SaveProfileInput {
  full_name: string;
  birth_date: string;
  monthly_income?: number | null;
}

export async function saveProfile(
  userId: string,
  data: SaveProfileInput,
): Promise<{ error?: string; profile?: Profile }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: data.full_name,
        birth_date: data.birth_date,
        monthly_income: data.monthly_income ?? null,
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { profile: profile as Profile };
}

export interface UpdateProfileInput {
  full_name: string;
  monthly_income: number | null;
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput,
): Promise<{ error?: string; profile?: Profile }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();

  if (error) return { error: error.message };
  return { profile: profile as Profile };
}
