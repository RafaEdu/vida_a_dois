# Matriz de testes de RLS

Fase 12 do plano de melhoria. Objetivo: confirmar no **banco** que as policies,
RPCs e constraints bloqueiam o que precisa ser bloqueado, sem depender da UI.

> Status: matriz definida e roteiro de execução manual documentados. A
> automação em pgTAP (`npm run db:test`) fica para as Fases 13/14, quando a
> regra de negócio já estiver coberta por testes de domínio.

## Cenários

| #   | Cenário                                          | Esperado                                               | Referência                                                                    |
| --- | ------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1   | Usuário A lê o próprio perfil                    | permitido                                              | policy `Users can view own or partner profile` (`005`)                        |
| 2   | Usuário A lê o perfil necessário do parceiro     | permitido                                              | mesma policy (`005`)                                                          |
| 3   | Usuário de fora do casal lê o perfil do casal    | negado                                                 | mesma policy (`005`)                                                          |
| 4   | Usuário A lê despesas do próprio casal           | permitido                                              | `Couple members can view expenses` (`003`)                                    |
| 5   | Usuário de outro casal lê despesas               | negado                                                 | mesma policy (`003`)                                                          |
| 6   | Usuário A altera despesa do próprio casal        | permitido                                              | `Couple members can update expenses` (`003`)                                  |
| 7   | Usuário de outro casal altera despesa            | negado                                                 | mesma policy (`003`)                                                          |
| 8   | Usuário insere despesa com `created_by` de outro | negado                                                 | `Couple members can insert expenses` (`003`, exige `created_by = auth.uid()`) |
| 9   | Usuário lê receitas do casal (status `active`)   | permitido                                              | `incomes_select` (`004`)                                                      |
| 10  | Usuário lê receitas de casal `pending`           | negado                                                 | `incomes_*` exigem `status = 'active'` (`004`)                                |
| 11  | Usuário vincula a si mesmo                       | negado (`"Voce nao pode se vincular com voce mesmo."`) | `link_partner` (`006`)                                                        |
| 12  | Convite com código inválido                      | rejeitado (`"Codigo invalido..."`)                     | `link_partner` (`006`)                                                        |
| 13  | Vínculo duplicado / usuário já em casal ativo    | rejeitado (`already_linked` / `"Voce ja esta..."`)     | `link_partner` (`006`)                                                        |
| 14  | Aceitar o mesmo convite duas vezes               | segunda chamada rejeitada de forma controlada          | `accept_invitation` (`006`)                                                   |
| 15  | `lookup_partner` sem sessão                      | retorna vazio                                          | `lookup_partner` (`006`)                                                      |
| 16  | Fechar o mês duas vezes                          | sem duplicar saldo                                     | `close_month` + `last_closed_month` (`005`)                                   |
| 17  | Pagar despesa recorrente duas vezes              | uma única ocorrência criada                            | `mark_expense_paid` + índice único (`007`/`008`)                              |

## Roteiro de execução

### Local

```text
npm run db:start
npm run db:reset
# conectar no banco local (porta 54322)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

Alternativa sem `psql` instalado:

```text
docker exec -it supabase_db_vida_a_dois psql -U postgres
```

### Simulando usuários e papéis

`auth.uid()` deriva de `request.jwt.claims`. Para testar cada usuário, rode no
banco local:

```sql
begin;

set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid-do-usuario>","role":"authenticated"}';

-- probe: ex.: select * from public.expenses;
-- probe: ex.: update public.expenses set amount = 1 where id = '<expense-id>';

reset role;
rollback;
```

Sempre que possível, envolver em `begin; ... rollback;` para não poluir o banco
local. Para os cenários de RPC, chamar a função com os argumentos reais e
inspecionar o `jsonb` de retorno (`select public.link_partner('<codigo>');`).

### Casos que exigem massa de teste

Os cenários 4–14 precisam de dois casais (um ativo, um `pending`) e de despesas
e receitas vinculadas. Criar essa massa como script de seed (`supabase/seed.sql`)
ou como bloco de `insert` antes dos probes; a automação definitiva (pgTAP) deve
seguir o padrão `begin; select plan(n); ... select * from finish(); rollback;`.

## Achados de segurança relacionados

O export de lints do remoto (20/09/2026) mostra funções `security definer`
executáveis por `anon`/`authenticated`, incluindo `link_partner`,
`accept_invitation`, `reject_invitation` e `close_month`. A reconciliação das
migrations (`006`) e o endurecimento de `execute` estão descritos em
[`BANCO_DADOS.md`](BANCO_DADOS.md#2-auditoria-local-x-remoto).
