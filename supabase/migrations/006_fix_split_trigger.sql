-- ============================================================
-- Migration 006: Trava de sobrescrita no split ratio
-- ============================================================
-- Corrige o trigger para disparar apenas em INSERT ou UPDATE OF status,
-- e recalcular split somente em novas insercoes ou na transicao pending -> active.
-- Updates de orcamento comuns feitos pelo app mantem os splits intocados.
-- ============================================================

begin;

-- Re-cria a funcao com a trava de sobrescrita
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
  -- Se for UPDATE que nao seja transicao pending -> active, mantem splits intocados
  if TG_OP = 'UPDATE' then
    if old.status <> 'pending' or new.status <> 'active' then
      return new;
    end if;
  end if;

  -- Busca os rendimentos mensais de ambos os usuarios
  select monthly_income into v_income_a
  from public.profiles
  where id = new.user_a;

  select monthly_income into v_income_b
  from public.profiles
  where id = new.user_b;

  -- Se ambos tiverem renda definida, calcula a proporcao
  if v_income_a is not null and v_income_b is not null
     and (v_income_a + v_income_b) > 0 then
    v_ratio_a := round((v_income_a / (v_income_a + v_income_b)) * 100, 2);
    new.split_ratio_a := v_ratio_a;
    new.split_ratio_b := 100.00 - v_ratio_a;
  end if;

  return new;
end;
$$;

-- Recria o trigger para disparar estritamente em INSERT ou UPDATE OF status
drop trigger if exists trg_calculate_split_on_insert on public.couples;
create trigger trg_calculate_split_on_insert
  before insert or update of status on public.couples
  for each row
  when (new.status = 'active')
  execute function public.calculate_split_ratio();

commit;
