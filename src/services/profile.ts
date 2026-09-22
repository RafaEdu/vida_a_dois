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
  birth_date: string;
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

// ============================================================
// Avatar (Supabase Storage — bucket privado `avatars`)
// ============================================================

export const AVATAR_BUCKET = "avatars";
const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Atualiza apenas a referência do avatar no perfil. A identidade é sempre a
 * do próprio usuário (a RLS de `profiles` garante `auth.uid() = id`).
 */
export async function updateAvatarPath(
  userId: string,
  avatarPath: string | null,
): Promise<{ error?: string; profile?: Profile }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ avatar_path: avatarPath })
    .eq("id", userId)
    .select()
    .single();

  if (error) return { error: error.message };
  return { profile: profile as Profile };
}

/**
 * Envia o objeto do avatar para o bucket privado. O binário nunca é gravado no
 * Postgres; apenas a referência é persistida em `profiles.avatar_path`.
 */
export async function uploadAvatarObject(
  path: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    return {
      error: toAppError(error, "Não foi possível enviar a foto.").message,
    };
  }
  return {};
}

export async function removeAvatarObject(
  path: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);

  if (error) {
    return {
      error: toAppError(error, "Não foi possível remover a foto.").message,
    };
  }
  return {};
}

/**
 * Gera uma URL assinada de curta duração para exibição. Retorna `null` quando o
 * objeto não existe ou o usuário não tem permissão (fallback para iniciais).
 */
export async function createAvatarSignedUrl(
  path: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
