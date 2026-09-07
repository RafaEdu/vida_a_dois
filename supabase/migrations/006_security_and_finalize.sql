-- ============================================================
-- Migration 006: Segurança e finalização
-- ============================================================
-- Correções de segurança + geração server-side de invite_code.
-- Idempotente: pode ser aplicada em bancos existentes (drop + create).
-- Conteúdo:
--   1. lookup_partner retorna apenas full_name e exige autenticação
--   2. link_partner usa auth.uid() (remove parâmetro confiado do cliente)
--   3. accept_invitation usa auth.uid()
--   4. reject_invitation usa auth.uid()
--   5. invite_code gerado no servidor (crypto) via trigger
-- ============================================================

begin;

-- -----------------------------------------------------------
-- 1. lookup_partner: apenas nome, apenas autenticado
-- -----------------------------------------------------------
drop function if exists public.lookup_partner(text);

create or replace function public.lookup_partner(p_invite_code text)
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

-- -----------------------------------------------------------
-- 2. link_partner: usa auth.uid()
-- -----------------------------------------------------------
drop function if exists public.link_partner(text, uuid);
drop function if exists public.link_partner(text);

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
  v_user_active_count int;
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

  select count(*) into v_user_active_count
  from public.couples
  where (user_a = v_current_user_id or user_b = v_current_user_id)
    and status = 'active';

  if v_user_active_count > 0 then
    return jsonb_build_object('error', 'Voce ja esta em um casal ativo.');
  end if;

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

  insert into public.couples (user_a, user_b, status)
  values (v_current_user_id, v_partner_id, 'pending');

  return jsonb_build_object('status', 'pending');
end;
$$;

-- -----------------------------------------------------------
-- 3. accept_invitation: usa auth.uid()
-- -----------------------------------------------------------
drop function if exists public.accept_invitation(uuid, uuid);

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

-- -----------------------------------------------------------
-- 4. reject_invitation: usa auth.uid()
-- -----------------------------------------------------------
drop function if exists public.reject_invitation(uuid, uuid);

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

-- -----------------------------------------------------------
-- 5. Geração server-side de invite_code
-- -----------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_uuid text := replace(gen_random_uuid()::text, '-', '');
  v_code text := '';
  v_byte int;
  v_i int;
begin
  for v_i in 1..8 loop
    v_byte := to_number(upper(substr(v_uuid, v_i * 2 - 1, 2)), 'XX')::int;
    v_code := v_code || substr(v_alphabet, 1 + (v_byte % 32), 1);
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

commit;
