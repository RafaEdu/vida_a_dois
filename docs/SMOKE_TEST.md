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
