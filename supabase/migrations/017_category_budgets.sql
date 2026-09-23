-- ============================================================
-- Migration 017: Orçamento por categoria (Fase 10)
-- ============================================================
-- Objetivo: evoluir o orçamento mensal global para planejamento por categoria,
-- mantendo o orçamento global e sem tocar no histórico financeiro.
--
-- Auditoria do estado anterior:
--   - `couples.monthly_budget` é o único teto existente (migration 001);
--   - não existe nenhum limite por categoria;
--   - a UI agrupa despesas por `expenses.category` (texto normalizado pelas
--     constantes de `src/constants/categories.ts`).
--
-- Escopo:
--   A. Tabela public.category_budgets (limite mensal por casal/categoria).
--   B. RLS: leitura para membros de vínculo `active`/`ended`; escrita apenas
--      para membro de vínculo `active` (regra 2.6 do PLANO.md).
--   C. Trigger simples de `updated_at`.
--
-- Estratégia conservadora (seção 9 do PLANO.md): nenhuma migration anterior é
-- reescrita; nenhum dado é apagado; a categoria é guardada como texto para
-- reutilizar a mesma normalização do restante do app. Categoria renomeada ou
-- inexistente apenas deixa de casar com as despesas (progresso zero), sem
-- quebrar a leitura.
--
-- O CRUD é feito diretamente pela tabela (com RLS), sem RPC: são dados de
-- configuração simples, e o plano pede explicitamente proteção por RLS.

begin;

-- ============================================================
-- PARTE A — Tabela de orçamento por categoria
-- ============================================================

create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  category text not null,
  monthly_amount numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_budgets_amount_positive check (monthly_amount > 0),
  constraint category_budgets_category_check check (length(btrim(category)) > 0),
  constraint category_budgets_couple_category_unique unique (couple_id, category)
);

create index if not exists idx_category_budgets_couple_id
  on public.category_budgets(couple_id);

-- ============================================================
-- PARTE B — RLS
-- ============================================================

alter table public.category_budgets enable row level security;

-- Participantes do vínculo leem a configuração (inclusive `ended`, histórico).
drop policy if exists "category_budgets_select_members"
  on public.category_budgets;
create policy "category_budgets_select_members"
  on public.category_budgets
  for select
  using (
    exists (
      select 1
      from public.couples c
      where c.id = category_budgets.couple_id
        and c.status in ('active', 'ended')
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Escrita apenas em vínculo `active` e por membro do casal.
drop policy if exists "category_budgets_insert_active_members"
  on public.category_budgets;
create policy "category_budgets_insert_active_members"
  on public.category_budgets
  for insert
  with check (
    exists (
      select 1
      from public.couples c
      where c.id = category_budgets.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "category_budgets_update_active_members"
  on public.category_budgets;
create policy "category_budgets_update_active_members"
  on public.category_budgets
  for update
  using (
    exists (
      select 1
      from public.couples c
      where c.id = category_budgets.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.couples c
      where c.id = category_budgets.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "category_budgets_delete_active_members"
  on public.category_budgets;
create policy "category_budgets_delete_active_members"
  on public.category_budgets
  for delete
  using (
    exists (
      select 1
      from public.couples c
      where c.id = category_budgets.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

revoke all on public.category_budgets from anon;
grant select, insert, update, delete on public.category_budgets to authenticated;

-- ============================================================
-- PARTE C — updated_at
-- ============================================================

create or replace function public.set_category_budgets_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_category_budgets_updated_at() from public, anon;

drop trigger if exists trg_category_budgets_updated_at on public.category_budgets;
create trigger trg_category_budgets_updated_at
  before update on public.category_budgets
  for each row
  execute function public.set_category_budgets_updated_at();

commit;
