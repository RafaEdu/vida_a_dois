-- ============================================================
-- Migration 010: Ciclo de vida do relacionamento (Fase 3)
-- ============================================================
-- Objetivo: preparar o domínio para relacionamentos encerrados sem apagar
-- histórico e permitindo que o mesmo usuário/par forme um novo vínculo no
-- futuro. Nenhuma migration anterior é reescrita.
--
-- Escopo:
--   A. Schema: estado `ended`, colunas `ended_at`/`ended_by`, fim da
--      unicidade vitalícia (user_a, user_b).
--   B. Garantia server-side de no máximo um vínculo aberto
--      (`pending`/`active`) por usuário.
--   C. RLS: finanças de vínculo `ended` passam a ser somente leitura.
--   D. link_partner: mensagem amigável para vínculo já aberto.
--   E. Invite codes: utilitário interno de rotação para uso no encerramento
--      (Fase 4), sem expor a ação de encerrar.
--
-- Estratégia conservadora (seção 9 do PLANO.md): nada de deleção de dados.

begin;

-- ============================================================
-- PARTE A — Schema do ciclo de vida
-- ============================================================

-- 1. Fim da unicidade vitalícia do par: o mesmo par pode voltar a se
--    relacionar depois de um vínculo encerrado.
alter table public.couples
  drop constraint if exists couples_unique_pair;

-- 2. Estado `ended` compatível com o tipo atual. O check original foi criado
--    inline na migration 001 sem nome explícito; removemos por introspecção
--    para não depender do nome gerado pelo Postgres.
do $$
declare
  v_conname text;
begin
  for v_conname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'couples'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.couples drop constraint %I', v_conname);
  end loop;
end;
$$;

alter table public.couples
  add constraint couples_status_check
  check (status in ('pending', 'active', 'ended'));

-- 3. Rastreio do encerramento. `ended_by` referencia o profile que executou o
--    encerramento; se o perfil for removido, o vínculo histórico permanece e
--    apenas a autoria é anulada (o vínculo em si já é removido em cascata
--    pelos FKs de user_a/user_b, comportamento pré-existente).
alter table public.couples
  add column if not exists ended_at timestamptz,
  add column if not exists ended_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_couples_ended_at
  on public.couples(ended_at)
  where status = 'ended';

-- ============================================================
-- PARTE B — No máximo um vínculo aberto por usuário
-- ============================================================
-- Uma unique simples em (user_a, user_b) não cobre "usuário em qualquer lado
-- da linha". A garantia é feita por trigger com advisory lock transacional
-- por usuário, adquiridos em ordem determinística para evitar deadlock.
-- `ended` fica fora da regra: históricos antigos não contam como vínculo atual.

create or replace function public.enforce_single_open_couple()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conflict uuid;
begin
  -- Somente vínculos abertos participam da regra.
  if new.status not in ('pending', 'active') then
    return new;
  end if;

  -- Serializa operações concorrentes que envolvam os mesmos usuários.
  perform pg_advisory_xact_lock(
    hashtextextended(least(new.user_a, new.user_b)::text, 0)
  );
  perform pg_advisory_xact_lock(
    hashtextextended(greatest(new.user_a, new.user_b)::text, 0)
  );

  select c.id into v_conflict
  from public.couples c
  where (new.id is null or c.id <> new.id)
    and c.status in ('pending', 'active')
    and (
      c.user_a in (new.user_a, new.user_b)
      or c.user_b in (new.user_a, new.user_b)
    )
  limit 1;

  if v_conflict is not null then
    raise exception 'Usuario ja possui um vinculo aberto'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_single_open_couple() from public;

drop trigger if exists trg_couples_single_open on public.couples;
create trigger trg_couples_single_open
  before insert or update of status, user_a, user_b on public.couples
  for each row
  execute function public.enforce_single_open_couple();

-- ============================================================
-- PARTE C — RLS: finanças de vínculo encerrado são somente leitura
-- ============================================================
-- Escrita continua restrita a `active` (policies criadas na 009/004). A
-- leitura passa a cobrir `ended` para os dois participantes.

