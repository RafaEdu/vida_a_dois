-- ============================================================
-- Migration 015: Fechamento mensal imutável e histórico (Fase 7)
-- ============================================================
-- Objetivo: transformar o fechamento mensal em um snapshot financeiro
-- auditável e impedir que um mês já consolidado seja alterado silenciosamente
-- por INSERT/UPDATE/DELETE de despesas/receitas.
--
-- Escopo:
--   A. Tabela public.monthly_closings
--      - unique (couple_id, year_month);
--      - leitura pelos participantes (inclusive vínculo `ended`);
--      - escrita somente pela RPC de fechamento (security definer);
--      - sem UPDATE/DELETE comum.
--   B. RPC close_month evoluída: transacional, com lock de concorrência,
--      snapshot, atualização de shared_balance/last_closed_month e idempotente.
--   C. Imutabilidade no banco para despesas/receitas de meses fechados.
--   E. Reabertura fica explicitamente fora desta migration (ver PLANO.md).
--
-- Regra de mês (única no banco e igual ao selector da UI):
--   despesa: due_date quando existir; senão created_at.
--   receita: received_at.
--
-- Estratégia conservadora (seção 9 do PLANO.md): nenhuma migration anterior é
-- reescrita; nenhum dado é apagado; a tabela nasce vazia e o histórico só passa
-- a existir a partir dos novos fechamentos. O last_closed_month existente é
-- respeitado para não duplicar saldo em fechamentos anteriores a esta migration.

begin;

-- ============================================================
-- PARTE A — Tabela de snapshots de fechamento
-- ============================================================

create table if not exists public.monthly_closings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  year_month varchar(7) not null,
  total_incomes numeric(12,2) not null default 0,
  total_expenses numeric(12,2) not null default 0,
  monthly_budget numeric(12,2) not null default 0,
  split_ratio_a numeric(5,2) not null default 50,
  split_ratio_b numeric(5,2) not null default 50,
  shared_balance_before numeric(12,2) not null default 0,
  month_delta numeric(12,2) not null default 0,
  shared_balance_after numeric(12,2) not null default 0,
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz not null default now(),
  constraint monthly_closings_couple_month_unique
    unique (couple_id, year_month),
  constraint monthly_closings_year_month_format
    check (year_month ~ '^[0-9]{4}-[0-9]{2}$')
);

create index if not exists idx_monthly_closings_couple_id
  on public.monthly_closings(couple_id);

create index if not exists idx_monthly_closings_couple_month
  on public.monthly_closings(couple_id, year_month desc);

alter table public.monthly_closings enable row level security;

-- Participantes do vínculo (qualquer estado) leem o próprio histórico.
drop policy if exists "monthly_closings_select_members"
  on public.monthly_closings;
