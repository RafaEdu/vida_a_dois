-- Migration: Financial onboarding
-- Adds expenses table, monthly_budget to couples, accept/reject RPCs, and RLS

begin;

-- ============================================================
-- ADD monthly_budget TO couples
-- ============================================================

alter table public.couples
  add column if not exists monthly_budget numeric(12,2) not null default 0;

-- ============================================================
-- EXPENSES TABLE
-- ============================================================

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  description text not null,
  amount numeric(12,2) not null,
  category text not null,
  due_date date,
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_expenses_couple_id on public.expenses(couple_id);
create index if not exists idx_expenses_created_by on public.expenses(created_by);
create index if not exists idx_expenses_category on public.expenses(category);
create index if not exists idx_expenses_due_date on public.expenses(due_date);
create index if not exists idx_expenses_paid on public.expenses(paid);

-- ============================================================
-- RPC: ACCEPT INVITATION
-- ============================================================

create or replace function public.accept_invitation(
  p_couple_id uuid,
  p_current_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple record;
begin
  select * into v_couple
  from public.couples
  where id = p_couple_id
    and user_b = p_current_user_id
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

-- ============================================================
-- RPC: REJECT INVITATION
-- ============================================================

create or replace function public.reject_invitation(
  p_couple_id uuid,
  p_current_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.couples
  where id = p_couple_id
    and user_b = p_current_user_id
    and status = 'pending';

  if not found then
    return jsonb_build_object('error', 'Convite nao encontrado.');
  end if;

  return jsonb_build_object('status', 'rejected');
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY for expenses
-- ============================================================

alter table public.expenses enable row level security;

create policy "Couple members can view expenses" on public.expenses
  for select using (
    exists (
      select 1 from public.couples
      where id = expenses.couple_id
        and (user_a = auth.uid() or user_b = auth.uid())
    )
  );

create policy "Couple members can insert expenses" on public.expenses
  for insert with check (
    exists (
      select 1 from public.couples
      where id = expenses.couple_id
        and (user_a = auth.uid() or user_b = auth.uid())
    )
    and created_by = auth.uid()
  );

create policy "Couple members can update expenses" on public.expenses
  for update using (
    exists (
      select 1 from public.couples
      where id = expenses.couple_id
        and (user_a = auth.uid() or user_b = auth.uid())
    )
  );

create policy "Couple members can delete expenses" on public.expenses
  for delete using (
    exists (
      select 1 from public.couples
      where id = expenses.couple_id
        and (user_a = auth.uid() or user_b = auth.uid())
    )
  );

-- ============================================================
-- REALTIME for expenses
-- ============================================================

alter publication supabase_realtime add table public.expenses;

commit;
