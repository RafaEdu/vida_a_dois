-- ============================================================
-- Migration 009: Invariantes financeiras e RLS (Fase 0)
-- ============================================================
-- Objetivo: eliminar diferenças entre o que a UI permite e o que o banco
-- aceita. Nenhuma migration anterior é reescrita.
--
-- Escopo:
--   A. RLS de expenses/incomes e escrita financeira somente em vínculo ativo.
--   B. amount > 0 em expenses (incomes já possui essa constraint desde 004).
--   C. paid_by, quando preenchido, pertence ao casal da despesa.
--   D. profiles: cada usuário lê o próprio perfil; o parceiro passa a ser
--      exposto por uma view limitada (partner_profiles), respeitando o estado
--      do vínculo e sem abrir a linha completa de um usuário arbitrário.
--
-- Estratégia conservadora (seção 9 do PLANO.md): nada de deleção de dados.
-- Constraints entram como NOT VALID e só são validadas quando não existem
-- registros inválidos; quando existirem, a migration emite WARNING e mantém a
-- constraint aplicada apenas para escritas novas.

begin;

-- ============================================================
-- PARTE A — RLS financeira
-- ============================================================

-- expenses: `pending` não acessa; `active` lê e escreve.
-- As policies antigas validavam apenas a membresia (qualquer status) e a
-- autorização do INSERT usava o couple_id/created_by enviados pelo cliente
-- sem exigir vínculo ativo.
drop policy if exists "Couple members can view expenses" on public.expenses;
drop policy if exists "Couple members can insert expenses" on public.expenses;
drop policy if exists "Couple members can update expenses" on public.expenses;
drop policy if exists "Couple members can delete expenses" on public.expenses;

