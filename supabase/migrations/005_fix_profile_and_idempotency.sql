-- ============================================================
-- Migration 005: Fix RLS on profiles, idempotency for close_month,
-- and add last_closed_month to couples
-- ============================================================

begin;

-- -----------------------------------------------------------
-- 1. CORREÇÃO DE RLS NA TABELA PROFILES
-- -----------------------------------------------------------
-- Remove a política antiga que impedia ler o perfil do parceiro
drop policy if exists "Users can view their own profile" on public.profiles;

-- Nova política: permite ler o proprio perfil OU o perfil do parceiro vinculado
create policy "Users can view own or partner profile"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.couples
      where (user_a = auth.uid() and user_b = profiles.id)
         or (user_b = auth.uid() and user_a = profiles.id)
    )
  );

-- -----------------------------------------------------------
-- 2. COLUNA DE IDEMPOTÊNCIA EM COUPLES
-- -----------------------------------------------------------
alter table public.couples
  add column if not exists last_closed_month varchar(7) null;

-- -----------------------------------------------------------
-- 3. AJUSTE NA RPC close_month COM IDEMPOTÊNCIA
-- -----------------------------------------------------------
create or replace function public.close_month(p_couple_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_member boolean;
  v_current_month varchar(7);
  v_existing_closed varchar(7);
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_total_incomes numeric(12,2);
  v_total_expenses numeric(12,2);
  v_month_balance numeric(12,2);
  v_current_balance numeric(12,2);
  v_new_balance numeric(12,2);
  v_budget numeric(12,2);
begin
  v_current_month := to_char(now(), 'YYYY-MM');

  -- Verifica se o usuário é membro ativo do casal
  select exists (
    select 1 from public.couples
    where id = p_couple_id
      and status = 'active'
      and (user_a = v_user_id or user_b = v_user_id)
  ) into v_is_member;

  if not v_is_member then
    return jsonb_build_object('error', 'Usuário não pertence a este casal.');
  end if;

  -- Verifica idempotência: mês já foi fechado?
  select last_closed_month into v_existing_closed
  from public.couples
  where id = p_couple_id;

  if v_existing_closed = v_current_month then
    return jsonb_build_object('error', 'Este mês já foi fechado e consolidado!');
  end if;

  -- Define o período do mês corrente
  v_month_start := date_trunc('month', now());
  v_month_end := date_trunc('month', now()) + interval '1 month' - interval '1 microsecond';

  -- Soma as receitas do mês
  select coalesce(sum(amount), 0) into v_total_incomes
  from public.incomes
  where couple_id = p_couple_id
    and received_at >= v_month_start
    and received_at <= v_month_end;

  -- Soma as despesas do mês (usa due_date ou created_at)
  select coalesce(sum(amount), 0) into v_total_expenses
  from public.expenses
  where couple_id = p_couple_id
    and ((due_date is not null and due_date >= v_month_start::date and due_date <= v_month_end::date)
         or (due_date is null and created_at >= v_month_start and created_at <= v_month_end));

  -- Calcula o saldo do mês (receitas - despesas)
  v_month_balance := v_total_incomes - v_total_expenses;

  -- Obtém o saldo atual do caixa comum e o orçamento
  select shared_balance, monthly_budget into v_current_balance, v_budget
  from public.couples
  where id = p_couple_id;

  -- Novo saldo: acumula o saldo do mês no caixa comum
  v_new_balance := v_current_balance + v_month_balance;

  -- Atualiza o shared_balance e grava o mês fechado
  update public.couples
  set shared_balance = v_new_balance,
      last_closed_month = v_current_month
  where id = p_couple_id;

  return jsonb_build_object(
    'success', true,
    'total_incomes', v_total_incomes,
    'total_expenses', v_total_expenses,
    'month_balance', v_month_balance,
    'previous_balance', v_current_balance,
    'new_shared_balance', v_new_balance,
    'monthly_budget', v_budget,
    'last_closed_month', v_current_month
  );
end;
$$;

commit;
