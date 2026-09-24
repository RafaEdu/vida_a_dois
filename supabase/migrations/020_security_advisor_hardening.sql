-- ============================================================
-- Migration 020: Correções do Security Advisor
-- ============================================================
-- Corrige os achados exportados pelo Security Advisor do Supabase:
--
--   ERROR  security_definer_view            (lint 0010)
--          view `public.partner_profiles` definida como SECURITY DEFINER.
--   WARN   anon_security_definer_function_executable      (lint 0028)
--   WARN   authenticated_security_definer_function_executable (lint 0029)
--          funções SECURITY DEFINER executáveis por `anon`/`authenticated`.
--
-- Causa raiz dos grants de `anon`: o Supabase concede EXECUTE a `anon` e
-- `authenticated` por default privileges. Por isso `revoke ... from public`
-- (usado até a 019) não remove o grant explícito a `anon`; é preciso revogar
-- nominalmente. Funções de trigger/internas não devem ser chamáveis pela API;
-- RPCs públicas permanecem executáveis apenas por `authenticated`.
--
-- Reconciliamos a migration 006, que nunca foi executada no remoto: drop das
-- assinaturas antigas de convite `(uuid, uuid)` / `(text, uuid)`, recriação das
-- canônicas derivando identidade de `auth.uid()` e restauração da geração
-- server-side de `invite_code` (`generate_invite_code`/`set_invite_code_on_insert`).
--
-- Fora do escopo de migration (configuração de Auth/Dashboard):
--   auth_leaked_password_protection — habilitar "Leaked password protection".

begin;

-- ============================================================
-- PARTE 1 — View partner_profiles sem SECURITY DEFINER (lint 0010)
-- ============================================================
-- Uma view SECURITY DEFINER ignora a RLS do usuário consultante. Para manter o
-- recorte limitado (sem abrir a linha completa de `profiles`, que tem
-- `birth_date`/`invite_code`), a leitura passa por uma função SECURITY DEFINER
-- restrita, exposta por uma view `security_invoker`. A identidade continua
-- vindo de `auth.uid()` e só colunas não sensíveis são devolvidas.

