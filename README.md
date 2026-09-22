# Vida a Dois

App Expo/React Native com Supabase para organização financeira de um casal.

> Este README cobre, por enquanto, o fluxo de **banco de dados e migrations**
> (Fase 12 do plano de melhoria). As demais seções (arquitetura, fluxos de
> autenticação/casal, testes e convenções) serão consolidadas na Fase 15.

## Stack

- Expo Router + React Native + TypeScript (`strict`).
- Supabase (Auth, Postgres com RLS, Realtime e RPCs).
- Jest/Jest Expo, ESLint e Prettier.

## Scripts

```text
npm run start / android / ios / web   # app
npm run typecheck                     # tsc --noEmit
npm run lint                          # eslint .
npm run format / format:check         # prettier
npm test                              # jest

npm run db:start                      # sobe o Supabase local (Docker)
npm run db:stop                       # derruba o Supabase local
npm run db:reset                      # recria o banco local aplicando migrations
npm run db:diff                       # diff do schema local
npm run db:lint                       # lints de schema/segurança (banco local)
npm run db:test                       # `supabase test db` (pgTAP em supabase/tests)
npm run db:push:dry                   # mostra o que seria aplicado no remoto
npm run db:push                       # aplica migrations pendentes no remoto
npm run migration:new -- <nome>       # cria uma nova migration
npm run gen:types                     # regenera src/types/database.generated.ts
npm run gen:types:linked              # idem, a partir do remoto linkado
```

O CLI do Supabase está fixado em `devDependencies` (`supabase@2.117.0`), então
os scripts acima funcionam sem instalação global.

## Banco de dados e migrations

### Regra principal

**Nunca editar uma migration já aplicada.** Toda correção de schema gera uma
nova migration em `supabase/migrations/`, numerada em sequência.

### Pré-requisitos

- Docker em execução (para o banco local).
- CLI do Supabase disponível (`npm install` resolve via `devDependencies`).
- `supabase/config.toml` versionado na raiz do projeto. Ajuste
  `db.major_version` caso a versão de Postgres do projeto remoto seja
  diferente da local.

### Fluxo reprodutível (local -> remoto)

```text
1. npm run db:start               # ambiente local
2. npm run migration:new -- <nome>
3. editar o SQL da migration em supabase/migrations
4. npm run db:reset               # valida a migration do zero
5. npm run db:lint && npm test    # lints + testes de domínio
6. npm run gen:types              # se o schema mudou
7. npm run db:push:dry            # conferir o que vai para o remoto
8. npm run db:push                # aplicar no projeto linkado
```

Para linkar o projeto remoto em uma máquina nova:

```text
supabase login
supabase link --project-ref <project-ref>
```

### Protocolo de migrations

1. Uma migration por mudança lógica.
2. Mudanças de schema seguem `expand -> backfill -> validate -> constrain`
   quando houver dados existentes.
3. RLS/constraints/RPCs são a fonte de verdade de regras críticas; a UI não é
   suficiente.
4. Após `db:push`, conferir com `supabase migration list` se local e remoto
   estão iguais.
5. Ver `docs/BANCO_DADOS.md` para o inventário e a auditoria das migrations.

### Auditoria local x remoto (procedimento)

Executar antes de iniciar mudanças de schema relevantes:

```text
1. listar as migrations locais:
   Get-ChildItem supabase/migrations

2. comparar com o que está aplicado no remoto:
   npx supabase migration list --linked

3. identificar alterações feitas direto no Dashboard/SQL Editor
   (funções, policies, tabelas que existem no remoto e não vêm de migration);

4. reconciliar a divergência: aplicar as migrations pendentes
   (`db:push`) ou gerar uma migration nova que reflita o que foi feito à mão;

5. registrar o resultado no histórico abaixo.
```

#### Histórico de auditorias

| Data       | Migrations locais | Observação                                                                                                                                                                                                                                                                                                                    |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21/09/2026 | `001`–`008`       | Divergência encontrada: o export de lints do remoto ainda expõe as assinaturas antigas `accept_invitation(uuid, uuid)`, `link_partner(text, uuid)` e `reject_invitation(uuid, uuid)`, removidas pela migration `006`. Indício de migration `006` não aplicada (ou aplicada manualmente) no remoto. Ver `docs/BANCO_DADOS.md`. |

### RLS

A matriz de testes de RLS (cenário x esperado) e o roteiro de execução estão em
[`docs/RLS_MATRIX.md`](docs/RLS_MATRIX.md).

### Índices

Avaliação dos índices existentes e dos candidatos (com decisão de não criar
ainda sem `EXPLAIN ANALYZE`) está em
[`docs/BANCO_DADOS.md`](docs/BANCO_DADOS.md).
