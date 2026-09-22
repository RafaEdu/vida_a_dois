# Smoke Test Manual — Vida a Dois

Checklist curto para repetir nas fases críticas do plano de melhoria.
Não substitui os testes automatizados; valida o fluxo real do aplicativo.

## Pré-requisitos

- Aplicativo instalado/disponível no dispositivo ou emulador.
- Acesso a pelo menos duas contas com e-mail verificável (para o vínculo do casal).
- Banco Supabase acessível com as migrations aplicadas.

## Checklist

- [ ] 1. Criar conta.
- [ ] 2. Confirmar e-mail.
- [ ] 3. Preencher perfil.
- [ ] 4. Vincular parceiro.
- [ ] 5. Aceitar convite.
- [ ] 6. Cadastrar receita.
- [ ] 7. Cadastrar despesa.
- [ ] 8. Marcar despesa como paga.
- [ ] 9. Validar recorrência.
- [ ] 10. Editar lançamento.
- [ ] 11. Excluir lançamento.
- [ ] 12. Editar plano de custos.
- [ ] 13. Fechar mês.
- [ ] 14. Sair.
- [ ] 15. Entrar novamente.
- [ ] 16. Fechar/reabrir o app e confirmar persistência da sessão.

## Recorrência e idempotência (Fase 5)

Executar com a migration `008` aplicada. Nenhum caso pode criar duas
ocorrências do mesmo mês para a mesma série.

- [ ] 1. Pagar uma despesa recorrente uma vez e confirmar a próxima ocorrência.
- [ ] 2. Tocar duas vezes rapidamente em "Pagar" e confirmar uma só ocorrência.
- [ ] 3. Chamar a RPC `mark_expense_paid` duas vezes com o mesmo id.
- [ ] 4. Pagar a mesma despesa em dois aparelhos.
- [ ] 5. Ficar offline após o pagamento e reconectar.
- [ ] 6. Receber `update` (paga) e `insert` (próxima) via Realtime.
- [ ] 7. Marcar como não paga e pagar novamente.
- [ ] 8. Confirmar que despesa não recorrente não gera próxima ocorrência.

## Bootstrap e contexts (Fase 6)

Validar que a divisão em `AuthProvider` / `CoupleProvider` /
`FinanceProvider` (consumida pela camada de compatibilidade `useAuth`)
manteve o bootstrap atômico.

- [ ] 1. Abrir o app já vinculado e confirmar que nunca aparece
      `profile-setup` ou `link-partner` antes da Home.
- [ ] 2. Confirmar que a Home não pisca o estado vazio de despesas
      enquanto os dados ainda carregam.
- [ ] 3. Matar e reabrir o app; confirmar sessão persistida e ausência de
      tela de erro de bootstrap.
- [ ] 4. Sair da conta e confirmar que perfil, casal e lançamentos são
      limpos.
- [ ] 5. Entrar com uma conta sem perfil e confirmar `profile-setup`.
- [ ] 6. Entrar com perfil e sem casal e confirmar `link-partner`.
- [ ] 7. Alterar um lançamento e confirmar que as telas continuam
      reagindo via Realtime sem erro.

## Estratégia de sincronização (Fase 7)

Validar que o app usa um único snapshot inicial, atualiza o estado local por
`id` após cada mutation e deixa o Realtime apenas reconciliar eventos do
parceiro, sem refetch incondicional.

- [ ] 1. Abrir a Home já vinculado e confirmar que os lançamentos aparecem
      sem piscar e sem `fetchExpenses` duplicado.
- [ ] 2. Cadastrar uma despesa e confirmar que ela aparece na lista e na Home
      sem nova consulta completa (apenas o registro criado entra no estado).
- [ ] 3. Editar descrição/valor/vencimento e confirmar a reposição na ordem
      canônica sem recarregar a lista.
- [ ] 4. Marcar como paga e desmarcar e confirmar que a ordem se mantém.
- [ ] 5. Excluir uma despesa e uma receita e confirmar a remoção imediata.
- [ ] 6. Cadastrar/editar/excluir receita e confirmar o mesmo comportamento.
- [ ] 7. Com dois aparelhos, confirmar que as alterações do parceiro chegam
      por Realtime e não reiniciam o snapshot.
