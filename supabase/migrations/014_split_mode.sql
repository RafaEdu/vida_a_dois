-- ============================================================
-- Migration 014: Modo de divisão manual x proporcional à renda (Fase 6)
-- ============================================================
-- Objetivo: impedir que editar a renda pessoal sobrescreva silenciosamente uma
-- divisão manual do casal. Nenhuma migration anterior é reescrita.
--
-- Escopo:
--   A. `couples.split_mode` = 'manual' | 'income_based'.
--      - Registros existentes preservam os percentuais atuais e passam a valer
--        como `manual` (não é possível saber se foram escolhidos manualmente).
--      - Novos vínculos nascem `income_based` (default), mantendo o
--        comportamento de produto por renda no fluxo de ativação atual.
--   B. Consistência dos percentuais (0..100 e soma = 100) garantida no banco.
--   C. Recálculo automático somente em `income_based`; mudança de renda em
--      `manual` não altera percentuais; alternar para `income_based` recalcula
--      imediatamente.
--
-- Estratégia conservadora (seção 9 do PLANO.md): expansão de coluna com
-- backfill, constraint `NOT VALID` validada apenas quando não há dados
-- inválidos e nenhuma deleção de dado.

begin;

-- ============================================================
-- PARTE A — Coluna de modo de divisão
-- ============================================================

alter table public.couples
  add column if not exists split_mode text;

-- Backfill: registros existentes preservam os percentuais atuais e são
-- tratados como divisão manual.
update public.couples
set split_mode = 'manual'
where split_mode is null;

-- Default passa a ser o modo proporcional para novos vínculos.
alter table public.couples
  alter column split_mode set default 'income_based';

alter table public.couples
  alter column split_mode set not null;

alter table public.couples
  drop constraint if exists couples_split_mode_check;

alter table public.couples
  add constraint couples_split_mode_check
  check (split_mode in ('manual', 'income_based'));

-- ============================================================
-- PARTE B — Consistência dos percentuais
-- ============================================================
-- Percentuais sempre entre 0 e 100 e somando 100. Entra como NOT VALID para
-- não abortar caso existam registros históricos inconsistentes; se não
-- existirem, é validada imediatamente (conservador, sem apagar dados).

alter table public.couples
  drop constraint if exists couples_split_ratio_valid;

alter table public.couples
  add constraint couples_split_ratio_valid
  check (
    split_ratio_a >= 0
    and split_ratio_a <= 100
    and split_ratio_b >= 0
    and split_ratio_b <= 100
    and split_ratio_a + split_ratio_b = 100
  ) not valid;

do $$
declare
  v_invalid bigint;
begin
  select count(*) into v_invalid
  from public.couples
  where split_ratio_a < 0
     or split_ratio_a > 100
     or split_ratio_b < 0
     or split_ratio_b > 100
     or split_ratio_a + split_ratio_b <> 100;

  if v_invalid = 0 then
    alter table public.couples
      validate constraint couples_split_ratio_valid;
  else
    raise warning
      'couples_split_ratio_valid mantida NOT VALID: % casal(is) com percentuais invalidos precisam de correcao manual.',
      v_invalid;
  end if;
end;
$$;

-- ============================================================
-- PARTE C — Recálculo condicionado ao modo
-- ============================================================
-- Só recalcula automaticamente quando o vínculo está `active` e o modo é
-- `income_based`. Em `manual`, os percentuais escolhidos são preservados.
-- O trigger também roda em `update of split_mode`, então alternar para
-- `income_based` recalcula imediatamente de forma controlada (o servidor
-- ignora percentuais enviados pelo cliente nesse modo).

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
  -- Modo manual ou vínculo não ativo: nada é sobrescrito.
  if new.status <> 'active' or new.split_mode <> 'income_based' then
    return new;
  end if;

  select monthly_income into v_income_a
  from public.profiles
  where id = new.user_a;

  select monthly_income into v_income_b
  from public.profiles
  where id = new.user_b;

  -- Sem renda das duas partes não há como calcular; mantém o que existe.
  if v_income_a is not null and v_income_b is not null
     and (v_income_a + v_income_b) > 0 then
    v_ratio_a := round((v_income_a / (v_income_a + v_income_b)) * 100, 2);
    new.split_ratio_a := v_ratio_a;
    new.split_ratio_b := 100.00 - v_ratio_a;
  end if;

  return new;
end;
$$;

revoke all on function public.calculate_split_ratio() from public, anon;

drop trigger if exists trg_calculate_split_on_insert on public.couples;
create trigger trg_calculate_split_on_insert
  before insert or update of
    status, split_mode, split_ratio_a, split_ratio_b, user_a, user_b
  on public.couples
  for each row
  execute function public.calculate_split_ratio();

-- Recalcula os casais ativos em modo proporcional quando a renda muda.
create or replace function public.recalculate_split_on_income_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple record;
  v_income_a numeric(12,2);
  v_income_b numeric(12,2);
  v_ratio_a numeric(5,2);
begin
  -- Se o monthly_income não mudou, não faz nada.
  if old.monthly_income is not distinct from new.monthly_income then
    return new;
  end if;

  -- Somente casais ativos que usam a divisão proporcional à renda reagem.
  for v_couple in
    select *
    from public.couples
    where status = 'active'
      and split_mode = 'income_based'
      and (user_a = new.id or user_b = new.id)
  loop
    select monthly_income into v_income_a
    from public.profiles where id = v_couple.user_a;

    select monthly_income into v_income_b
    from public.profiles where id = v_couple.user_b;

    if v_income_a is not null and v_income_b is not null
       and (v_income_a + v_income_b) > 0 then
      v_ratio_a := round((v_income_a / (v_income_a + v_income_b)) * 100, 2);

      update public.couples
      set split_ratio_a = v_ratio_a,
          split_ratio_b = 100.00 - v_ratio_a
      where id = v_couple.id;
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function public.recalculate_split_on_income_change() from public, anon;

commit;
