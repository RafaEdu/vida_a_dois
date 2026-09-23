-- ============================================================
-- Migration 013: Semântica de pagamento e paid_by (Fase 5)
-- ============================================================
-- Objetivo: eliminar o estado contraditório "Pendente + Pago por X".
--
-- Regra de domínio:
--   paid = false => paid_by IS NULL
--   paid = true  => paid_by é um membro do casal
--
-- Estratégia conservadora (seção 9 do PLANO.md):
--   - nenhuma migration anterior é reescrita;
--   - backfill apenas onde o estado é contraditório, sem apagar histórico;
--   - constraint entra como NOT VALID e só é validada se não houver dados
--     inválidos; caso contrário emite WARNING e mantém a garantia para
--     escritas novas.
--
-- Auditoria do estado anterior:
--   - expenses.paid boolean not null default false (003);
--   - expenses.paid_by uuid references profiles (004);
--   - trigger validate_expense_paid_by garantia apenas membership quando
--     paid_by não era nulo (009) — não impedia "pendente com pagador";
--   - RPC mark_expense_paid(uuid) marcava pago sem definir pagador e copiava
--     paid_by para a próxima recorrência (008/009).

begin;

-- ------------------------------------------------------------
-- PARTE A — Backfill de dados inconsistentes
-- ------------------------------------------------------------

-- 1) Despesa pendente não pode carregar pagador.
update public.expenses
set paid_by = null
where paid = false
  and paid_by is not null;

-- 2) Despesa paga sem pagador: assume o criador quando ele é membro do casal
--    (created_by é validado pela RLS como membro ativo no momento do insert).
--    Se não for membro, a linha permanece pendente de correção manual e a
--    constraint fica NOT VALID.
update public.expenses e
set paid_by = e.created_by
where e.paid = true
  and e.paid_by is null
  and exists (
    select 1
    from public.couples c
    where c.id = e.couple_id
      and (c.user_a = e.created_by or c.user_b = e.created_by)
  );

-- ------------------------------------------------------------
-- PARTE B — Constraint declarativa paid <-> paid_by
-- ------------------------------------------------------------
alter table public.expenses
  drop constraint if exists expenses_paid_paid_by_consistency;

alter table public.expenses
  add constraint expenses_paid_paid_by_consistency
  check (
    (paid = false and paid_by is null)
    or (paid = true and paid_by is not null)
  ) not valid;

do $$
declare
  v_invalid bigint;
begin
  select count(*) into v_invalid
  from public.expenses
  where (paid and paid_by is null)
     or (not paid and paid_by is not null);

  if v_invalid = 0 then
    alter table public.expenses
      validate constraint expenses_paid_paid_by_consistency;
  else
    raise warning
      'expenses_paid_paid_by_consistency mantida NOT VALID: % despesa(s) precisam de correção manual.',
      v_invalid;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- PARTE C — Trigger de integridade (semântica + membership)
-- ------------------------------------------------------------
-- Reforça no servidor que:
--   - despesa paga exige pagador;
--   - despesa pendente não pode ter pagador;
--   - o pagador pertence a user_a/user_b do casal da despesa.
create or replace function public.validate_expense_paid_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.paid then
    if new.paid_by is null then
      raise exception 'despesa paga exige um pagador'
        using errcode = '23514';
    end if;
  elsif new.paid_by is not null then
    raise exception 'despesa pendente nao pode ter pagador'
      using errcode = '23514';
  end if;

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
  before insert or update of paid, paid_by, couple_id on public.expenses
  for each row
  execute function public.validate_expense_paid_by();

-- ------------------------------------------------------------
-- PARTE D — RPC mark_expense_paid(expense_id, payer_id)
-- ------------------------------------------------------------
-- Substitui a versão de 1 argumento. Agora recebe o pagador de forma
-- explícita, valida como membro do casal, deriva o executor de auth.uid(),
-- permanece idempotente e gera a próxima recorrência pendente e sem pagador.

drop function if exists public.mark_expense_paid(uuid);

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

  -- Gera a próxima ocorrência apenas se ainda não existir para o vencimento.
  -- A próxima parcela nasce pendente e sem pagador.
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
      null,
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

revoke all on function public.mark_expense_paid(uuid, uuid) from public;
revoke all on function public.mark_expense_paid(uuid, uuid) from anon;
grant execute on function public.mark_expense_paid(uuid, uuid) to authenticated;

commit;