- [ ] 8. Confirmar que a ordenação após um evento Realtime é igual à do
      snapshot inicial (despesas por vencimento desc., receitas por
      recebimento desc., `created_at` como desempate/fallback).
- [ ] 9. Fechar o mês e confirmar que o `closeMonth` continua reconciliando
      o perfil/casal sem refetch financeiro desnecessário.

## Formulários com Zod + React Hook Form (Fase 8)

Validar que as telas migradas mantiveram a aparência e as regras, agora com
validação por schema, erro por campo e submit desabilitado durante o save.

- [ ] 1. Nova receita: salvar válido, salvar com descrição vazia e com valor
      zero (erro no campo), data de recebimento inválida e válida.
- [ ] 2. Nova despesa: descrição, valor, categoria, vencimento, quem pagou,
      recorrente e já pago; recorrente sem vencimento deve acusar erro no
      campo de vencimento.
- [ ] 3. Histórico: editar despesa (descrição/valor/categoria) e editar
      receita (descrição/valor) pelo modal, validando erro por campo.
- [ ] 4. Perfil: entrar em edição, cancelar e confirmar a restauração do
      nome; salvar novo nome/renda.
- [ ] 5. Plano de custos: orçamento, "usar renda somada", "usar divisão
      ideal" e percentual fora de 0–100.
- [ ] 6. Criar conta: e-mail inválido, senha curta e senhas diferentes
      exibem o aviso e mantêm o botão desabilitado.
- [ ] 7. Entrar: e-mail e senha obrigatórios.
- [ ] 8. Perfil (setup): nome, data de nascimento (DD/MM/AAAA) e renda;
      confirmar que o rascunho local continua sendo salvo e retomado.
- [ ] 9. Vincular parceiro: código com menos de 8 caracteres mantém o botão
      desabilitado; código válido busca e vincula.
- [ ] 10. Confirmar visualmente que os formulários mantêm o layout anterior.

## Navegação e onboarding com Expo Router (Fase 9)

Validar que os grupos `(auth)` / `(onboarding)` / `(app)` guardam a navegação
por layout, que as telas deixaram de se expulsar sozinhas e que o
`@registration_step` não é mais gravado.

- [ ] 1. Abrir o app deslogado e confirmar que a rota inicial é `sign-in`.
- [ ] 2. Criar conta: o app vai para `verify-email`, sem depender de
      `@registration_step`.
- [ ] 3. Confirmar o e-mail e confirmar que entra no onboarding (`profile-setup`).
- [ ] 4. Entrar com conta já vinculada e confirmar que nunca aparece
      `profile-setup`/`link-partner` (o layout `(app)` só libera vinculado).
- [ ] 5. Em `link-partner`, abrir "Editar meu perfil" (rota compartilhada) e
      confirmar que o modal abre normalmente.
- [ ] 6. Concluir o vínculo e confirmar a tela de confirmação antes da Home.
- [ ] 7. Sair da conta e confirmar o retorno imediato para `sign-in`.
- [ ] 8. Verificar no AsyncStorage que `@registration_step` não é mais
      gravado; apenas o rascunho de perfil continua sendo salvo.
- [ ] 9. Preencher parcialmente o `profile-setup`, sair e voltar: o rascunho
      deve ser retomado (encapsulado em `useOnboardingDraft`).
- [ ] 10. Confirmar que a Home permanece acessível após o vínculo e que os
      redirecionamentos não geram telas piscando.

## Registro da execução

| Data | Responsável | Versão/commit | Resultado | Observações |
| ---- | ----------- | ------------- | --------- | ----------- |
|      |             |               |           |             |

## Verificações automáticas equivalentes

Antes ou depois do smoke test, rodar:

```text
npm run typecheck
npm run lint
npm test
```

`npm run format:check` pode ser usado para conferir formatação, mas a padronização
mecânica de todo o projeto está prevista em PR separado (ver plano, Fase 0).
