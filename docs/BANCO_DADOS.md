# Banco de dados — inventário, RPCs, invariantes e índices

Documento de apoio do estado final do schema. O fluxo de migrations está no
[README](../README.md). Regra permanente: **nunca editar uma migration já
aplicada**; toda correção gera uma nova migration numerada.

## 1. Inventário das migrations

| Migration                                   | Conteúdo principal                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `001_initial_schema.sql`                    | Tabelas `profiles`/`couples`, RPCs `lookup_partner`/`link_partner`, RLS e Realtime de `couples`.                                     |
| `002_fix_invite_code.sql`                   | `invite_code` de `char(8)` para `varchar(8)` e correção de códigos com padding.                                                      |
| `003_financial.sql`                         | `couples.monthly_budget`, tabela `expenses`, RPCs `accept_invitation`/`reject_invitation`, RLS.                                      |
| `004_financial_extensions.sql`              | `expenses.paid_by`/`is_recurring`, tabela `incomes`, `couples.shared_balance`, split e `close_month`.                                |
| `005_consolidated_fixes.sql`                | RLS de perfil (próprio ou parceiro), `last_closed_month` e `close_month` idempotente.                                                |
| `006_security_and_finalize.sql`             | RPCs de convite passam a usar `auth.uid()` e `invite_code` gerado no servidor.                                                       |
| `007_expense_recurrence_series.sql`         | `expenses.recurrence_series_id`, trigger de série, check de consistência e índice único de ocorrência.                               |
| `008_mark_expense_paid_rpc.sql`             | RPC `mark_expense_paid` transacional/idempotente e grants restritos a `authenticated`.                                               |
| `009_financial_invariants_and_rls.sql`      | RLS financeira exige vínculo `active`; `amount > 0`; validação de `paid_by`; policy `profiles_select_own` + view `partner_profiles`. |
| `010_relationship_lifecycle.sql`            | Estado `ended`, `ended_at`/`ended_by`, trigger de vínculo único aberto, leitura histórica e `rotate_couple_invite_codes`.            |
| `011_end_relationship.sql`                  | RPC `end_relationship()` (encerra sem apagar histórico e rotaciona invite codes).                                                    |
| `012_profile_avatar.sql`                    | `profiles.avatar_path`, view `partner_profiles.avatar_path`, bucket privado `avatars` e policies de Storage.                         |
| `013_expense_payment_semantics.sql`         | Backfill/constraint/trigger de `paid`/`paid_by` e RPC `mark_expense_paid(uuid, uuid)` com pagador explícito.                         |
| `014_split_mode.sql`                        | `couples.split_mode` (`manual`/`income_based`), constraints de divisão e recálculo condicional.                                      |
| `015_monthly_closings.sql`                  | Tabela `monthly_closings`, `close_month` com snapshot e triggers de imutabilidade de mês fechado.                                    |
| `016_expense_recurrence_series.sql`         | Tabela `expense_recurrence_series`, backfill, geração de ocorrência só de série ativa e RPCs de gerenciamento.                       |
| `017_category_budgets.sql`                  | Tabela `category_budgets` (orçamento por categoria) com RLS.                                                                         |
| `018_financial_goals.sql`                   | Tabelas `financial_goals` e `goal_contributions` (metas compartilhadas) com RLS.                                                     |
| `019_couple_activity_and_notifications.sql` | Tabela `couple_activity` (feed append-only), triggers de eventos e `notification_preferences`.                                       |

## 2. Modelo de dados

### Tabelas

