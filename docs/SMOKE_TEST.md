# Smoke Test Manual — Vida a Dois

Checklist curto para repetir nas fases críticas. Não substitui os testes
automatizados; valida o fluxo real do aplicativo com o banco online.

## Pré-requisitos

- Aplicativo instalado/disponível no dispositivo ou emulador.
- Duas contas com e-mail verificável (para o vínculo do casal).
- Banco Supabase online acessível com as migrations aplicadas.

## 1. Conta e onboarding

- [ ] Criar conta.
- [ ] Confirmar e-mail.
- [ ] Preencher perfil (nome, nascimento, renda).
- [ ] Vincular parceiro por código.
- [ ] Aceitar o convite na segunda conta.
- [ ] Confirmar que a aba **Casal** mostra apenas dados compartilhados
      (sem dados pessoais nem logout).
- [ ] Confirmar que o avatar da Home abre o **Perfil** individual.

## 2. Conta e segurança

- [ ] Alterar nome, nascimento e renda pelo Perfil.
- [ ] Trocar a senha (com reautenticação) e entrar novamente.
- [ ] Enviar/remover avatar e confirmar o fallback de iniciais.
- [ ] Sair pela área de Conta e segurança (fora da aba Casal).

## 3. Lançamentos e pagamento

- [ ] Cadastrar receita.
- [ ] Cadastrar despesa pendente e confirmar que não há "pago por".
- [ ] Marcar como paga escolhendo "Você" ou o parceiro.
- [ ] Editar e excluir lançamentos.
- [ ] Confirmar que não aparece "Pago por..." em item pendente.

## 4. Planejamento

- [ ] Editar orçamento global.
- [ ] Alternar a divisão entre **Proporcional à renda** e **Manual**.
- [ ] Confirmar que 60/40 manual permanece 60/40 após editar a renda.
- [ ] Criar orçamento por categoria e ver o progresso.
- [ ] Criar meta, registrar contribuição e concluir/arquivar.
- [ ] Gerenciar recorrências (pausar, reativar, encerrar).

## 5. Fechamento e acerto

- [ ] Fechar o mês e conferir o snapshot no histórico.
- [ ] Confirmar que fechar duas vezes não duplica saldo.
- [ ] Confirmar que editar um lançamento de mês fechado falha.
- [ ] Abrir o Acerto do casal e conferir o resultado textual.

## 6. Atividade, notificações e histórico

- [ ] Conferir o feed de Atividade do casal.
- [ ] Ajustar preferências de notificações e desligar/ligar.
- [ ] Abrir Relacionamentos (histórico separado do vínculo atual).

## 7. Encerramento do vínculo

- [ ] Abrir Configurações do vínculo -> Encerrar vínculo.
- [ ] Etapa 1 lê as consequências; Etapa 2 exige "Li e entendi" + frase exata.
- [ ] Confirmar que o botão destrutivo só habilita com os dois requisitos.
- [ ] Encerrar e confirmar que o iniciador volta ao fluxo "sem parceiro".
- [ ] Confirmar que a segunda conta também deixa o vínculo atual.
- [ ] Confirmar que o histórico financeiro continua legível e somente leitura.
- [ ] Confirmar que o mesmo par pode formar um novo vínculo depois.

## 8. Persistência

- [ ] Fechar/reabrir o app e confirmar sessão e dados.
- [ ] Ficar offline e reconectar sem quebrar o bootstrap.

## Registro da execução

| Data | Responsável | Versão/commit | Resultado | Observações |
| ---- | ----------- | ------------- | --------- | ----------- |
|      |             |               |           |             |

## Verificações automáticas equivalentes

Antes ou depois do smoke test, rodar:

```text
npm run format:check
npm run typecheck
npm run lint
npm test -- --runInBand
```

Cenários de banco (RLS, triggers, imutabilidade) estão em
[`RLS_MATRIX.md`](RLS_MATRIX.md).
