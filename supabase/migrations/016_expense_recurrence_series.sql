-- ============================================================
-- Migration 016: Gerenciamento de despesas recorrentes (Fase 9)
-- ============================================================
-- Objetivo: transformar `recurrence_series_id` (até aqui só um UUID por
-- ocorrência) em um modelo explícito e gerenciável de série de recorrência,
-- sem apagar histórico e sem reescrever meses já fechados.
--
-- Auditoria do estado anterior:
--   - `expenses.recurrence_series_id` é apenas um UUID (migration 007);
--     não existe tabela de série.
--   - O trigger `set_expense_recurrence_series` (007) gera um UUID aleatório
--     para cada despesa recorrente, sem nenhuma linha correspondente.
--   - `mark_expense_paid` (013) gera a próxima ocorrência copiando os campos
--     da despesa, sem saber se a recorrência continua ativa.
--
-- Escopo:
--   A. Tabela public.expense_recurrence_series + RLS (leitura de membros,
--      escrita apenas via trigger/RPCs security definer).
--   B. Backfill das séries existentes preservando o histórico.
--   C. Trigger de despesas passa a criar a série correspondente.
--   D. mark_expense_paid só gera próxima ocorrência de série ativa e usa o
--      template atualizado da série (paid=false / paid_by=null mantidos).
--   E. RPCs de gerenciamento: editar template, pausar/reativar e encerrar.
--
-- Estratégia conservadora (seção 9 do PLANO.md): nenhuma migration anterior é
-- reescrita; nenhum dado é apagado; a próxima ocorrência continua sendo
-- `paid=false` e `paid_by=null`; edição/encerramento nunca toca meses fechados
-- (guardado pela tabela `monthly_closings` da 015 e pelo trigger de
-- imutabilidade).
--
-- Observação: não é criada FK de `expenses.recurrence_series_id` para a série
-- de propósito. `couples` -> `expenses` e `couples` -> séries são ambos
-- `on delete cascade`; uma FK adicional poderia ordenar os cascatas de forma
-- a falhar. O vínculo lógico por id é suficiente e já era o modelo anterior.

begin;

-- ============================================================
-- PARTE A — Tabela de séries de recorrência
-- ============================================================

create table if not exists public.expense_recurrence_series (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  description text not null,
  category text not null,
  amount numeric(12,2) not null,
  frequency text not null default 'monthly',
  active boolean not null default true,
  next_due_date date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_recurrence_series_amount_positive check (amount > 0),
  constraint expense_recurrence_series_frequency_check
    check (frequency in ('monthly')),
  constraint expense_recurrence_series_description_check
    check (length(btrim(description)) > 0)
);

create index if not exists idx_expense_recurrence_series_couple_id
  on public.expense_recurrence_series(couple_id);

create index if not exists idx_expense_recurrence_series_couple_active
  on public.expense_recurrence_series(couple_id, active);

alter table public.expense_recurrence_series enable row level security;

-- Participantes do vínculo leem as séries (inclusive `ended`, histórico
-- somente leitura). `pending` não tem acesso financeiro (regra 2.6).
drop policy if exists "recurrence_series_select_members"
  on public.expense_recurrence_series;