| Tabela                      | Colunas principais                                                                                                                                                | Regras relevantes                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `profiles`                  | `id`, `full_name`, `birth_date`, `monthly_income`, `avatar_path`, `invite_code`, `created_at`                                                                     | 1:1 com `auth.users`; cada usuário escreve apenas o próprio perfil.                                |
| `couples`                   | `id`, `user_a`, `user_b`, `status`, `split_mode`, `split_ratio_a/b`, `monthly_budget`, `shared_balance`, `last_closed_month`, `linked_at`, `ended_at`, `ended_by` | `status in (pending, active, ended)`; `user_a != user_b`; no máximo um vínculo aberto por usuário. |
| `expenses`                  | `id`, `couple_id`, `created_by`, `paid_by`, `description`, `amount`, `category`, `due_date`, `paid`, `paid_at`, `is_recurring`, `recurrence_series_id`            | `amount > 0`; `paid=false => paid_by=null`; `paid_by` pertence ao casal.                           |
| `incomes`                   | `id`, `couple_id`, `user_id`, `description`, `amount`, `is_extra`, `received_at`                                                                                  | `amount > 0`; leitura/escrita condicionada ao estado do vínculo.                                   |
| `monthly_closings`          | `id`, `couple_id`, `year_month`, totais, `monthly_budget`, `split_ratio_a/b`, saldos antes/depois, `closed_by`, `closed_at`                                       | `unique (couple_id, year_month)`; escrita só pela RPC `close_month`.                               |
| `expense_recurrence_series` | `id`, `couple_id`, `description`, `category`, `amount`, `frequency`, `active`, `next_due_date`, `created_by`                                                      | `frequency = monthly`; escrita só por RPCs `security definer`.                                     |
| `category_budgets`          | `id`, `couple_id`, `category`, `monthly_amount`                                                                                                                   | `unique (couple_id, category)`; `monthly_amount > 0`.                                              |
| `financial_goals`           | `id`, `couple_id`, `title`, `target_amount`, `target_date`, `status`, `created_by`                                                                                | `status in (active, completed, archived)`; `target_amount > 0`.                                    |
| `goal_contributions`        | `id`, `goal_id`, `user_id`, `amount`, `contributed_at`, `note`                                                                                                    | `amount > 0`; append-only (sem UPDATE/DELETE).                                                     |
| `couple_activity`           | `id`, `couple_id`, `actor_id`, `event_type`, `entity_type`, `entity_id`, `metadata`, `created_at`                                                                 | Append-only; escrita só por triggers/RPCs; leitura para `active`/`ended`.                          |
| `notification_preferences`  | `user_id`, flags de categorias, `reminder_time`, `last_activity_seen_at`                                                                                          | Uma linha por usuário; leitura/escrita apenas do próprio `auth.uid()`.                             |

A view `partner_profiles` (`security definer`) expõe somente `couple_id`, `id`,
`full_name`, `monthly_income` e `avatar_path` do parceiro, respeitando o estado
do vínculo. É a interface limitada para leitura do parceiro.

### Estado do vínculo x acesso

| Estado do vínculo | Ler financeiro/histórico | Criar/editar/excluir  |
| ----------------- | ------------------------ | --------------------- |
| `pending`         | não                      | não                   |
| `active`          | sim                      | sim                   |
| `ended`           | sim (histórico)          | não (somente leitura) |

## 3. RPCs

| RPC                                                                                   | Papel                                                                                               |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `lookup_partner(p_invite_code)`                                                       | Lookup limitado por código de convite (retorna apenas `full_name`).                                 |
| `link_partner(p_invite_code)`                                                         | Confirma convite mútuo e ativa o vínculo; identidade via `auth.uid()`.                              |
| `accept_invitation(p_couple_id)` / `reject_invitation(p_couple_id)`                   | Aceita/recusa convite pendente; identidade via `auth.uid()`.                                        |
| `close_month(p_couple_id)`                                                            | Fecha o mês com lock, grava snapshot em `monthly_closings` e atualiza `shared_balance`.             |
| `mark_expense_paid(p_expense_id, p_payer_id)`                                         | Confirma pagamento com pagador explícito, idempotente, gera a próxima recorrência quando aplicável. |
| `end_relationship()`                                                                  | Encerra o vínculo ativo, marca `ended`/`ended_at`/`ended_by` e rotaciona invite codes.              |
| `update_recurrence_series` / `set_recurrence_series_active` / `end_recurrence_series` | Gerenciam séries recorrentes sem tocar meses fechados.                                              |
| `rotate_couple_invite_codes(p_couple_id)`                                             | Interna; regenera códigos após encerramento.                                                        |
| `is_active_partner(p_owner)`                                                          | Helper das policies de Storage do bucket de avatar.                                                 |

Todas as RPCs não públicas são `security definer` com `search_path` fixo e
`execute` revogado de `public`/`anon` (concedido apenas a `authenticated`).
Funções de trigger não devem ser chamáveis pela API.

## 4. Triggers e invariantes no servidor

