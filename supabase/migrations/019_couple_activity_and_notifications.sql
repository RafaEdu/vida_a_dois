-- ============================================================
-- Migration 019: Atividade do casal e notificações (Fase 12)
-- ============================================================
-- Objetivo: dar transparência ao casal com um feed limitado a eventos
-- realmente relevantes e permitir que cada pessoa configure notificações
-- locais úteis, sem criar ruído.
--
-- Auditoria do estado anterior:
--   - não existe nenhuma tabela de eventos/atividade;
--   - o app não usa `expo-notifications` (a dependência existe, mas está
--     ociosa);
--   - `mark_expense_paid`, `close_month`, `end_recurrence_series` e os
--     CRUDs de orçamento/divisão/meta são os pontos onde os eventos
--     relevantes já nascem.
--
-- Escopo:
--   A. Tabela public.couple_activity (feed do casal) + RLS de leitura para
--      participantes (`active`/`ended`) e escrita apenas por funções
--      `security definer` (sem policy de escrita para o cliente).
--   B. Triggers de eventos: despesa paga, mês fechado, mudança de
--      orçamento/divisão, meta concluída e vínculo encerrado. A recorrência
--      encerrada é registrada pela própria RPC `end_recurrence_series`
--      (a pausa, que não é evento do feed, não gera linha).
--   C. Tabela public.notification_preferences (preferência individual) com
--      RLS restrita ao próprio usuário.
--   D. `couple_activity` entra na publicação de realtime.
--
-- Estratégia conservadora (seção 9 do PLANO.md):
--   - nenhuma migration anterior é reescrita (a 016 é substituída por
--     `create or replace` apenas para registrar o evento de encerramento,
--     preservando comportamento e grants);
--   - nenhum dado é apagado: o feed é append-only e o encerramento do
--     vínculo apenas torna o feed somente leitura;
--   - `metadata` guarda só o rótulo mínimo para exibir o evento (descrição,
--     valor, categoria, mês ou título), nunca segredos nem snapshots do
--     financeiro inteiro.
--
-- Notificações são locais e calculadas no app a partir do estado já lido
-- pelo cliente; não há token/push remoto nem backend novo nesta fase.

begin;

-- ============================================================
-- PARTE A — Tabela de atividade do casal
-- ============================================================

create table if not exists public.couple_activity (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  actor_id uuid default auth.uid()
    references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint couple_activity_event_type_check check (
    event_type in (
      'expense_paid',
      'month_closed',
      'budget_changed',
      'split_changed',
      'goal_completed',
      'recurrence_ended',
      'relationship_ended'
    )
  )
);

create index if not exists idx_couple_activity_couple_created
  on public.couple_activity(couple_id, created_at desc);

alter table public.couple_activity enable row level security;

-- Participantes do vínculo leem o próprio feed (inclusive `ended`, que fica
-- somente leitura). `pending` não tem acesso a dados financeiros (regra 2.6).
drop policy if exists "couple_activity_select_members"
  on public.couple_activity;