create policy "recurrence_series_select_members"
  on public.expense_recurrence_series
  for select
  using (
    exists (
      select 1
      from public.couples c
      where c.id = expense_recurrence_series.couple_id
        and c.status in ('active', 'ended')
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Sem policy de INSERT/UPDATE/DELETE: as séries nascem pelo trigger de
-- despesas e são gerenciadas pelas RPCs `security definer` abaixo.
revoke all on public.expense_recurrence_series from anon;
revoke insert, update, delete on public.expense_recurrence_series
  from authenticated;
grant select on public.expense_recurrence_series to authenticated;

-- ============================================================
-- PARTE B — Backfill das séries existentes
-- ============================================================
-- Cada `recurrence_series_id` atual vira uma série. O template vem da
-- ocorrência mais antiga; a próxima data, da ocorrência pendente mais antiga
-- ou do último vencimento + 1 mês. Nenhuma despesa é alterada.

insert into public.expense_recurrence_series (
  id,
  couple_id,
  description,
  category,
  amount,
  frequency,
  active,
  next_due_date,
  created_by,
  created_at,
  updated_at
)
select distinct on (e.recurrence_series_id)
  e.recurrence_series_id,
  e.couple_id,
  e.description,
  e.category,
  e.amount,
  'monthly',
  true,
  coalesce(
    (
      select min(e2.due_date)
      from public.expenses e2
      where e2.recurrence_series_id = e.recurrence_series_id
        and e2.paid = false
        and e2.due_date is not null
    ),
    (
      select (max(e2.due_date) + interval '1 month')::date
      from public.expenses e2
      where e2.recurrence_series_id = e.recurrence_series_id
        and e2.due_date is not null
    )
  ),
  e.created_by,
  e.created_at,
  e.created_at
from public.expenses e
where e.recurrence_series_id is not null
order by e.recurrence_series_id, e.due_date asc nulls last, e.created_at asc
on conflict (id) do nothing;

-- ============================================================
-- PARTE C — Trigger passa a criar a série
-- ============================================================
-- Antes: gerava um UUID "solto". Agora: cria a linha da série e usa o id.
-- Continua valendo a invariante de 007 (recorrente exige vencimento e série;
-- não-recorrente não tem série).

create or replace function public.set_expense_recurrence_series()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_series_id uuid;
begin
  if new.is_recurring then
    if new.recurrence_series_id is null then
      v_series_id := gen_random_uuid();
      insert into public.expense_recurrence_series (
        id,
        couple_id,
        description,
        category,
        amount,
        frequency,
        active,
        next_due_date,
        created_by
      )
      values (
        v_series_id,
        new.couple_id,
        new.description,
        new.category,
        new.amount,
        'monthly',
        true,
        new.due_date,
        new.created_by
      );
      new.recurrence_series_id := v_series_id;
    end if;
  else
    new.recurrence_series_id := null;
  end if;
  return new;
end;
$$;

revoke all on function public.set_expense_recurrence_series() from public, anon;

drop trigger if exists trg_expenses_recurrence_series on public.expenses;
create trigger trg_expenses_recurrence_series
  before insert or update of is_recurring on public.expenses
  for each row
  execute function public.set_expense_recurrence_series();

-- ============================================================
-- PARTE D — mark_expense_paid só gera ocorrência de série ativa
-- ============================================================
-- Mantém a assinatura de 013 (`p_expense_id`, `p_payer_id`) e todas as
-- validações (auth.uid, vínculo ativo, pagador membro, idempotência). A
-- diferença é que a próxima ocorrência:
--   - só é gerada se a despesa pertence a uma série ATIVA;
--   - usa o template atual da série (descrição/categoria/valor);
--   - continua nascendo pendente e sem pagador;
--   - não duplica (unique de série+vencimento + `on conflict do nothing`).
-- `next_expense` agora é `null` de verdade quando nada foi gerado.

drop function if exists public.mark_expense_paid(uuid, uuid);

create function public.mark_expense_paid(
  p_expense_id uuid,
  p_payer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_expense public.expenses%rowtype;
  v_series public.expense_recurrence_series%rowtype;
  v_next public.expenses%rowtype;
  v_next_due date;
begin
  if v_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  if p_payer_id is null then
    return jsonb_build_object('error', 'Informe quem pagou.');
  end if;

  -- Bloqueia a linha para impedir pagamentos concorrentes.
  select e.* into v_expense
  from public.expenses e
  where e.id = p_expense_id
  for update;

  if not found then
    return jsonb_build_object('error', 'Despesa nao encontrada.');
  end if;

  -- Escrita financeira exige vínculo ativo e executor membro do casal.
  if not exists (
    select 1
    from public.couples c
    where c.id = v_expense.couple_id
      and c.status = 'active'
      and (c.user_a = v_user_id or c.user_b = v_user_id)
  ) then
    return jsonb_build_object('error', 'Usuario nao pertence a este casal.');
  end if;

  -- Pagador precisa ser um dos dois participantes do casal.
  if not exists (
    select 1
    from public.couples c
    where c.id = v_expense.couple_id
      and (c.user_a = p_payer_id or c.user_b = p_payer_id)
  ) then
    return jsonb_build_object('error', 'Pagador deve pertencer ao casal.');
  end if;

  -- Idempotência: já paga apenas devolve o estado atual.
  if v_expense.paid then
    return jsonb_build_object(
      'status', 'already_paid',
      'expense', to_jsonb(v_expense),
      'next_expense', null
    );
  end if;

  update public.expenses as e
  set paid = true,
      paid_at = now(),
      paid_by = p_payer_id
  where e.id = p_expense_id
  returning e.* into v_expense;

  -- Gera a próxima ocorrência apenas de série ativa e ainda não existente.
  if v_expense.is_recurring
     and v_expense.recurrence_series_id is not null
     and v_expense.due_date is not null then
    select s.* into v_series
    from public.expense_recurrence_series s
    where s.id = v_expense.recurrence_series_id;

    if found and v_series.active then
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
        v_series.description,
        v_series.amount,
        v_series.category,
        v_next_due,
        false,
        null,
        null,
        true,
        v_expense.recurrence_series_id
      )
      on conflict (recurrence_series_id, due_date) do nothing
      returning * into v_next;

      if v_next.id is not null then
        update public.expense_recurrence_series
        set next_due_date = v_next_due,
            updated_at = now()
        where id = v_expense.recurrence_series_id;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'status', 'paid',
    'expense', to_jsonb(v_expense),
    'next_expense',
      case when v_next.id is null then null else to_jsonb(v_next) end
  );
end;
$$;

revoke all on function public.mark_expense_paid(uuid, uuid) from public;
revoke all on function public.mark_expense_paid(uuid, uuid) from anon;
grant execute on function public.mark_expense_paid(uuid, uuid) to authenticated;

-- ============================================================
-- PARTE E — RPCs de gerenciamento da série
-- ============================================================
-- Todas derivam o usuário de auth.uid(), exigem vínculo ATIVO e participação
-- no casal, e nunca alteram/apagam ocorrências de meses já fechados.

-- E.1 — Editar template: aplica o novo template à série e às ocorrências
-- futuras ainda pendentes de meses NÃO fechados.
create or replace function public.update_recurrence_series(
  p_series_id uuid,
  p_description text,
  p_category text,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_series public.expense_recurrence_series%rowtype;
  v_touched integer := 0;
begin
  if v_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  if p_description is null or length(btrim(p_description)) = 0 then
    return jsonb_build_object('error', 'Informe a descricao da recorrencia.');
  end if;

  if p_category is null or length(btrim(p_category)) = 0 then
    return jsonb_build_object('error', 'Selecione uma categoria.');
  end if;

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('error', 'Informe um valor valido.');
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
  set description = btrim(p_description),
      category = p_category,
      amount = p_amount,
      updated_at = now()
  where id = p_series_id
  returning * into v_series;

  update public.expenses e
  set description = btrim(p_description),
      category = p_category,
      amount = p_amount
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
  get diagnostics v_touched = row_count;

  return jsonb_build_object(
    'status', 'updated',
    'series', to_jsonb(v_series),
    'updated_occurrences', v_touched
  );
end;
$$;

revoke all on function public.update_recurrence_series(uuid, text, text, numeric)
  from public, anon;
grant execute on function public.update_recurrence_series(uuid, text, text, numeric)
  to authenticated;

-- E.2 — Pausar/reativar. Ao reativar, recalcula a próxima ocorrência a partir
-- da pendência mais antiga (ou da próxima data esperada).
create or replace function public.set_recurrence_series_active(
  p_series_id uuid,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_series public.expense_recurrence_series%rowtype;
  v_next_due date;
begin
  if v_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  if p_active is null then
    return jsonb_build_object('error', 'Informe o estado da recorrencia.');
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

  v_next_due := v_series.next_due_date;

  if p_active then
    select min(e.due_date) into v_next_due
    from public.expenses e
    where e.recurrence_series_id = p_series_id
      and e.paid = false
      and e.due_date is not null;

    if v_next_due is null then
      v_next_due := greatest(
        current_date,
        coalesce(v_series.next_due_date, current_date)
      );
    end if;
  end if;

  update public.expense_recurrence_series
  set active = p_active,
      next_due_date = v_next_due,
      updated_at = now()
  where id = p_series_id
  returning * into v_series;

  return jsonb_build_object(
    'status', case when p_active then 'reactivated' else 'paused' end,
    'series', to_jsonb(v_series)
  );
end;
$$;

revoke all on function public.set_recurrence_series_active(uuid, boolean)
  from public, anon;
grant execute on function public.set_recurrence_series_active(uuid, boolean)
  to authenticated;

-- E.3 — Encerrar: desativa a série e cancela as ocorrências pendentes de
-- meses não fechados (preserva pagas e todo o histórico).
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

  return jsonb_build_object(
    'status', 'ended',
    'series', to_jsonb(v_series),
    'cancelled_occurrences', v_cancelled
  );
end;
$$;

revoke all on function public.end_recurrence_series(uuid) from public, anon;
grant execute on function public.end_recurrence_series(uuid) to authenticated;

commit;