drop policy if exists "expenses_select_active_members" on public.expenses;
create policy "expenses_select_members"
  on public.expenses for select
  using (
    exists (
      select 1 from public.couples c
      where c.id = expenses.couple_id
        and c.status in ('active', 'ended')
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

drop policy if exists "incomes_select" on public.incomes;
create policy "incomes_select"
  on public.incomes for select
  using (
    exists (
      select 1 from public.couples c
      where c.id = incomes.couple_id
        and c.status in ('active', 'ended')
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- A policy de UPDATE de couples (009) exige `status = 'active'` no USING e no
-- WITH CHECK, então um cliente comum não consegue reativar `ended` nem
-- encerrar via update direto.

-- ============================================================
-- PARTE D — link_partner: vínculo aberto (pending ou active)
-- ============================================================
-- A RPC passa a dar mensagem amigável quando já existe qualquer vínculo
-- aberto. O trigger acima continua sendo a garantia real.

create or replace function public.link_partner(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_partner_id uuid;
  v_existing_couple record;
  v_open_count int;
begin
  if v_current_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  select p.id into v_partner_id
  from public.profiles p
  where p.invite_code = upper(p_invite_code);

  if v_partner_id is null then
    return jsonb_build_object('error', 'Codigo invalido. Verifique e tente novamente.');
  end if;

  if v_partner_id = v_current_user_id then
    return jsonb_build_object('error', 'Voce nao pode se vincular com voce mesmo.');
  end if;

  -- Confirmação mútua: se já existe um convite pendente entre o par, ativa-o.
  -- Precisa vir antes da checagem de "vínculo aberto", pois esse próprio
  -- convite pendente é um vínculo aberto do usuário.
  select * into v_existing_couple
  from public.couples
  where ((user_a = v_current_user_id and user_b = v_partner_id)
      or (user_a = v_partner_id and user_b = v_current_user_id))
    and status = 'pending';

  if found then
    update public.couples
    set status = 'active', linked_at = now()
    where id = v_existing_couple.id;

    update public.profiles
    set invite_code = null
    where id in (v_current_user_id, v_partner_id);

    return jsonb_build_object('status', 'active');
  end if;

  select * into v_existing_couple
  from public.couples
  where ((user_a = v_current_user_id and user_b = v_partner_id)
      or (user_a = v_partner_id and user_b = v_current_user_id))
    and status = 'active';

  if found then
    return jsonb_build_object('status', 'already_linked');
  end if;

  -- A partir daqui não há vínculo entre o par, então qualquer vínculo aberto
  -- restante é com outra pessoa. Mensagem amigável; o trigger é a garantia.
  select count(*) into v_open_count
  from public.couples
  where (user_a = v_current_user_id or user_b = v_current_user_id)
    and status in ('pending', 'active');

  if v_open_count > 0 then
    return jsonb_build_object('error', 'Voce ja possui um vinculo aberto.');
  end if;

  select count(*) into v_open_count
  from public.couples
  where (user_a = v_partner_id or user_b = v_partner_id)
    and status in ('pending', 'active');

  if v_open_count > 0 then
    return jsonb_build_object('error', 'Seu parceiro ja possui um vinculo aberto.');
  end if;

  insert into public.couples (user_a, user_b, status)
  values (v_current_user_id, v_partner_id, 'pending');

  return jsonb_build_object('status', 'pending');
end;
$$;

-- ============================================================
-- PARTE E — Invite codes: rotação para o pós-encerramento
-- ============================================================
-- Utilitário interno chamado pelo encerramento (Fase 4). Regenera um código
-- novo e único para cada participante de um vínculo já `ended`, permitindo que
-- ambos voltem a convidar. Não é exposto ao cliente.

create or replace function public.rotate_couple_invite_codes(p_couple_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user record;
  v_code text;
  v_attempt int;
begin
  if not exists (
    select 1 from public.couples
    where id = p_couple_id
      and status = 'ended'
  ) then
    return;
  end if;

  for v_user in
    select user_a as id from public.couples where id = p_couple_id
    union
    select user_b as id from public.couples where id = p_couple_id
  loop
    v_attempt := 0;
    loop
      v_code := public.generate_invite_code();
      exit when not exists (
        select 1 from public.profiles
        where invite_code = v_code
          and id <> v_user.id
      );
      v_attempt := v_attempt + 1;
      if v_attempt >= 20 then
        raise exception 'Nao foi possivel gerar um invite_code unico';
      end if;
    end loop;

    update public.profiles
    set invite_code = v_code
    where id = v_user.id;
  end loop;
end;
$$;

revoke all on function public.rotate_couple_invite_codes(uuid)
  from public, anon, authenticated;

commit;
