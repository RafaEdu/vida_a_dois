# Vida a Dois

App Expo/React Native com Supabase para organização financeira de um casal.

## Domínio em uma frase

**Perfil e Casal são áreas distintas.** A pessoa tem identidade, conta e
preferências próprias; o casal é um vínculo compartilhado que evolui de
`pending` para `active` e pode ser encerrado (`ended`) sem apagar histórico.

```text
Pessoa
├── Perfil (nome, nascimento, renda, avatar)
├── Conta e segurança (e-mail, senha, logout)
└── Preferências (notificações)

Relacionamento atual (active)
├── Parceiros e divisão
├── Planejamento e orçamentos (global + por categoria)
├── Metas e recorrências
├── Fechamentos e acerto
├── Atividade
└── Configurações do vínculo -> Encerrar vínculo

Relacionamentos encerrados (ended)
└── Histórico somente leitura + exportação
```

O ciclo de vida completo é:

```text
sem vínculo -> pending -> active -> ended -> pode formar novo vínculo
```

## Invariantes do produto

Estas regras são garantidas no banco (RLS, constraints, triggers e RPCs) e não
apenas na interface:

```text
Profile != Couple
Pending != Active != Ended
Closed month = immutable
paid=false => paid_by=null
split_mode define se renda recalcula split
```

- **`Profile != Couple`** — a aba Casal só mostra dados compartilhados; o
  avatar da Home abre o Perfil individual.
- **`Pending != Active != Ended`** — `pending` não tem acesso financeiro;
  `active` lê e escreve; `ended` só lê (histórico preservado e nunca deletado).
- **`Closed month = immutable`** — despesas/receitas de um mês com snapshot em
  `monthly_closings` não podem ser inseridas, alteradas ou removidas.
- **`paid=false => paid_by=null`** — despesa pendente não tem pagador; o
  pagador, quando existe, pertence ao casal.
- **`split_mode`** — divisão `manual` não é sobrescrita por mudança de renda;
  `income_based` recalcula a partir das rendas.

## Stack

- Expo Router + React Native + TypeScript (`strict`).
- Supabase (Auth, Postgres com RLS, Realtime, Storage e RPCs).
- Jest/Jest Expo, ESLint e Prettier.

## Contextos

O estado é dividido em providers específicos:

- `useAuthSession` (`providers/AuthProvider`) — sessão e operações de Auth;
- `useCouple` (`providers/CoupleProvider`) — perfil, vínculo, parceiro e feed;
- `useFinance` (`providers/FinanceProvider`) — lançamentos, orçamentos e metas.

`useAuth()` (`lib/auth-context.tsx`) é uma **fachada de compatibilidade**
mantida para telas legadas. Código novo deve importar os providers específicos;
não adicionar novos consumidores a `useAuth()`.

## Estrutura de rotas

Grupos do Expo Router (os parênteses não aparecem na URL):

```text
app/(auth)          sign-in, sign-up, verify-email
app/(onboarding)    profile-setup, link-partner
app/(app)/(tabs)    home (Início), expenses (Lançamentos),
                    cost-plan (Planejamento), couple (Casal)
app/(app)           profile, activity, notification-settings,
                    category-budgets, closing-history, closing-detail,
                    monthly-closing, settlement, recurrences,
                    goals, goal-detail, relationship-history,
                    relationship-detail, couple-settings,
                    end-relationship, cost-plan/edit, expense/new,
                    income/new
```

O grupo `(app)` só libera a navegação quando o vínculo está `active`
(`useRouteGuard`). Ao encerrar o vínculo, o app recalcula o bootstrap e volta
para o fluxo "sem parceiro".

## Scripts

```text
npm run start / android / ios / web   # app
npm run typecheck                     # tsc --noEmit
npm run lint                          # eslint .
npm run format / format:check         # prettier
npm test                              # jest

npm run db:push:dry                   # mostra o que seria aplicado no remoto
npm run db:push                       # aplica migrations pendentes no remoto
npm run migration:new -- <nome>       # cria uma nova migration
npm run gen:types                     # regenera tipos do banco local
npm run gen:types:linked              # regenera tipos do projeto remoto linkado
```

