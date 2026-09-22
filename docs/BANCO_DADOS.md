# Banco de dados — inventário, auditoria e índices

Documento de apoio da Fase 12 do plano de melhoria. O fluxo de migrations está
no [README](../README.md).

## 1. Inventário das migrations locais

| Migration                           | Conteúdo principal                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `001_initial_schema.sql`            | Tabelas `profiles` e `couples`, RPCs `lookup_partner`/`link_partner`, RLS e Realtime de `couples`.     |
| `002_fix_invite_code.sql`           | `invite_code` de `char(8)` para `varchar(8)` e correção de códigos com padding.                        |
| `003_financial.sql`                 | `couples.monthly_budget`, tabela `expenses`, RPCs `accept_invitation`/`reject_invitation`, RLS.        |
| `004_financial_extensions.sql`      | `expenses.paid_by`/`is_recurring`, tabela `incomes`, `couples.shared_balance`, split e `close_month`.  |
| `005_consolidated_fixes.sql`        | RLS de perfil (próprio ou parceiro), `last_closed_month` e `close_month` idempotente.                  |
| `006_security_and_finalize.sql`     | RPCs passam a usar `auth.uid()`, `lookup_partner` restrito e `invite_code` gerado no servidor.         |
| `007_expense_recurrence_series.sql` | `expenses.recurrence_series_id`, trigger de série, check de consistência e índice único de ocorrência. |
| `008_mark_expense_paid_rpc.sql`     | RPC `mark_expense_paid` transacional/idempotente e grants restritos a `authenticated`.                 |

## 2. Auditoria local x remoto

Procedimento executado conforme o README. Neste ambiente não há Docker nem
projeto linkado, então a comparação com o remoto usou o export de lints do
Supabase (`Supabase Performance Security Lints (tpabkmlcwhoitqvgtdzf).csv`,
capturado em 20/09/2026) e a leitura estática das migrations.

### Divergências encontradas

1. **RPCs antigas ainda expostas no remoto.** O export lista
   `accept_invitation(p_couple_id uuid, p_current_user_id uuid)`,
   `link_partner(p_invite_code text, p_current_user_id uuid)` e
   `reject_invitation(p_couple_id uuid, p_current_user_id uuid)`. A migration
   `006` remove essas assinaturas e cria as versões sem o parâmetro de usuário
   (usando `auth.uid()`). Isso indica que a `006` **não foi aplicada no remoto**
   (ou foi aplicada parcialmente/manualmente). Como as migrations `007` e `008`
   aparecem aplicadas, a hipótese mais provável é intervenção manual no banco.
2. **Grants de `security definer` não reconciliados.** Várias funções
   (`link_partner`, `accept_invitation`, `reject_invitation`, `close_month`,
   `calculate_split_ratio`, `recalculate_split_on_income_change`,
   `set_expense_recurrence_series`) aparecem executáveis por `anon` e
   `authenticated` via API REST. A `008` já restringe `mark_expense_paid`, mas
   as demais permanecem abertas. Funções de trigger não deveriam ser chamáveis
   pela API.

### Ações ao reconciliar (executar onde o projeto estiver linkado)

1. Rodar `npx supabase migration list --linked` e confirmar quais versões
   realmente estão aplicadas.
2. Aplicar as pendentes com `npm run db:push:dry` seguido de `npm run db:push`.
3. Confirmar que as assinaturas antigas sumiram
   (`select proname, pg_get_function_arguments(oid) from pg_proc ...`).
4. Reexportar os lints e comparar. Restringir `execute` das funções que não
   precisam ser públicas é uma nova migration, a ser criada em fase própria.

> Fora do escopo de migrations: o lint `auth_leaked_password_protection`
> (proteção de senhas vazadas desativada) é configuração de Auth do Dashboard.

## 3. Índices

### Existentes

| Tabela     | Índices                                                                                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles` | `idx_profiles_invite_code` (parcial).                                                                                                                                                                                                                            |
| `couples`  | `idx_couples_user_a`, `idx_couples_user_b`, `idx_couples_status`.                                                                                                                                                                                                |
| `expenses` | `idx_expenses_couple_id`, `idx_expenses_created_by`, `idx_expenses_category`, `idx_expenses_due_date`, `idx_expenses_paid`, `idx_expenses_paid_by`, `idx_expenses_is_recurring` (parcial), `ux_expenses_recurrence_occurrence (recurrence_series_id, due_date)`. |
| `incomes`  | `idx_incomes_couple_id`, `idx_incomes_user_id`, `idx_incomes_received_at`.                                                                                                                                                                                       |

### Consultas relevantes

- `fetchExpenses`: `where couple_id = ? order by created_at desc`.
- `fetchIncomes`: `where couple_id = ? order by received_at desc`.
- `close_month`: soma `incomes` por `couple_id` + faixa de `received_at` e
  `expenses` por `couple_id` + faixa de `due_date`/`created_at`.
- RLS de `expenses`: `exists (couples where id = couple_id and (user_a|user_b))`.
- `mark_expense_paid`: leitura por PK e conflito em
  `(recurrence_series_id, due_date)` — já coberto pelo índice único.

### Candidatos e decisão

| Candidato                              | Motivo                                                               | Situação               |
| -------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| `expenses(couple_id, due_date)`        | Faixa de `due_date` no `close_month`.                                | Avaliar com `EXPLAIN`. |
| `expenses(couple_id, created_at desc)` | Lista por casal ordenada por `created_at`.                           | Avaliar com `EXPLAIN`. |
| `incomes(couple_id, received_at desc)` | Lista por casal ordenada por `received_at` e faixa no `close_month`. | Avaliar com `EXPLAIN`. |
| `couples(user_a)` / `couples(user_b)`  | Já existem em `001`.                                                 | Sem ação.              |

**Decisão:** nenhuma migration de índice foi criada nesta fase. O plano pede
validação de planos de consulta e cardinalidade antes de criar índice; sem
banco local não foi possível rodar `EXPLAIN ANALYZE`. A criação deve sair como
migration `009` depois de medir com dados realistas, considerando também o
custo de escrita e a sobreposição com os índices de coluna única já existentes.