create policy "monthly_closings_select_members"
  on public.monthly_closings
  for select
  using (
    exists (
      select 1
      from public.couples c
      where c.id = monthly_closings.couple_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Nenhuma policy de INSERT/UPDATE/DELETE: somente a RPC `security definer`
-- grava snapshots. Reforça os grants para o cliente autenticado.
revoke all on public.monthly_closings from anon;
revoke insert, update, delete on public.monthly_closings from authenticated;
grant select on public.monthly_closings to authenticated;

-- ============================================================
-- PARTE B — RPC close_month com snapshot e idempotência
-- ============================================================
-- Substitui a versão de 005. A assinatura é preservada para não quebrar o
-- cliente, mas a função passa a:
--   1. derivar o executor de auth.uid();
--   2. localizar e bloquear (for update) o vínculo ativo do casal;
--   3. gravar um snapshot em monthly_closings (unique por casal/mês);
--   4. atualizar shared_balance e last_closed_month na mesma transação;
--   5. devolver o fechamento criado (ou o existente, sem duplicar saldo).

create or replace function public.close_month(p_couple_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple public.couples%rowtype;
  v_closed_at timestamptz := now();
  v_current_month varchar(7);
  v_existing public.monthly_closings%rowtype;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_total_incomes numeric(12,2);
  v_total_expenses numeric(12,2);
  v_month_delta numeric(12,2);
  v_new_balance numeric(12,2);
  v_closing public.monthly_closings%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  -- Localiza e bloqueia o vínculo ativo. O lock serializa fechamentos
  -- concorrentes do mesmo casal.
  select c.* into v_couple
  from public.couples c
  where c.id = p_couple_id
    and c.status = 'active'
    and (c.user_a = v_user_id or c.user_b = v_user_id)
  for update;

  if not found then
    return jsonb_build_object('error', 'Usuario nao pertence a este casal.');
  end if;

  v_current_month := to_char(v_closed_at, 'YYYY-MM');

  -- Idempotência: se o snapshot do mês já existe, devolve o fechamento atual.
  select mc.* into v_existing
  from public.monthly_closings mc
  where mc.couple_id = p_couple_id
    and mc.year_month = v_current_month
  limit 1;

  if found then
    return jsonb_build_object(
      'success', true,
      'already_closed', true,
      'id', v_existing.id,
      'year_month', v_existing.year_month,
      'total_incomes', v_existing.total_incomes,
      'total_expenses', v_existing.total_expenses,
      'monthly_budget', v_existing.monthly_budget,
      'split_ratio_a', v_existing.split_ratio_a,
      'split_ratio_b', v_existing.split_ratio_b,
      'shared_balance_before', v_existing.shared_balance_before,
      'month_delta', v_existing.month_delta,
      'shared_balance_after', v_existing.shared_balance_after,
      'closed_by', v_existing.closed_by,
      'closed_at', v_existing.closed_at,
      'last_closed_month', v_current_month
    );
  end if;

  -- Fechamentos anteriores a esta migration só tinham last_closed_month. Sem
  -- snapshot não é seguro recalcular o mês; mantém o comportamento antigo para
  -- não somar o saldo duas vezes.
  if v_couple.last_closed_month = v_current_month then
    return jsonb_build_object('error', 'Este mes ja foi fechado e consolidado.');
  end if;

  v_month_start := date_trunc('month', v_closed_at);
  v_month_end :=
    date_trunc('month', v_closed_at) + interval '1 month' - interval '1 microsecond';

  select coalesce(sum(amount), 0) into v_total_incomes
  from public.incomes
  where couple_id = p_couple_id
    and received_at >= v_month_start
    and received_at <= v_month_end;

  select coalesce(sum(amount), 0) into v_total_expenses
  from public.expenses
  where couple_id = p_couple_id
    and (
      (due_date is not null
        and due_date >= v_month_start::date
        and due_date <= v_month_end::date)
      or (due_date is null
        and created_at >= v_month_start
        and created_at <= v_month_end)
    );

  v_month_delta := v_total_incomes - v_total_expenses;
  v_new_balance := v_couple.shared_balance + v_month_delta;

  insert into public.monthly_closings (
    couple_id,
    year_month,
    total_incomes,
    total_expenses,
    monthly_budget,
    split_ratio_a,
    split_ratio_b,
    shared_balance_before,
    month_delta,
    shared_balance_after,
    closed_by,
    closed_at
  )
  values (
    p_couple_id,
    v_current_month,
    v_total_incomes,
    v_total_expenses,
    v_couple.monthly_budget,
    v_couple.split_ratio_a,
    v_couple.split_ratio_b,
    v_couple.shared_balance,
    v_month_delta,
    v_new_balance,
    v_user_id,
    v_closed_at
  )
  returning * into v_closing;

  update public.couples
  set shared_balance = v_new_balance,
      last_closed_month = v_current_month
  where id = p_couple_id;

  return jsonb_build_object(
    'success', true,
    'already_closed', false,
    'id', v_closing.id,
    'year_month', v_closing.year_month,
    'total_incomes', v_closing.total_incomes,
    'total_expenses', v_closing.total_expenses,
    'monthly_budget', v_closing.monthly_budget,
    'split_ratio_a', v_closing.split_ratio_a,
    'split_ratio_b', v_closing.split_ratio_b,
    'shared_balance_before', v_closing.shared_balance_before,
    'month_delta', v_closing.month_delta,
    'shared_balance_after', v_closing.shared_balance_after,
    'closed_by', v_closing.closed_by,
    'closed_at', v_closing.closed_at,
    'last_closed_month', v_current_month
  );
end;
$$;

revoke all on function public.close_month(uuid) from public;
revoke all on function public.close_month(uuid) from anon;
grant execute on function public.close_month(uuid) to authenticated;

-- ============================================================
-- PARTE C — Imutabilidade de meses fechados
-- ============================================================
-- Bloqueia INSERT/UPDATE/DELETE de despesas/receitas cujo mês (na regra única
-- acima) já possui snapshot em monthly_closings. Em UPDATE, tanto o mês antigo
-- quanto o novo são verificados, impedindo também "mover" um lançamento para
-- fora/junto de um mês fechado.

create or replace function public.enforce_closed_month_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_couple uuid;
  v_old_month text;
  v_new_couple uuid;
  v_new_month text;
  v_has_old boolean := (tg_op <> 'INSERT');
  v_has_new boolean := (tg_op <> 'DELETE');
begin
  if v_has_new then
    v_new_couple := new.couple_id;
    if tg_table_name = 'expenses' then
      v_new_month := to_char(
        coalesce(new.due_date::timestamptz, new.created_at),
        'YYYY-MM'
      );
    else
      v_new_month := to_char(new.received_at, 'YYYY-MM');
    end if;
  end if;

  if v_has_old then
    v_old_couple := old.couple_id;
    if tg_table_name = 'expenses' then
      v_old_month := to_char(
        coalesce(old.due_date::timestamptz, old.created_at),
        'YYYY-MM'
      );
    else
      v_old_month := to_char(old.received_at, 'YYYY-MM');
    end if;
  end if;

  if v_has_new and exists (
    select 1
    from public.monthly_closings mc
    where mc.couple_id = v_new_couple
      and mc.year_month = v_new_month
  ) then
    raise exception 'O mes % ja foi fechado e nao pode ser alterado.', v_new_month
      using errcode = '23514';
  end if;

  if v_has_old and exists (
    select 1
    from public.monthly_closings mc
    where mc.couple_id = v_old_couple
      and mc.year_month = v_old_month
  ) then
    raise exception 'O mes % ja foi fechado e nao pode ser alterado.', v_old_month
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_closed_month_immutable() from public, anon;

drop trigger if exists trg_expenses_block_closed_month on public.expenses;
create trigger trg_expenses_block_closed_month
  before insert or update or delete on public.expenses
  for each row
  execute function public.enforce_closed_month_immutable();

drop trigger if exists trg_incomes_block_closed_month on public.incomes;
create trigger trg_incomes_block_closed_month
  before insert or update or delete on public.incomes
  for each row
  execute function public.enforce_closed_month_immutable();

commit;
