-- ============================================================
-- Migração 005: Correções financeiras
-- ============================================================
-- Correções:
-- 1. Trava de sobrescrita no split_ratio em UPDATEs comuns
-- 2. Coluna last_closed_month para idempotência do fechamento
-- 3. Prevenção de fechamento duplicado na RPC close_month
-- ============================================================

-- -----------------------------------------------------------
-- 1. Corrige a função calculate_split_ratio para só recalcular
--    em INSERT ou transição de pending -> active
-- -----------------------------------------------------------
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
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active') then
    select monthly_income into v_income_a
    from public.profiles
    where id = new.user_a;

    select monthly_income into v_income_b
    from public.profiles
    where id = new.user_b;

    if v_income_a is not null and v_income_b is not null
       and (v_income_a + v_income_b) > 0 then
      v_ratio_a := round((v_income_a / (v_income_a + v_income_b)) * 100, 2);
      new.split_ratio_a := v_ratio_a;
      new.split_ratio_b := 100.00 - v_ratio_a;
    end if;
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------
-- 2. Altera o trigger para disparar apenas em INSERT ou UPDATE OF status
-- -----------------------------------------------------------
drop trigger if exists trg_calculate_split_on_insert on public.couples;
create trigger trg_calculate_split_on_insert
  before insert or update of status on public.couples
  for each row
  when (new.status = 'active')
  execute function public.calculate_split_ratio();

-- -----------------------------------------------------------
-- 3. Adiciona coluna last_closed_month para controle de idempotência
-- -----------------------------------------------------------
alter table public.couples
  add column if not exists last_closed_month varchar(7) null;

-- -----------------------------------------------------------
-- 4. Atualiza a RPC close_month com verificação de fechamento duplicado
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
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_total_incomes numeric(12,2);
  v_total_expenses numeric(12,2);
  v_month_balance numeric(12,2);
  v_current_balance numeric(12,2);
  v_new_balance numeric(12,2);
  v_budget numeric(12,2);
  v_already_closed varchar(7);
begin
  select exists (
    select 1 from public.couples
    where id = p_couple_id
      and status = 'active'
      and (user_a = v_user_id or user_b = v_user_id)
  ) into v_is_member;

  if not v_is_member then
    return jsonb_build_object('error', 'Usuário não pertence a este casal.');
  end if;

  v_current_month := to_char(now(), 'YYYY-MM');

  select last_closed_month into v_already_closed
  from public.couples
  where id = p_couple_id;

  if v_already_closed = v_current_month then
    return jsonb_build_object('error', 'O mês atual já foi fechado e consolidado!');
  end if;

  v_month_start := date_trunc('month', now());
  v_month_end := date_trunc('month', now()) + interval '1 month' - interval '1 microsecond';

  select coalesce(sum(amount), 0) into v_total_incomes
  from public.incomes
  where couple_id = p_couple_id
    and received_at >= v_month_start
    and received_at <= v_month_end;

  select coalesce(sum(amount), 0) into v_total_expenses
  from public.expenses
  where couple_id = p_couple_id
    and ((due_date is not null and due_date >= v_month_start::date and due_date <= v_month_end::date)
         or (due_date is null and created_at >= v_month_start and created_at <= v_month_end));

  v_month_balance := v_total_incomes - v_total_expenses;

  select shared_balance, monthly_budget into v_current_balance, v_budget
  from public.couples
  where id = p_couple_id;

  v_new_balance := v_current_balance + v_month_balance;

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
    'monthly_budget', v_budget
  );
end;
$$;