create policy "couple_activity_select_members"
  on public.couple_activity
  for select
  using (
    exists (
      select 1
      from public.couples c
      where c.id = couple_activity.couple_id
        and c.status in ('active', 'ended')
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Sem policy de INSERT/UPDATE/DELETE: o feed é append-only e só é escrito por
-- funções `security definer` (triggers e RPCs). O cliente autenticado apenas lê.
revoke all on public.couple_activity from anon;
revoke insert, update, delete on public.couple_activity from authenticated;
grant select on public.couple_activity to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'couple_activity'
  ) then
    alter publication supabase_realtime add table public.couple_activity;
  end if;
end;
$$;

-- ============================================================
-- PARTE B — Logger interno e triggers de eventos
-- ============================================================

-- Função interna compartilhada. O autor vem de `auth.uid()`; nunca do cliente.
create or replace function public.record_couple_activity(
  p_couple_id uuid,
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.couple_activity (
    couple_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_couple_id,
    auth.uid(),
    p_event_type,
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.record_couple_activity(uuid, text, text, uuid, jsonb)
  from public, anon, authenticated;

-- B.1 — Despesa marcada como paga.
create or replace function public.log_expense_paid_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_couple_activity(
    new.couple_id,
    'expense_paid',
    'expense',
    new.id,
    jsonb_build_object(
      'description', new.description,
      'amount', new.amount,
      'paid_by', new.paid_by
    )
  );
  return new;
end;
$$;

revoke all on function public.log_expense_paid_activity() from public, anon;

drop trigger if exists trg_expenses_log_paid_activity on public.expenses;
create trigger trg_expenses_log_paid_activity
  after update on public.expenses
  for each row
  when (old.paid = false and new.paid = true)
  execute function public.log_expense_paid_activity();

-- B.2 — Mês fechado.
create or replace function public.log_month_closed_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_couple_activity(
    new.couple_id,
    'month_closed',
    'monthly_closing',
    new.id,
    jsonb_build_object(
      'year_month', new.year_month,
      'month_delta', new.month_delta
    )
  );
  return new;
end;
$$;

revoke all on function public.log_month_closed_activity() from public, anon;

drop trigger if exists trg_monthly_closings_log_activity
  on public.monthly_closings;
create trigger trg_monthly_closings_log_activity
  after insert on public.monthly_closings
  for each row
  execute function public.log_month_closed_activity();

-- B.3 — Mudança de orçamento por categoria.
-- Ignora UPDATE que não altera o valor, evitando ruído técnico.
create or replace function public.log_category_budget_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid := coalesce(new.couple_id, old.couple_id);
  v_entity_id uuid := coalesce(new.id, old.id);
  v_category text := coalesce(new.category, old.category);
begin
  perform public.record_couple_activity(
    v_couple_id,
    'budget_changed',
    'category_budget',
    v_entity_id,
    jsonb_build_object('category', v_category)
  );
  return null;
end;
$$;

revoke all on function public.log_category_budget_activity() from public, anon;

-- Triggers separados por evento: a cláusula WHEN de um trigger combinado não
-- pode referenciar OLD (com INSERT) nem NEW (com DELETE). O UPDATE ignora
-- mudanças que não alterem o valor, evitando ruído técnico.
drop trigger if exists trg_category_budgets_log_insert
  on public.category_budgets;
create trigger trg_category_budgets_log_insert
  after insert on public.category_budgets
  for each row
  execute function public.log_category_budget_activity();

drop trigger if exists trg_category_budgets_log_update
  on public.category_budgets;
create trigger trg_category_budgets_log_update
  after update on public.category_budgets
  for each row
  when (old.monthly_amount is distinct from new.monthly_amount)
  execute function public.log_category_budget_activity();

drop trigger if exists trg_category_budgets_log_delete
  on public.category_budgets;
create trigger trg_category_budgets_log_delete
  after delete on public.category_budgets
  for each row
  execute function public.log_category_budget_activity();

-- B.4 — Mudança de orçamento global ou de divisão no vínculo.
-- O trigger de `couples` recebe updates internos de `close_month` (saldo) e
-- `end_relationship` (status); o WHEN restringe o log às colunas de
-- planejamento e o corpo só registra o que realmente mudou.
create or replace function public.log_couple_plan_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.monthly_budget is distinct from new.monthly_budget then
    perform public.record_couple_activity(
      new.id,
      'budget_changed',
      'couple',
      new.id,
      jsonb_build_object('monthly_budget', new.monthly_budget)
    );
  end if;

  if old.split_ratio_a is distinct from new.split_ratio_a
     or old.split_ratio_b is distinct from new.split_ratio_b
     or old.split_mode is distinct from new.split_mode then
    perform public.record_couple_activity(
      new.id,
      'split_changed',
      'couple',
      new.id,
      jsonb_build_object(
        'split_ratio_a', new.split_ratio_a,
        'split_ratio_b', new.split_ratio_b,
        'split_mode', new.split_mode
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function public.log_couple_plan_activity() from public, anon;

drop trigger if exists trg_couples_log_plan_activity on public.couples;
create trigger trg_couples_log_plan_activity
  after update on public.couples
  for each row
  when (
    old.monthly_budget is distinct from new.monthly_budget
    or old.split_ratio_a is distinct from new.split_ratio_a
    or old.split_ratio_b is distinct from new.split_ratio_b
    or old.split_mode is distinct from new.split_mode
  )
  execute function public.log_couple_plan_activity();

-- B.5 — Meta concluída.
create or replace function public.log_goal_completed_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_couple_activity(
    new.couple_id,
    'goal_completed',
    'financial_goal',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'target_amount', new.target_amount
    )
  );
  return new;
end;
$$;

revoke all on function public.log_goal_completed_activity() from public, anon;

drop trigger if exists trg_financial_goals_log_completed
  on public.financial_goals;
create trigger trg_financial_goals_log_completed
  after update on public.financial_goals
  for each row
  when (old.status is distinct from new.status and new.status = 'completed')
  execute function public.log_goal_completed_activity();

-- B.6 — Vínculo encerrado.
create or replace function public.log_relationship_ended_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_couple_activity(
    new.id,
    'relationship_ended',
    'couple',
    new.id,
    '{}'::jsonb
  );
  return new;
end;
$$;

revoke all on function public.log_relationship_ended_activity() from public, anon;

drop trigger if exists trg_couples_log_ended_activity on public.couples;
create trigger trg_couples_log_ended_activity
  after update on public.couples
  for each row
  when (old.status is distinct from new.status and new.status = 'ended')
  execute function public.log_relationship_ended_activity();

-- B.7 — Recorrência encerrada.
-- Substitui a versão da 016 preservando assinatura, validações e grants;
-- a única diferença é registrar o evento ANTES de devolver. A pausa via
-- `set_recurrence_series_active` continua sem gerar evento (não é
-- "recorrência encerrada").
create or replace function public.end_recurrence_series(p_series_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_series public.expense_recurrence_series%rowtype;
  v_cancelled integer := 0;
begin
  if v_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  select s.* into v_series
  from public.expense_recurrence_series s
  where s.id = p_series_id
  for update;

  if not found then
    return jsonb_build_object('error', 'Recorrencia nao encontrada.');
  end if;

  if not exists (
    select 1
    from public.couples c
    where c.id = v_series.couple_id
      and c.status = 'active'
      and (c.user_a = v_user_id or c.user_b = v_user_id)
  ) then
    return jsonb_build_object('error', 'Sem permissao para esta recorrencia.');
  end if;

  update public.expense_recurrence_series
  set active = false,
      updated_at = now()
  where id = p_series_id
  returning * into v_series;

  delete from public.expenses e
  where e.recurrence_series_id = p_series_id
    and e.paid = false
    and not exists (
      select 1
      from public.monthly_closings mc
      where mc.couple_id = e.couple_id
        and mc.year_month = to_char(
          coalesce(e.due_date::timestamptz, e.created_at),
          'YYYY-MM'
        )
    );
  get diagnostics v_cancelled = row_count;

  perform public.record_couple_activity(
    v_series.couple_id,
    'recurrence_ended',
    'recurrence_series',
    v_series.id,
    jsonb_build_object('description', v_series.description)
  );

  return jsonb_build_object(
    'status', 'ended',
    'series', to_jsonb(v_series),
    'cancelled_occurrences', v_cancelled
  );
end;
$$;

-- ============================================================
-- PARTE C — Preferências de notificação do usuário
-- ============================================================
-- Preferência é individual: cada linha pertence ao próprio `auth.uid()`.
-- Valores padrão são aplicados mesmo quando a linha ainda não existe (o app
-- usa os defaults e só grava quando a pessoa altera algo).

create table if not exists public.notification_preferences (
  user_id uuid primary key default auth.uid()
    references public.profiles(id) on delete cascade,
  notifications_enabled boolean not null default true,
  due_soon_enabled boolean not null default true,
  pending_expenses_enabled boolean not null default true,
  closing_reminder_enabled boolean not null default true,
  invite_updates_enabled boolean not null default true,
  shared_activity_enabled boolean not null default true,
  reminder_time time not null default '09:00',
  last_activity_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_select_own"
  on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences
  for select
  using (user_id = auth.uid());

drop policy if exists "notification_preferences_insert_own"
  on public.notification_preferences;
create policy "notification_preferences_insert_own"
  on public.notification_preferences
  for insert
  with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_own"
  on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sem policy de DELETE: a preferência acompanha a conta.
revoke all on public.notification_preferences from anon;
grant select, insert, update on public.notification_preferences
  to authenticated;

create or replace function public.set_notification_preferences_updated_at()
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

revoke all on function public.set_notification_preferences_updated_at()
  from public, anon;

drop trigger if exists trg_notification_preferences_updated_at
  on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_notification_preferences_updated_at();

commit;
