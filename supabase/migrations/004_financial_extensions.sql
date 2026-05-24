-- ============================================================
-- Migração 004: Extensões financeiras
-- ============================================================
-- Novas features:
-- 1. paid_by e is_recurring na tabela expenses
-- 2. Tabela incomes (receitas extras)
-- 3. shared_balance na tabela couples (caixa comum)
-- 4. Cálculo automático proporcional de split_ratio
-- ============================================================

-- -----------------------------------------------------------
-- 1. Alteração em public.expenses
-- -----------------------------------------------------------
alter table public.expenses
  add column if not exists paid_by uuid references public.profiles(id) on delete cascade,
  add column if not exists is_recurring boolean not null default false;

create index if not exists idx_expenses_paid_by
  on public.expenses(paid_by);

create index if not exists idx_expenses_is_recurring
  on public.expenses(is_recurring)
  where is_recurring = true;

-- -----------------------------------------------------------
-- 2. Nova Tabela de Receitas (public.incomes)
-- -----------------------------------------------------------
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  is_extra boolean not null default true,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_incomes_couple_id
  on public.incomes(couple_id);

create index if not exists idx_incomes_user_id
  on public.incomes(user_id);

create index if not exists idx_incomes_received_at
  on public.incomes(received_at);

-- RLS para incomes
alter table public.incomes enable row level security;

drop policy if exists "incomes_select" on public.incomes;
create policy "incomes_select" on public.incomes
  for select
  using (
    exists (
      select 1 from public.couples c
      where c.id = incomes.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "incomes_insert" on public.incomes;
create policy "incomes_insert" on public.incomes
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.couples c
      where c.id = incomes.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "incomes_update" on public.incomes;
create policy "incomes_update" on public.incomes
  for update
  using (
    exists (
      select 1 from public.couples c
      where c.id = incomes.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.couples c
      where c.id = incomes.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "incomes_delete" on public.incomes;
create policy "incomes_delete" on public.incomes
  for delete
  using (
    exists (
      select 1 from public.couples c
      where c.id = incomes.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Adiciona incomes à publicação de realtime
alter publication supabase_realtime add table public.incomes;

-- -----------------------------------------------------------
-- 3. Caixa Comum (shared_balance em couples)
-- -----------------------------------------------------------
alter table public.couples
  add column if not exists shared_balance numeric(12,2) not null default 0.00;

-- -----------------------------------------------------------
-- 4. Função e Trigger para Cálculo Automático do Split Ratio
-- -----------------------------------------------------------

-- Função que calcula o split ratio com base no monthly_income dos dois usuários
create or replace function public.calculate_split_ratio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_income_a numeric(12,2);
  v_income_b numeric(12,2);
  v_ratio_a numeric(5,2);
begin
  -- Busca os rendimentos mensais de ambos os usuários
  select monthly_income into v_income_a
  from public.profiles
  where id = new.user_a;

  select monthly_income into v_income_b
  from public.profiles
  where id = new.user_b;

  -- Se ambos tiverem renda definida, calcula a proporção
  if v_income_a is not null and v_income_b is not null
     and (v_income_a + v_income_b) > 0 then
    v_ratio_a := round((v_income_a / (v_income_a + v_income_b)) * 100, 2);
    new.split_ratio_a := v_ratio_a;
    new.split_ratio_b := 100.00 - v_ratio_a;
  end if;

  return new;
end;
$$;

-- Trigger que dispara ao inserir ou atualizar couples (quando status muda para 'active')
drop trigger if exists trg_calculate_split_on_insert on public.couples;
create trigger trg_calculate_split_on_insert
  before insert or update on public.couples
  for each row
  when (new.status = 'active')
  execute function public.calculate_split_ratio();

-- Função disparada quando um perfil atualiza seu monthly_income
create or replace function public.recalculate_split_on_income_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple record;
  v_income_a numeric(12,2);
  v_income_b numeric(12,2);
  v_ratio_a numeric(5,2);
begin
  -- Se o monthly_income não mudou, não faz nada
  if old.monthly_income is not distinct from new.monthly_income then
    return new;
  end if;

  -- Para cada casal ativo onde este usuário é membro, recalcula o split
  for v_couple in
    select * from public.couples
    where status = 'active'
      and (user_a = new.id or user_b = new.id)
  loop
    select monthly_income into v_income_a
    from public.profiles where id = v_couple.user_a;

    select monthly_income into v_income_b
    from public.profiles where id = v_couple.user_b;

    if v_income_a is not null and v_income_b is not null
       and (v_income_a + v_income_b) > 0 then
      v_ratio_a := round((v_income_a / (v_income_a + v_income_b)) * 100, 2);

      update public.couples
      set split_ratio_a = v_ratio_a,
          split_ratio_b = 100.00 - v_ratio_a
      where id = v_couple.id;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_recalc_split_on_income_change on public.profiles;
create trigger trg_recalc_split_on_income_change
  after update on public.profiles
  for each row
  when (old.monthly_income is distinct from new.monthly_income)
  execute function public.recalculate_split_on_income_change();

-- -----------------------------------------------------------
-- 5. Função RPC para Fechamento do Mês
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
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_total_incomes numeric(12,2);
  v_total_expenses numeric(12,2);
  v_month_balance numeric(12,2);
  v_current_balance numeric(12,2);
  v_new_balance numeric(12,2);
  v_budget numeric(12,2);
begin
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

  -- Atualiza o shared_balance
  update public.couples
  set shared_balance = v_new_balance
  where id = p_couple_id;

  return jsonb_build_object(
    'success', true,
    'total_incomes', v_total_incomes,
    'total_expenses', v_total_expenses,
    'month_balance', v_month_balance,
    'previous_balance', v_current_balance,
    'new_shared_balance', v_new_balance,
    'monthly_budget', v_budget
  );
end;
$$;

-- -----------------------------------------------------------
-- 6. Atualização da política RLS de expenses para incluir paid_by
-- (já existem políticas; apenas garantimos que o insert permita paid_by)
-- As políticas existentes já cobrem o CRUD por membresia do casal.
-- O campo paid_by é validado pela FK reference.
-- -----------------------------------------------------------
