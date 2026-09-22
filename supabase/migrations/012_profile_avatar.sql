-- ============================================================
-- Migration 012: Perfil — avatar no Storage (Fase 2)
-- ============================================================
-- Objetivo: permitir avatar real na área individual sem gravar binário/base64
-- no Postgres. O perfil guarda apenas a referência (`avatar_path`) do objeto no
-- bucket privado `avatars`; nenhuma migration anterior é reescrita.
--
-- Escopo:
--   A. `profiles.avatar_path` (referência, não URL pública permanente).
--   B. `partner_profiles` passa a expor `avatar_path` do parceiro.
--   C. Bucket privado `avatars` + policies de Storage:
--        - cada usuário altera/remove apenas o próprio avatar (prefixo do path);
--        - leitura permitida ao dono e ao parceiro com vínculo `active`.
--   D. Helper `is_active_partner(text)` para a leitura do parceiro ativo.
--
-- Estratégia conservadora (seção 9 do PLANO.md): adiciona coluna e bucket sem
-- remover nada; a leitura do objeto é restrita por RLS, então o parceiro em
-- `pending`/`ended` continua sem acesso à imagem (apenas fallback de iniciais).

begin;

-- ============================================================
-- PARTE A — Referência do avatar no perfil
-- ============================================================

alter table public.profiles
  add column if not exists avatar_path text;

-- ============================================================
-- PARTE B — View limitada do parceiro expõe o avatar
-- ============================================================
-- Apenas o path é exposto; a leitura do objeto real é decidida pela policy de
-- Storage abaixo (dono ou parceiro `active`).

create or replace view public.partner_profiles
with (security_invoker = false)
as
select
  c.id as couple_id,
  p.id,
  p.full_name,
  case
    when c.status = 'active' then p.monthly_income
    else null
  end as monthly_income,
  p.avatar_path
from public.couples c
join public.profiles p
  on (c.user_a = auth.uid() and p.id = c.user_b)
  or (c.user_b = auth.uid() and p.id = c.user_a);

revoke all on public.partner_profiles from public;
revoke all on public.partner_profiles from anon;
grant select on public.partner_profiles to authenticated;

-- ============================================================
-- PARTE C — Helper: solicitante compartilha vínculo ativo com o dono?
-- ============================================================

create or replace function public.is_active_partner(p_owner text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.couples c
    where c.status = 'active'
      and (
        (c.user_a = auth.uid() and c.user_b::text = p_owner)
        or (c.user_b = auth.uid() and c.user_a::text = p_owner)
      )
  );
$$;

revoke execute on function public.is_active_partner(text) from public;
revoke execute on function public.is_active_partner(text) from anon;
grant execute on function public.is_active_partner(text) to authenticated;

-- ============================================================
-- PARTE D — Bucket privado e policies de Storage
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

-- Leitura: dono do prefixo ou parceiro com vínculo ativo.
drop policy if exists "avatars_select_own_or_active_partner" on storage.objects;
create policy "avatars_select_own_or_active_partner"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_active_partner((storage.foldername(name))[1])
    )
  );

-- Escrita: somente no próprio prefixo (`{user_id}/...`).
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
