# Matriz de testes de RLS

Objetivo: confirmar no **banco** que as policies, RPCs e constraints bloqueiam
o que precisa ser bloqueado, sem depender da UI.

> **Ambiente:** este fluxo de trabalho não usa Supabase/Docker local. As
> verificações possíveis são de inspeção somente-leitura no Supabase online e
> por testes de aplicação com o Supabase mockado. A automação em pgTAP fica
> registrada como pendência (ver final do documento).

## Cenários

### Perfil e casal

| #   | Cenário                                              | Esperado                             | Referência                                           |
| --- | ---------------------------------------------------- | ------------------------------------ | ---------------------------------------------------- |
| 1   | Usuário lê o próprio perfil                          | permitido                            | `profiles_select_own` (`009`)                        |
| 2   | Parceiro ativo lê nome/renda/avatar do parceiro      | permitido (campos limitados)         | view `partner_profiles` (`009`/`012`)                |
| 3   | Usuário de fora do casal lê perfil/finanças          | negado                               | `profiles_select_own` + RLS financeira (`009`/`010`) |
| 4   | Participante lê o vínculo próprio (`active`/`ended`) | permitido                            | RLS de `couples` (`001`+`010`)                       |
| 5   | Escrita em `couples` por membro de vínculo `ended`   | negado                               | `couples_update_active_members` (`009`)              |
| 6   | `active -> ended` por `update` comum do cliente      | negado (só a RPC `end_relationship`) | `couples_update_active_members` (`009`/`011`)        |
| 7   | Mesmo usuário em dois vínculos abertos               | negado                               | `trg_couples_single_open` (`010`)                    |
| 8   | Mesmo par forma novo vínculo após `ended`            | permitido                            | unicidade vitalícia removida (`010`)                 |

### Financeiro

| #   | Cenário                                                  | Esperado                        | Referência                                                                   |
| --- | -------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| 9   | Leitura de despesas/receitas em vínculo `active`/`ended` | permitido                       | policies de SELECT (`009`/`010`)                                             |
| 10  | Leitura/escrita financeira em vínculo `pending`          | negado                          | policies exigem `status='active'` na escrita (`009`)                         |
| 11  | Escrita financeira em vínculo `ended`                    | negado                          | policies de INSERT/UPDATE/DELETE (`009`/`010`)                               |
| 12  | Despesa com `paid_by` fora do casal                      | negado                          | `trg_expenses_validate_paid_by` (`009`/`013`)                                |
| 13  | Despesa pendente com `paid_by` preenchido                | negado                          | `expenses_paid_paid_by_consistency` + trigger (`013`)                        |
| 14  | Despesa/receita com `amount <= 0`                        | negado                          | `expenses_amount_positive` / `incomes` (`009`)                               |
| 15  | INSERT de despesa com `created_by` de outro usuário      | negado                          | policy de INSERT exige `created_by = auth.uid()` (`009`)                     |
| 16  | INSERT/UPDATE/DELETE de lançamento de mês fechado        | negado                          | `trg_expenses_block_closed_month` / `trg_incomes_block_closed_month` (`015`) |
| 17  | Fechar o mês duas vezes                                  | não duplica saldo (idempotente) | `close_month` + snapshot (`015`)                                             |
| 18  | Pagar despesa recorrente duas vezes                      | uma única ocorrência gerada     | `mark_expense_paid` + índice único (`016`)                                   |
| 19  | Editar/encerrar série recorrente tocando mês fechado     | mês fechado preservado          | RPCs de recorrência (`016`)                                                  |

### Metas, notificações e RPCs

| #   | Cenário                                                     | Esperado                     | Referência                                                      |
| --- | ----------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| 20  | Contribuição com `user_id` fora do casal da meta            | negado                       | policies de `goal_contributions` (`018`)                        |
| 21  | Contribuição em meta arquivada/concluída ou vínculo `ended` | negado                       | policy de INSERT exige meta `active` + vínculo `active` (`018`) |
| 22  | `notification_preferences` de outro usuário                 | negado                       | policies `notification_preferences_*_own` (`019`)               |
| 23  | Leitura de `couple_activity` de outro casal                 | negado                       | `couple_activity_select_members` (`019`)                        |
| 24  | RPCs de convite/pagamento sem sessão (`anon`)               | negado (`permission denied`) | grants `revoke` + `grant authenticated` (`011`/`013`/`016`)     |

## Cobertura por testes de aplicação

Os cenários puramente de UI/serviço têm cobertura automatizada:

- bootstrap: `src/lib/__tests__/user-state.test.ts`,
  `src/providers/__tests__/bootstrap.test.ts` (sem perfil, sem parceiro,
  convite pendente, casal ativo, vínculo encerrado, financeiro `idle` em
  `pending`);
- pagamento/pagador: `src/services/__tests__/expense.test.ts`;
- recorrência: `src/services/__tests__/recurrence.test.ts`,
  `src/features/recurrences/__tests__/model.test.ts`;
- divisão manual/proporcional: `src/domain/finance/__tests__/split.test.ts`;
- fechamento: `src/services/__tests__/couple-rpc.test.ts`,
  `src/services/__tests__/monthlyClosing.test.ts`,
  `src/domain/finance/__tests__/selectors.test.ts`;
- acerto: `src/domain/finance/__tests__/settlement.test.ts`;
- encerramento preservando histórico:
  `src/services/__tests__/couple-end-relationship.test.ts` +
  `src/services/__tests__/couple.test.ts` (`fetchRelationshipHistory`,
  `fetchCoupleById`).

Os cenários de RLS/trigger/constraint (4–8, 10–24) dependem do banco e são
verificados por inspeção/smoke, conforme o roteiro abaixo.

## Roteiro de execução (quando houver projeto linkado)

```text
1. npx supabase migration list --linked
2. npm run gen:types:linked && npm run typecheck
3. inspeção somente-leitura (REST) das tabelas/views e policies
4. smoke manual com duas contas (ver docs/SMOKE_TEST.md)
5. registrar o resultado na tabela do SMOKE_TEST.md
```

Reconcilie o histórico da migration `006` antes de qualquer push novo (ver
[`BANCO_DADOS.md`](BANCO_DADOS.md#5-auditoria-local-x-remoto)).

## Pendências

- Automação em pgTAP (`supabase/tests/`) não foi criada: exige banco local, que
  este fluxo não usa. Fica como evolução futura.
- Exercitar `close_month`, `mark_expense_paid`, `end_relationship` e as RPCs de
  recorrência com sessão autenticada real.
- Confirmar os grants de `anon` após o hardening definitivo da `006`.