create or replace function public.get_partner_profiles()
returns table (
  couple_id uuid,
  id uuid,
  full_name text,
  monthly_income numeric(12,2),
  avatar_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id as couple_id,
    p.id as id,
    p.full_name as full_name,
    case
      when c.status = 'active' then p.monthly_income
      else null
    end as monthly_income,
    p.avatar_path as avatar_path
  from public.couples c
  join public.profiles p
    on (c.user_a = auth.uid() and p.id = c.user_b)
    or (c.user_b = auth.uid() and p.id = c.user_a);
$$;

drop view if exists public.partner_profiles;

create view public.partner_profiles
with (security_invoker = true)
as
select couple_id, id, full_name, monthly_income, avatar_path
from public.get_partner_profiles();

revoke all on function public.get_partner_profiles() from public, anon;
grant execute on function public.get_partner_profiles() to authenticated;

revoke all on public.partner_profiles from public, anon;
grant select on public.partner_profiles to authenticated;

-- ============================================================
-- PARTE 2 — Reconciliação das RPCs de convite (migration 006)
-- ============================================================
-- As versões antigas confiavam em `p_current_user_id` vindo do cliente (e o
-- lookup devolvia o `id` do perfil). São removidas; as canônicas derivam a
-- identidade de `auth.uid()`.

drop function if exists public.link_partner(text, uuid);
drop function if exists public.accept_invitation(uuid, uuid);
drop function if exists public.reject_invitation(uuid, uuid);

-- lookup_partner: apenas `full_name` e exige autenticação.
drop function if exists public.lookup_partner(text);

create function public.lookup_partner(p_invite_code text)
returns table(full_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
    select p.full_name
    from public.profiles p
    where p.invite_code = upper(p_invite_code);
end;
$$;

-- link_partner: usa `auth.uid()` (versão canônica da migration 010).
create or replace function public.link_partner(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_partner_id uuid;
  v_existing_couple record;
  v_open_count int;
begin
  if v_current_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  select p.id into v_partner_id
  from public.profiles p
  where p.invite_code = upper(p_invite_code);

  if v_partner_id is null then
    return jsonb_build_object('error', 'Codigo invalido. Verifique e tente novamente.');
  end if;

  if v_partner_id = v_current_user_id then
    return jsonb_build_object('error', 'Voce nao pode se vincular com voce mesmo.');
  end if;

  -- Confirmação mútua: se já existe um convite pendente entre o par, ativa-o.
  select * into v_existing_couple
  from public.couples
  where ((user_a = v_current_user_id and user_b = v_partner_id)
      or (user_a = v_partner_id and user_b = v_current_user_id))
    and status = 'pending';

  if found then
    update public.couples
    set status = 'active', linked_at = now()
    where id = v_existing_couple.id;

    update public.profiles
    set invite_code = null
    where id in (v_current_user_id, v_partner_id);

    return jsonb_build_object('status', 'active');
  end if;

  select * into v_existing_couple
  from public.couples
  where ((user_a = v_current_user_id and user_b = v_partner_id)
      or (user_a = v_partner_id and user_b = v_current_user_id))
    and status = 'active';

  if found then
    return jsonb_build_object('status', 'already_linked');
  end if;

  select count(*) into v_open_count
  from public.couples
  where (user_a = v_current_user_id or user_b = v_current_user_id)
    and status in ('pending', 'active');

  if v_open_count > 0 then
    return jsonb_build_object('error', 'Voce ja possui um vinculo aberto.');
  end if;

  select count(*) into v_open_count
  from public.couples
  where (user_a = v_partner_id or user_b = v_partner_id)
    and status in ('pending', 'active');

  if v_open_count > 0 then
    return jsonb_build_object('error', 'Seu parceiro ja possui um vinculo aberto.');
  end if;

  insert into public.couples (user_a, user_b, status)
  values (v_current_user_id, v_partner_id, 'pending');

  return jsonb_build_object('status', 'pending');
end;
$$;

-- accept_invitation: usa `auth.uid()` (versão canônica da migration 006).
create or replace function public.accept_invitation(p_couple_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_couple record;
begin
  if v_current_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  select * into v_couple
  from public.couples
  where id = p_couple_id
    and user_b = v_current_user_id
    and status = 'pending';

  if not found then
    return jsonb_build_object('error', 'Convite nao encontrado.');
  end if;

  update public.couples
  set status = 'active', linked_at = now()
  where id = p_couple_id;

  update public.profiles
  set invite_code = null
  where id in (v_couple.user_a, v_couple.user_b);

  return jsonb_build_object('status', 'active');
end;
$$;

-- reject_invitation: usa `auth.uid()` (versão canônica da migration 006).
create or replace function public.reject_invitation(p_couple_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
begin
  if v_current_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  delete from public.couples
  where id = p_couple_id
    and user_b = v_current_user_id
    and status = 'pending';

  if not found then
    return jsonb_build_object('error', 'Convite nao encontrado.');
  end if;

  return jsonb_build_object('status', 'rejected');
end;
$$;

-- Geração server-side de invite_code (migration 006). Ausente no remoto
-- porque a 006 nunca foi executada de fato; sem ela o trigger de perfil e a
-- rotação de códigos (end_relationship) não funcionam.
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_hex text := replace(gen_random_uuid()::text, '-', '');
  v_code text := '';
  v_i int;
begin
  for v_i in 1..8 loop
    v_code := v_code || substr(
      v_alphabet,
      1 + (('x' || substr(v_hex, v_i * 2 - 1, 2))::bit(8)::int % 32),
      1
    );
  end loop;
  return v_code;
end;
$$;

create or replace function public.set_invite_code_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invite_code is null or new.invite_code = '' then
    new.invite_code := public.generate_invite_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_invite_code on public.profiles;
create trigger trg_profiles_invite_code
  before insert on public.profiles
  for each row
  execute function public.set_invite_code_on_insert();

-- Backfill de perfis sem código: o trigger só cobre INSERT e o app usa upsert.
do $$
declare
  r record;
  v_code text;
  v_attempt int;
begin
  for r in select id from public.profiles where invite_code is null loop
    v_attempt := 0;
    loop
      v_code := public.generate_invite_code();
      exit when not exists (
        select 1 from public.profiles
        where invite_code = v_code and id <> r.id
      );
      v_attempt := v_attempt + 1;
      if v_attempt >= 20 then
        raise exception 'Nao foi possivel gerar invite_code unico para o perfil %', r.id;
      end if;
    end loop;

    update public.profiles set invite_code = v_code where id = r.id;
  end loop;
end;
$$;

-- ============================================================
-- PARTE 3 — Grants das RPCs públicas (apenas authenticated)
-- ============================================================
-- Revoga nominalmente de `anon` (os grants de `public` sozinhos não bastam) e
-- confirma o acesso de `authenticated`. Idempotente.

revoke all on function public.lookup_partner(text) from public, anon;
grant execute on function public.lookup_partner(text) to authenticated;

revoke all on function public.link_partner(text) from public, anon;
grant execute on function public.link_partner(text) to authenticated;

revoke all on function public.accept_invitation(uuid) from public, anon;
grant execute on function public.accept_invitation(uuid) to authenticated;

revoke all on function public.reject_invitation(uuid) from public, anon;
grant execute on function public.reject_invitation(uuid) to authenticated;

revoke all on function public.close_month(uuid) from public, anon;
grant execute on function public.close_month(uuid) to authenticated;

revoke all on function public.mark_expense_paid(uuid, uuid) from public, anon;
grant execute on function public.mark_expense_paid(uuid, uuid) to authenticated;

revoke all on function public.end_relationship() from public, anon;
grant execute on function public.end_relationship() to authenticated;

revoke all on function public.update_recurrence_series(uuid, text, text, numeric)
  from public, anon;
grant execute on function public.update_recurrence_series(uuid, text, text, numeric)
  to authenticated;

revoke all on function public.set_recurrence_series_active(uuid, boolean)
  from public, anon;
grant execute on function public.set_recurrence_series_active(uuid, boolean)
  to authenticated;

revoke all on function public.end_recurrence_series(uuid) from public, anon;
grant execute on function public.end_recurrence_series(uuid) to authenticated;

-- Helper das policies de Storage: executado como o usuário consultante.
revoke all on function public.is_active_partner(text) from public, anon;
grant execute on function public.is_active_partner(text) to authenticated;

-- ============================================================
-- PARTE 4 — Funções de trigger/internas sem acesso pela API
-- ============================================================
-- Triggers não dependem de EXECUTE do usuário que dispara o DML; revogar de
-- `authenticated` fecha o endpoint /rest/v1/rpc/<nome> sem afetar as triggers.

revoke all on function public.validate_expense_paid_by() from public, anon, authenticated;
revoke all on function public.enforce_single_open_couple() from public, anon, authenticated;
revoke all on function public.calculate_split_ratio() from public, anon, authenticated;
revoke all on function public.recalculate_split_on_income_change() from public, anon, authenticated;
revoke all on function public.enforce_closed_month_immutable() from public, anon, authenticated;
revoke all on function public.set_expense_recurrence_series() from public, anon, authenticated;
revoke all on function public.set_category_budgets_updated_at() from public, anon, authenticated;
revoke all on function public.set_financial_goals_updated_at() from public, anon, authenticated;
revoke all on function public.set_notification_preferences_updated_at() from public, anon, authenticated;
revoke all on function public.set_invite_code_on_insert() from public, anon, authenticated;
revoke all on function public.generate_invite_code() from public, anon, authenticated;

revoke all on function public.log_expense_paid_activity() from public, anon, authenticated;
revoke all on function public.log_month_closed_activity() from public, anon, authenticated;
revoke all on function public.log_category_budget_activity() from public, anon, authenticated;
revoke all on function public.log_couple_plan_activity() from public, anon, authenticated;
revoke all on function public.log_goal_completed_activity() from public, anon, authenticated;
revoke all on function public.log_relationship_ended_activity() from public, anon, authenticated;

revoke all on function public.record_couple_activity(uuid, text, text, uuid, jsonb)
  from public, anon, authenticated;

revoke all on function public.rotate_couple_invite_codes(uuid) from public, anon, authenticated;

commit;