Os comandos `db:start`, `db:stop`, `db:reset`, `db:diff`, `db:lint` e
`db:test` existem no `package.json`, mas **este fluxo de trabalho não usa
Supabase/Docker local**. A validação de schema é feita por inspeção
somente-leitura e aplicação no Supabase online.

O CLI do Supabase está fixado em `devDependencies` (`supabase@2.117.0`), então
os scripts acima funcionam sem instalação global.

## Banco de dados e migrations

### Regra principal

**Nunca editar uma migration já aplicada.** Toda correção de schema gera uma
nova migration em `supabase/migrations/`, numerada em sequência.

### Protocolo de migrations

1. Uma migration por mudança lógica.
2. Mudanças de schema seguem `expand -> backfill -> validate -> constrain`
   quando houver dados existentes.
3. RLS/constraints/RPCs são a fonte de verdade de regras críticas; a UI não é
   suficiente.
4. RPCs sensíveis derivam identidade de `auth.uid()`; o cliente nunca envia
   `user_id`/`current_user_id`/`ended_by`.
5. Após o push, conferir com `npx supabase migration list --linked` se local e
   remoto estão iguais.
6. Ver [`docs/BANCO_DADOS.md`](docs/BANCO_DADOS.md) para o inventário e a
   auditoria das migrations.

### Histórico de auditorias

| Data       | Migrations locais | Observação                                                                                                                                                                                                                                                                                                                    |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21/09/2026 | `001`–`008`       | Divergência encontrada: o export de lints do remoto ainda expõe as assinaturas antigas `accept_invitation(uuid, uuid)`, `link_partner(text, uuid)` e `reject_invitation(uuid, uuid)`, removidas pela migration `006`. Indício de migration `006` não aplicada (ou aplicada manualmente) no remoto. Ver `docs/BANCO_DADOS.md`. |
| 22/09/2026 | `001`–`012`       | Inspeção somente-leitura confirmou o DDL de `009`–`012` no remoto (`ended_at`/`ended_by`, `avatar_path`, view `partner_profiles`, `recurrence_series_id`). Seguem abertas as dívidas: grants de `anon` em RPCs e a divergência de histórico da `006`.                                                                         |
| 23/09/2026 | `001`–`019`       | Inspeções REST indicaram `010`–`018` aplicadas; `019` é a próxima pendente e a `006` (hardening de RPCs) segue sem confirmação. Reconciliar o histórico antes de qualquer push novo.                                                                                                                                          |

### RLS

A matriz de testes de RLS (cenário x esperado) e o roteiro de execução estão em
[`docs/RLS_MATRIX.md`](docs/RLS_MATRIX.md).

### Índices

Avaliação dos índices existentes e dos candidatos está em
[`docs/BANCO_DADOS.md`](docs/BANCO_DADOS.md).

## Testes e verificações

```text
npm run typecheck
npm run lint
npm run format:check
npm test -- --runInBand
```

Os testes cobrem domínio puro (divisão, acerto, metas, orçamento por categoria,
notificações, exportação CSV/JSON), serviços com o Supabase mockado e as
transições de bootstrap/roteamento. Cenários que dependem do banco real (RLS,
triggers, constraints e idempotência transacional) estão descritos em
[`docs/RLS_MATRIX.md`](docs/RLS_MATRIX.md) e no
[`docs/SMOKE_TEST.md`](docs/SMOKE_TEST.md).

## Documentação

- [`docs/BANCO_DADOS.md`](docs/BANCO_DADOS.md) — inventário das migrations,
  tabelas, RPCs e índices.
- [`docs/RLS_MATRIX.md`](docs/RLS_MATRIX.md) — matriz de cenários de RLS.
- [`docs/SMOKE_TEST.md`](docs/SMOKE_TEST.md) — checklist manual do app.
- [`PLANO.md`](PLANO.md) — plano de evolução executado fase por fase.
