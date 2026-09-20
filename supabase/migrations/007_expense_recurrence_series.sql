-- ============================================================
-- Migration 007: Identidade de série de despesa recorrente
-- ============================================================
-- Adiciona recurrence_series_id e garante a invariante
-- "uma ocorrência por série por vencimento".
--
-- Estado anterior (auditoria):
--   - expenses.id uuid PK; due_date date (nullable); is_recurring bool.
--   - Não existia identificador de série: a recorrência era encadeada
--     apenas pelo client.
--   - Nenhuma migration já aplicada foi editada.
--
-- Padrão expand -> backfill -> validate -> constrain.

begin;

-- -----------------------------------------------------------
-- 1. Expand
-- -----------------------------------------------------------
alter table public.expenses
  add column if not exists recurrence_series_id uuid;

-- -----------------------------------------------------------
-- 2. Backfill
-- -----------------------------------------------------------
-- Cada despesa recorrente existente vira sua própria série. Não tentamos
-- agrupar ocorrências antigas por heurística para não associar séries
-- diferentes incorretamente (ver plano, seção 10.2).
update public.expenses
set recurrence_series_id = id
where is_recurring = true
  and recurrence_series_id is null;

-- Série recorrente exige vencimento; usa a data de criação como base
-- para eventuais registros antigos sem due_date.
update public.expenses
set due_date = created_at::date
where is_recurring = true
  and due_date is null;

-- -----------------------------------------------------------
-- 3. Atribuição automática da série (server-side)
-- -----------------------------------------------------------
create or replace function public.set_expense_recurrence_series()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_recurring then
    if new.recurrence_series_id is null then
      new.recurrence_series_id := gen_random_uuid();
    end if;
  else
    new.recurrence_series_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_expenses_recurrence_series on public.expenses;
create trigger trg_expenses_recurrence_series
  before insert or update of is_recurring on public.expenses
  for each row
  execute function public.set_expense_recurrence_series();

-- -----------------------------------------------------------
-- 4. Validate + constrain
-- -----------------------------------------------------------
alter table public.expenses
  drop constraint if exists expenses_recurrence_consistency;

alter table public.expenses
  add constraint expenses_recurrence_consistency
  check (
    (is_recurring and due_date is not null and recurrence_series_id is not null)
    or (not is_recurring and recurrence_series_id is null)
  );

-- Não-recorrentes têm série nula e, em Postgres, NULLs são distintos em
-- índices únicos; logo o índice só conflita quando há série e vencimento.
create unique index if not exists ux_expenses_recurrence_occurrence
  on public.expenses (recurrence_series_id, due_date);

commit;