create policy "expenses_select_active_members"
  on public.expenses for select
  using (
    exists (
      select 1 from public.couples c
      where c.id = expenses.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "expenses_insert_active_members"
  on public.expenses for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.couples c
      where c.id = expenses.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "expenses_update_active_members"
  on public.expenses for update
  using (
    exists (
      select 1 from public.couples c
      where c.id = expenses.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.couples c
      where c.id = expenses.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "expenses_delete_active_members"
  on public.expenses for delete
  using (
    exists (
      select 1 from public.couples c
      where c.id = expenses.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- incomes: as policies já exigem `status = 'active'` e `user_id = auth.uid()`
-- (migration 004), então nada muda aqui.

-- couples: campos financeiros (orçamento, divisão, shared_balance) e status
-- passam a ser graváveis apenas por membro de vínculo ativo. A ativação
-- continua sendo feita pelas RPCs security definer (link_partner /
-- accept_invitation), que não dependem desta policy.
drop policy if exists "Users can update their own couples" on public.couples;

create policy "couples_update_active_members"
  on public.couples for update
  using (
    status = 'active'
    and (auth.uid() = user_a or auth.uid() = user_b)
  )
  with check (
    status = 'active'
    and (auth.uid() = user_a or auth.uid() = user_b)
  );

-- A RPC mark_expense_paid é security definer: não passa pela RLS das tabelas.
-- Por isso ela própria precisa exigir vínculo ativo para não aceitar operação
-- de pagamento em casal `pending`.
create or replace function public.mark_expense_paid(p_expense_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_expense public.expenses%rowtype;
  v_next public.expenses%rowtype;
  v_next_due date;
begin
  if v_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  select e.* into v_expense
  from public.expenses e
  where e.id = p_expense_id
  for update;

  if not found then
    return jsonb_build_object('error', 'Despesa nao encontrada.');
  end if;

  if not exists (
    select 1
    from public.couples c
    where c.id = v_expense.couple_id
      and c.status = 'active'
      and (c.user_a = v_user_id or c.user_b = v_user_id)
  ) then
    return jsonb_build_object('error', 'Usuario nao pertence a este casal.');
  end if;

  if v_expense.paid then
    return jsonb_build_object(
      'status', 'already_paid',
      'expense', to_jsonb(v_expense),
      'next_expense', null
    );
  end if;

  update public.expenses as e
  set paid = true,
      paid_at = now()
  where e.id = p_expense_id
  returning e.* into v_expense;

  if v_expense.is_recurring and v_expense.due_date is not null then
    v_next_due := (v_expense.due_date + interval '1 month')::date;

    insert into public.expenses (
      couple_id,
      created_by,
      description,
      amount,
      category,
      due_date,
      paid,
      paid_at,
      paid_by,
      is_recurring,
      recurrence_series_id
    )
    values (
      v_expense.couple_id,
      v_expense.created_by,
      v_expense.description,
      v_expense.amount,
      v_expense.category,
      v_next_due,
      false,
      null,
      v_expense.paid_by,
      true,
      v_expense.recurrence_series_id
    )
    on conflict (recurrence_series_id, due_date) do nothing
    returning * into v_next;
  end if;

  return jsonb_build_object(
    'status', 'paid',
    'expense', to_jsonb(v_expense),
    'next_expense', to_jsonb(v_next)
  );
end;
$$;

revoke all on function public.mark_expense_paid(uuid) from public;
grant execute on function public.mark_expense_paid(uuid) to authenticated;

-- ============================================================
-- PARTE B — Constraints de valores
-- ============================================================

-- incomes.amount já tem check (amount > 0) desde a migration 004. Aqui
-- garantimos a mesma invariante para expenses. Entra como NOT VALID para não
-- abortar a aplicação caso existam registros antigos inválidos; se não
-- existirem, é validada imediatamente.
alter table public.expenses
  drop constraint if exists expenses_amount_positive;

alter table public.expenses
  add constraint expenses_amount_positive check (amount > 0) not valid;

do $$
declare
  v_invalid bigint;
begin
  select count(*) into v_invalid
  from public.expenses
  where amount <= 0;

  if v_invalid = 0 then
    alter table public.expenses
      validate constraint expenses_amount_positive;
  else
    raise warning
      'expenses_amount_positive mantida NOT VALID: % despesa(s) com amount <= 0 precisam de correção manual.',
      v_invalid;
  end if;
end;
$$;

-- ============================================================
-- PARTE C — Integridade de paid_by
-- ============================================================
-- paid_by IS NULL OU paid_by pertence a user_a/user_b do casal da despesa.
-- PostgreSQL não permite subquery em CHECK, então a garantia é feita por
-- trigger. A semântica paid/paid_by da Fase 5 não é antecipada aqui.

create or replace function public.validate_expense_paid_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.paid_by is not null then
    if not exists (
      select 1
      from public.couples c
      where c.id = new.couple_id
        and (c.user_a = new.paid_by or c.user_b = new.paid_by)
    ) then
      raise exception 'paid_by deve pertencer ao casal da despesa'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_expense_paid_by() from public;

drop trigger if exists trg_expenses_validate_paid_by on public.expenses;
create trigger trg_expenses_validate_paid_by
  before insert or update of paid_by, couple_id on public.expenses
  for each row
  execute function public.validate_expense_paid_by();

-- ============================================================
-- PARTE D — Leitura de perfil do parceiro
-- ============================================================
-- A policy anterior permitia ao parceiro ler a linha completa do profile em
-- QUALQUER estado de vínculo (inclusive `pending`), expondo campos como
-- birth_date e invite_code. Passa a valer:
--   - cada usuário lê o próprio perfil;
--   - o parceiro lê apenas a view limitada partner_profiles;
--   - o fluxo de convite continua usando lookup_partner (security definer).

drop policy if exists "Users can view own or partner profile" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- View limitada: expõe apenas o necessário do parceiro (nome e, quando o
-- vínculo está ativo, a renda mensal usada no cálculo da divisão). É
-- intencionalmente security definer (security_invoker = false) para não
-- depender de uma policy ampla na tabela base; o recorte é dado pelo join com
-- `couples` usando auth.uid().
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
  end as monthly_income
from public.couples c
join public.profiles p
  on (c.user_a = auth.uid() and p.id = c.user_b)
  or (c.user_b = auth.uid() and p.id = c.user_a);

revoke all on public.partner_profiles from public;
revoke all on public.partner_profiles from anon;
grant select on public.partner_profiles to authenticated;

commit;
