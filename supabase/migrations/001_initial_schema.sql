-- Migration: Initial schema for Vida a Dois
-- Creates profiles table (extending Supabase Auth), couples table, RPC functions, and RLS policies

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  birth_date date,
  monthly_income numeric(12,2),
  invite_code char(8) unique,
  created_at timestamptz not null default now()
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.profiles(id) on delete cascade not null,
  user_b uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'active')) default 'pending',
  split_ratio_a numeric(5,2) not null default 50.00,
  split_ratio_b numeric(5,2) not null default 50.00,
  created_at timestamptz not null default now(),
  linked_at timestamptz,
  constraint couples_unique_pair unique (user_a, user_b),
  constraint couples_no_same_user check (user_a <> user_b)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_profiles_invite_code on public.profiles(invite_code) where invite_code is not null;
create index if not exists idx_couples_user_a on public.couples(user_a);
create index if not exists idx_couples_user_b on public.couples(user_b);
create index if not exists idx_couples_status on public.couples(status);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Look up a partner profile by invite code (for linking flow)
-- Only returns minimal info; only works for profiles that are complete (have invite_code)
create or replace function public.lookup_partner(p_invite_code text)
returns table(id uuid, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select p.id, p.full_name
  from public.profiles p
  where p.invite_code = upper(p_invite_code);
end;
$$;

-- Link partners: handles the mutual confirmation logic
create or replace function public.link_partner(
  p_invite_code text,
  p_current_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner_id uuid;
  v_existing_couple record;
  v_user_active_count int;
begin
  -- Look up the partner by invite code
  select p.id into v_partner_id
  from public.profiles p
  where p.invite_code = upper(p_invite_code);

  if v_partner_id is null then
    return jsonb_build_object('error', 'Codigo invalido. Verifique e tente novamente.');
  end if;

  if v_partner_id = p_current_user_id then
    return jsonb_build_object('error', 'Voce nao pode se vincular com voce mesmo.');
  end if;

  -- Check if current user is already in an active couple
  select count(*) into v_user_active_count
  from public.couples
  where (user_a = p_current_user_id or user_b = p_current_user_id)
    and status = 'active';

  if v_user_active_count > 0 then
    return jsonb_build_object('error', 'Voce ja esta em um casal ativo.');
  end if;

  -- Look for existing pending couple between these two users
  select * into v_existing_couple
  from public.couples
  where ((user_a = p_current_user_id and user_b = v_partner_id)
      or (user_a = v_partner_id and user_b = p_current_user_id))
    and status = 'pending';

  if found then
    -- Mutual confirmation: update to active
    update public.couples
    set status = 'active',
        linked_at = now()
    where id = v_existing_couple.id;

    -- Deactivate invite codes for both users
    update public.profiles
    set invite_code = null
    where id in (p_current_user_id, v_partner_id);

    return jsonb_build_object('status', 'active');
  end if;

  -- Check if there's already an active couple
  select * into v_existing_couple
  from public.couples
  where ((user_a = p_current_user_id and user_b = v_partner_id)
      or (user_a = v_partner_id and user_b = p_current_user_id))
    and status = 'active';

  if found then
    return jsonb_build_object('status', 'already_linked');
  end if;

  -- Create new pending couple
  insert into public.couples (user_a, user_b, status)
  values (p_current_user_id, v_partner_id, 'pending');

  return jsonb_build_object('status', 'pending');
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.couples enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Couples policies
create policy "Users can view their own couples"
  on public.couples for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can insert their own couples"
  on public.couples for insert
  with check (auth.uid() = user_a);

create policy "Users can update their own couples"
  on public.couples for update
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table public.couples;
