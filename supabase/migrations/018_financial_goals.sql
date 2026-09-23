-- ============================================================
-- Migration 018: Metas financeiras compartilhadas (Fase 11)
-- ============================================================
-- Objetivo: permitir que o casal acompanhe objetivos compartilhados (viagem,
-- reserva, entrada de imóvel etc.) com progresso e histórico de contribuições,
-- sem confundir metas com o saldo corrente nem tocar no histórico financeiro.
--
-- Auditoria do estado anterior:
--   - não existe nenhuma tabela de metas/objetivos;
--   - `couples.shared_balance` é o caixa acumulado (Fase 7) e não é afetado por
--     contribuições de meta: meta é planejamento, não lançamento;
--   - o app usa `auth.uid()` como identidade confiável e as policies derivam o
--     membro do casal por `couples.user_a/user_b`.
--
-- Escopo:
--   A. Tabela public.financial_goals (meta compartilhada do casal).
--   B. Tabela public.goal_contributions (contribuições por membro).
--   C. RLS: leitura para membros de vínculo `active`/`ended`; escrita apenas
--      para membro de vínculo `active` (regra 2.6 do PLANO.md).
--   D. Identidade derivada de `auth.uid()` (`created_by`/`user_id`) e garantia
--      no servidor de que a contribuição pertence a membro do casal da meta.
--
-- Estratégia conservadora (seção 9 do PLANO.md):
--   - nenhuma migration anterior é reescrita;
--   - nada é apagado: concluir/arquivar apenas muda `status`, preservando a
--     meta e o histórico de contribuições;
--   - não há policy de DELETE: metas e contribuições são histórico somente
--     leitura depois de registradas (meta arquivada continua no histórico).
--
-- O CRUD é feito diretamente pelas tabelas (com RLS), sem RPC: são dados de
-- planejamento com invariantes simples e o plano pede proteção por RLS.

begin;

-- ============================================================
-- PARTE A — Tabela de metas compartilhadas
-- ============================================================

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  target_amount numeric(12,2) not null,
  target_date date,
  status text not null default 'active',
  created_by uuid not null default auth.uid()
    references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_goals_target_positive check (target_amount > 0),
  constraint financial_goals_title_check check (length(btrim(title)) > 0),
  constraint financial_goals_status_check
    check (status in ('active', 'completed', 'archived'))
);

create index if not exists idx_financial_goals_couple_id
  on public.financial_goals(couple_id);

-- ============================================================
-- PARTE B — Tabela de contribuições
-- ============================================================

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.financial_goals(id) on delete cascade,
  user_id uuid not null default auth.uid()
    references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null,
  contributed_at timestamptz not null default now(),
  note text,
  constraint goal_contributions_amount_positive check (amount > 0),
  constraint goal_contributions_note_check
    check (note is null or length(btrim(note)) > 0)
);

create index if not exists idx_goal_contributions_goal_id
  on public.goal_contributions(goal_id);

-- ============================================================
-- PARTE C — RLS das metas
-- ============================================================

alter table public.financial_goals enable row level security;

-- Participantes do vínculo leem as metas (inclusive `ended`, histórico).
drop policy if exists "financial_goals_select_members"
  on public.financial_goals;
create policy "financial_goals_select_members"
  on public.financial_goals
  for select
  using (
    exists (
      select 1
      from public.couples c
      where c.id = financial_goals.couple_id
        and c.status in ('active', 'ended')
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Criação apenas em vínculo `active`, pelo próprio usuário autenticado.
drop policy if exists "financial_goals_insert_active_members"
  on public.financial_goals;
create policy "financial_goals_insert_active_members"
  on public.financial_goals
  for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.couples c
      where c.id = financial_goals.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Editar/concluir/arquivar apenas em vínculo `active` e por membro do casal.
drop policy if exists "financial_goals_update_active_members"
  on public.financial_goals;
create policy "financial_goals_update_active_members"
  on public.financial_goals
  for update
  using (
    exists (
      select 1
      from public.couples c
      where c.id = financial_goals.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.couples c
      where c.id = financial_goals.couple_id
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Sem policy de DELETE: metas não são apagadas (arquivar preserva o histórico).

revoke all on public.financial_goals from anon;
grant select, insert, update on public.financial_goals to authenticated;

-- ============================================================
-- PARTE D — RLS das contribuições
-- ============================================================

alter table public.goal_contributions enable row level security;

-- Participantes leem as contribuições da meta (inclusive `ended`, histórico).
drop policy if exists "goal_contributions_select_members"
  on public.goal_contributions;
create policy "goal_contributions_select_members"
  on public.goal_contributions
  for select
  using (
    exists (
      select 1
      from public.financial_goals g
      join public.couples c on c.id = g.couple_id
      where g.id = goal_contributions.goal_id
        and c.status in ('active', 'ended')
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Contribuir apenas em meta `active`, em vínculo `active`, pelo próprio usuário
-- e como membro do casal da meta. `user_id` é derivado de `auth.uid()`, mas a
-- policy reforça a identidade e a membership mesmo em escrita direta.
drop policy if exists "goal_contributions_insert_active_members"
  on public.goal_contributions;
create policy "goal_contributions_insert_active_members"
  on public.goal_contributions
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.financial_goals g
      join public.couples c on c.id = g.couple_id
      where g.id = goal_contributions.goal_id
        and g.status = 'active'
        and c.status = 'active'
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Sem policy de UPDATE/DELETE: histórico de contribuições é append-only.

revoke all on public.goal_contributions from anon;
grant select, insert on public.goal_contributions to authenticated;

-- ============================================================
-- PARTE E — updated_at das metas
-- ============================================================

create or replace function public.set_financial_goals_updated_at()
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

revoke all on function public.set_financial_goals_updated_at() from public, anon;

drop trigger if exists trg_financial_goals_updated_at on public.financial_goals;
create trigger trg_financial_goals_updated_at
  before update on public.financial_goals
  for each row
  execute function public.set_financial_goals_updated_at();

commit;
