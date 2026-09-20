-- ============================================================
-- Migration 008: RPC mark_expense_paid (idempotente e transacional)
-- ============================================================
-- Confirma o pagamento de uma despesa e, se recorrente, cria a próxima
-- ocorrência na mesma transação. Substitui a geração de recorrência que
-- ficava no client.
--
-- Segurança:
--   - security definer com search_path vazio e nomes qualificados;
--   - autorização derivada de auth.uid() + membership do casal;
--   - couple_id nunca vem do client (derivado da própria despesa);
--   - execute restrito ao role authenticated.

begin;

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

  -- Bloqueia a linha para impedir pagamentos concorrentes.
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
      and (c.user_a = v_user_id or c.user_b = v_user_id)
  ) then
    return jsonb_build_object('error', 'Usuario nao pertence a este casal.');
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
      paid_at = now()
  where e.id = p_expense_id
  returning e.* into v_expense;

  -- Gera a próxima ocorrência apenas se ainda não existir para o vencimento.
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

commit;
