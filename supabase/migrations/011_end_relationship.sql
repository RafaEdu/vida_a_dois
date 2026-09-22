-- ============================================================
-- Migration 011: Encerramento de vínculo (Fase 4)
-- ============================================================
-- Objetivo: permitir que qualquer integrante encerre o vínculo ativo sem
-- apagar histórico e sem depender da aprovação do outro parceiro. Nenhuma
-- migration anterior é reescrita.
--
-- Escopo:
--   A. RPC transacional `end_relationship()` que localiza o vínculo ativo de
--      `auth.uid()` (não recebe couple_id do cliente), marca `status = 'ended'`,
--      preenche `ended_at`/`ended_by` e rotaciona os invite codes dos dois
--      usuários para permitir novos vínculos no futuro.
--
-- A migration 010 já entregou: estado `ended`, colunas `ended_at`/`ended_by`,
-- o trigger `trg_couples_single_open` e o utilitário interno
-- `rotate_couple_invite_codes` (chamado aqui). Esta fase apenas expõe a ação.
--
-- Estratégia conservadora (seção 9 do PLANO.md): nada de deleção de dados.
-- Encerrar = atualizar status; despesas, receitas e fechamentos permanecem.
-- A leitura de histórico `ended` e a escrita restrita a `active` já estão
-- garantidas pelas RLS de 004/009/010.

begin;

create or replace function public.end_relationship()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple public.couples%rowtype;
  v_ended_at timestamptz := now();
begin
  if v_user_id is null then
    return jsonb_build_object('error', 'Nao autenticado.');
  end if;

  -- Localiza e bloqueia o único vínculo aberto do usuário. A identidade vem
  -- de auth.uid(); a membresia é garantida pelo próprio filtro.
  select c.* into v_couple
  from public.couples c
  where c.status = 'active'
    and (c.user_a = v_user_id or c.user_b = v_user_id)
  order by c.created_at desc
  limit 1
  for update;

  if not found then
    -- Idempotência: se o vínculo já foi encerrado, a repetição é tratada como
    -- sucesso controlado em vez de erro.
    if exists (
      select 1
      from public.couples c
      where c.status = 'ended'
        and (c.user_a = v_user_id or c.user_b = v_user_id)
    ) then
      return jsonb_build_object('status', 'already_ended');
    end if;

    return jsonb_build_object('error', 'Nenhum vinculo ativo encontrado.');
  end if;

  -- security definer ignora a policy `couples_update_active_members`, que
  -- exige status `active` no WITH CHECK e portanto bloquearia a transição
  -- para `ended` em update comum de cliente.
  update public.couples
  set status = 'ended',
      ended_at = v_ended_at,
      ended_by = v_user_id
  where id = v_couple.id;

  -- Permite que os dois voltem a convidar/aceitar um novo vínculo.
  perform public.rotate_couple_invite_codes(v_couple.id);

  return jsonb_build_object(
    'status', 'ended',
    'couple_id', v_couple.id,
    'ended_at', v_ended_at
  );
end;
$$;

-- Não é função pública: apenas o usuário autenticado pode encerrar o próprio
-- vínculo. `anon` e `public` ficam sem execução.
revoke all on function public.end_relationship() from public, anon;
grant execute on function public.end_relationship() to authenticated;

commit;