| Trigger                                                              | Garantia                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `trg_couples_single_open`                                            | Um usuário não participa de dois vínculos `pending`/`active`.                        |
| `trg_expenses_validate_paid_by`                                      | `paid=false => paid_by=null` e pagador pertence ao casal.                            |
| `trg_calculate_split_on_insert`                                      | Recalcula a divisão apenas em vínculo `active` + `split_mode=income_based`.          |
| `trg_recalc_split_on_income_change`                                  | Renda só recalcula a divisão em modo `income_based`.                                 |
| `trg_expenses_block_closed_month` / `trg_incomes_block_closed_month` | Mês fechado é imutável (INSERT/UPDATE/DELETE bloqueados).                            |
| `trg_expenses_recurrence_series`                                     | Despesa recorrente cria/exige a série correspondente.                                |
| triggers de `couple_activity`                                        | Registram eventos relevantes (pagamento, fechamento, orçamento, meta, encerramento). |
| `trg_profiles_invite_code`                                           | Gera `invite_code` no servidor.                                                      |

## 5. Auditoria local x remoto

Neste ambiente não há Docker nem projeto linkado; a comparação com o remoto usa
inspeção somente-leitura via REST e a leitura estática das migrations.

### Divergências conhecidas

1. **RPCs antigas de convite podem ainda existir no remoto.** O hardening da
   migration `006` remove as assinaturas `link_partner(text, uuid)`,
   `accept_invitation(uuid, uuid)` e `reject_invitation(uuid, uuid)`. A hipótese
   registrada é que a `006` foi consolidada mantendo o mesmo número de versão,
   então o `db push` pode considerá-la aplicada sem executá-la.
2. **Grants de `anon` em funções `security definer`.** Apesar de `revoke ...
from public`, o Supabase pode manter grants explícitos a `anon`. A dívida é
   revogar `execute` de `anon` em toda função que não seja pública.

### Ações ao reconciliar (onde houver link)

1. `npx supabase migration list --linked` para confirmar as versões aplicadas.
2. Aplicar pendências com `npm run db:push:dry` e depois `npm run db:push`.
3. Confirmar que as assinaturas antigas sumiram.
4. Revogar `execute` de `anon`/`public` das funções internas (migration própria).
5. Reexportar os lints e comparar.

> Fora do escopo de migrations: o lint `auth_leaked_password_protection`
> (proteção de senhas vazadas) é configuração de Auth do Dashboard.

## 6. Índices

### Existentes

| Tabela     | Índices                                                                                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles` | `idx_profiles_invite_code` (parcial).                                                                                                                                                                                                                            |
| `couples`  | `idx_couples_user_a`, `idx_couples_user_b`, `idx_couples_status`, `idx_couples_ended_at`.                                                                                                                                                                        |
| `expenses` | `idx_expenses_couple_id`, `idx_expenses_created_by`, `idx_expenses_category`, `idx_expenses_due_date`, `idx_expenses_paid`, `idx_expenses_paid_by`, `idx_expenses_is_recurring` (parcial), `ux_expenses_recurrence_occurrence (recurrence_series_id, due_date)`. |
| `incomes`  | `idx_incomes_couple_id`, `idx_incomes_user_id`, `idx_incomes_received_at`.                                                                                                                                                                                       |
| demais     | `idx_monthly_closings_couple_id`, `idx_monthly_closings_couple_month`, `idx_expense_recurrence_series_couple_id`, `idx_category_budgets_couple_id`, `idx_financial_goals_couple_id`, `idx_goal_contributions_goal_id`, `idx_couple_activity_couple_created`.     |

### Consultas relevantes

- `fetchExpenses`: `where couple_id = ? order by created_at desc`.
- `fetchIncomes`: `where couple_id = ? order by received_at desc`.
- `close_month`: soma `incomes`/`expenses` por `couple_id` e faixa de datas.
- `mark_expense_paid`: conflito em `(recurrence_series_id, due_date)` — coberto
  pelo índice único.

### Candidatos e decisão

| Candidato                              | Motivo                                                               | Situação               |
| -------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| `expenses(couple_id, due_date)`        | Faixa de `due_date` no `close_month`.                                | Avaliar com `EXPLAIN`. |
| `expenses(couple_id, created_at desc)` | Lista por casal ordenada por `created_at`.                           | Avaliar com `EXPLAIN`. |
| `incomes(couple_id, received_at desc)` | Lista por casal ordenada por `received_at` e faixa no `close_month`. | Avaliar com `EXPLAIN`. |

**Decisão:** nenhuma migration de índice foi criada. O plano pede validação de
planos de consulta e cardinalidade antes de criar índice; sem banco local não
foi possível rodar `EXPLAIN ANALYZE` sobre dados realistas.
