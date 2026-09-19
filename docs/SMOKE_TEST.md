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
