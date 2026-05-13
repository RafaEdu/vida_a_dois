# Prompt — App de finanças para casais (v2)

## Contexto geral

Você é um especialista em desenvolvimento de aplicativos mobile e planejamento financeiro pessoal. Vou descrever uma ideia de aplicativo e quero que você me ajude a desenvolvê-la com detalhes técnicos e de produto, sem fugir do escopo definido.

O app é voltado para casais que estão começando a vida juntos e precisam de uma ferramenta simples, afetiva e funcional para planejar as finanças do casal. Cada pessoa tem sua própria conta no aplicativo, e as contas são vinculadas para formar uma "dupla financeira".

---

## Stack tecnológica

- **Frontend mobile:** React Native (Expo)
- **Banco de dados e autenticação:** Supabase (PostgreSQL + Auth + Realtime)
- **Notificações push:** Expo Notifications
- **Vinculação entre usuários:** código de convite de 8 caracteres gerado no cadastro

> Não há backend próprio. Toda a lógica de autenticação, armazenamento e tempo real é gerenciada diretamente pelo Supabase no cliente.

---

## Fluxo 1 — Cadastro individual

Cada usuário se cadastra de forma independente antes de qualquer vínculo com o parceiro. O fluxo tem 2 etapas.

### Etapa 1 — Criar conta

Campos obrigatórios:

- E-mail
- Senha
- Confirmação de senha

Comportamento esperado:

- Validação de e-mail em tempo real
- Senha com mínimo de 8 caracteres
- Autenticação gerenciada pelo Supabase Auth
- Após a criação da conta, o Supabase envia automaticamente um e-mail com um código de verificação (OTP) para o endereço cadastrado
- O usuário é redirecionado para uma tela de confirmação onde insere o código recebido por e-mail
- Somente após a verificação do código o usuário avança para a Etapa 2

### Etapa 1b — Verificação de e-mail

Campos obrigatórios:

- Código de verificação (6 dígitos, enviado por e-mail via Supabase Auth)

Comportamento esperado:

- Campo de entrada com máscara numérica de 6 dígitos
- Botão "Reenviar código" disponível após 60 segundos
- Mensagem de apoio: "Enviamos um código para [email]. Verifique sua caixa de entrada."
- Em caso de código inválido ou expirado, exibir mensagem de erro clara e permitir reenvio
- Após validação bem-sucedida, avançar automaticamente para a Etapa 2

### Etapa 2 — Perfil básico

Campos obrigatórios:

- Nome completo
- Data de nascimento

Campo opcional:

- Renda mensal líquida (pode ser preenchida depois, no onboarding financeiro)

Comportamento esperado:

- Indicador de progresso visível (ex: passo 3 de 4)
- Campo de renda com máscara monetária em reais (R$)
- Texto de apoio: "Pode preencher depois — vamos perguntar isso no planejamento"
- Ao salvar, um código de convite de 8 caracteres é gerado automaticamente e associado ao perfil do usuário
- Após salvar, o usuário avança para o fluxo de vinculação

---

## Fluxo 2 — Vinculação do casal

Após o cadastro individual, o usuário fica em um estado intermediário: seu perfil está criado, mas o app ainda não está totalmente desbloqueado. Ele só pode acessar o perfil próprio e a tela de vinculação com o parceiro. O onboarding financeiro só é liberado após ambos estarem vinculados.

### Como funciona a vinculação

Não há deeplink. A vinculação acontece por troca mútua de códigos de convite:

1. O usuário A compartilha seu código de 8 caracteres com o parceiro (via WhatsApp, SMS, ou copiando)
2. O usuário B insere o código do usuário A no app
3. O usuário B compartilha seu próprio código com o usuário A
4. O usuário A insere o código do usuário B no app
5. Quando ambos inseriram o código um do outro, o vínculo é confirmado automaticamente

> Esse modelo elimina a necessidade de backend próprio e de deeplinks, usando apenas o Supabase Realtime para detectar a conclusão do vínculo.

### Tela — Vincular parceiro

Exibe:

- Avatar do usuário atual (com iniciais) + avatar vazio do parceiro (pontilhado, com "?")
- Código de convite do usuário atual em destaque (ex: A7F3B2C1), com botão "Copiar"
- Instrução: "Compartilhe este código com seu parceiro e insira o código dele abaixo"
- Campo: "Inserir código do parceiro" — onde o usuário digita o código de 8 caracteres recebido

Comportamento esperado:

- O código é exibido formatado (ex: A7F3-B2C1) para facilitar a leitura, mas armazenado sem hífen
- Ao inserir o código do parceiro, o app verifica se o código existe e se o perfil correspondente está completo (Etapas 1 e 2 concluídas)
- Se o código for inválido ou o perfil incompleto, exibir mensagem de erro adequada
- Após inserção válida do código do parceiro, o usuário entra no estado "aguardando confirmação mútua"

### Tela — Aguardando parceiro

Exibida enquanto o parceiro ainda não inseriu o código do usuário atual.

Exibe:

- Avatar do usuário + avatar do parceiro (identificado pelo nome do perfil encontrado) com badge "Pendente"
- Mensagem: "Aguardando [nome do parceiro] inserir o seu código"
- Código do usuário atual em destaque, com botão "Copiar" para facilitar o reenvio
- Botão secundário: "Editar meu perfil"

Comportamento esperado:

- O usuário NÃO está bloqueado — pode editar seu perfil
- O app usa Supabase Realtime para escutar a confirmação mútua e avançar o fluxo automaticamente, sem precisar recarregar a tela
- Assim que o parceiro inserir o código correspondente, a tela avança sozinha para a tela de vínculo confirmado

### Tela — Vínculo confirmado

Exibida quando ambos inseriram o código um do outro.

Exibe:

- Avatares dos dois com uma linha sólida entre eles
- Badge: "Vinculados"
- Mensagem: "Agora vamos configurar a vida financeira de vocês juntos"
- Botão principal: "Começar planejamento" — inicia o onboarding financeiro

---

## Modelagem de dados (Supabase / PostgreSQL)

### Tabela `profiles` (extensão do Supabase Auth)

```sql
create table profiles (
  id uuid references auth.users primary key,
  full_name text not null,
  birth_date date,
  monthly_income numeric(12,2),
  invite_code char(8) unique not null,
  created_at timestamptz default now()
);
```

### Tabela `couples`

```sql
create table couples (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles(id) not null,
  user_b uuid references profiles(id),
  status text check (status in ('pending', 'active')) default 'pending',
  split_ratio_a numeric(5,2) default 50.00,
  split_ratio_b numeric(5,2) default 50.00,
  created_at timestamptz default now(),
  linked_at timestamptz
);
```

Lógica:

- Quando o usuário A insere o código do usuário B, cria-se um registro com `user_a = A`, `user_b = B` e `status = pending`
- Quando o usuário B insere o código do usuário A (confirmação mútua), `status` muda para `active` e `linked_at` é preenchido
- O Supabase Realtime notifica ambos os clientes da mudança de status, avançando o fluxo automaticamente
- `split_ratio_a` e `split_ratio_b` definem a proporção de divisão de custos (padrão 50/50, ajustável no onboarding financeiro)

---

## Custos padrão do casal

Ao completar o onboarding financeiro, o casal recebe automaticamente um conjunto de categorias de custo pré-cadastradas, baseadas em despesas comuns da vida a dois. O objetivo é que o casal já tenha uma estrutura pronta para preencher os valores, sem precisar criar categorias do zero.

### Categorias pré-cadastradas

| Categoria                  | Ícone sugerido | Tipo     |
| -------------------------- | -------------- | -------- |
| Aluguel / Financiamento    | 🏠             | Fixo     |
| Condomínio                 | 🏢             | Fixo     |
| Água                       | 💧             | Variável |
| Energia elétrica           | ⚡             | Variável |
| Gás                        | 🔥             | Variável |
| Internet                   | 📡             | Fixo     |
| Alimentação (mercado)      | 🛒             | Variável |
| Alimentação (restaurantes) | 🍽️             | Variável |
| Transporte (combustível)   | ⛽             | Variável |
| Transporte (público / app) | 🚌             | Variável |
| Saúde e farmácia           | 💊             | Variável |
| Plano de saúde             | 🏥             | Fixo     |
| Streaming e assinaturas    | 📺             | Fixo     |
| Lazer e entretenimento     | 🎉             | Variável |
| Vestuário                  | 👕             | Variável |
| Educação                   | 📚             | Fixo     |
| Pets                       | 🐾             | Variável |
| Outros                     | 📦             | Variável |

Comportamento esperado:

- As categorias são criadas com valor `0` por padrão — o casal preenche os valores durante ou após o onboarding
- O casal pode editar o nome, ícone ou tipo de qualquer categoria pré-cadastrada
- O casal pode adicionar novas categorias customizadas
- O casal pode arquivar (não excluir) categorias que não se aplicam à sua realidade
- A divisão de cada categoria segue o `split_ratio` definido no onboarding (padrão 50/50), mas pode ser ajustada individualmente por categoria

---

## Regras de negócio importantes

1. Um usuário só pode estar em um casal ativo por vez.
2. O código de convite não expira — ele é permanente enquanto o usuário não estiver vinculado.
3. Após o vínculo ser confirmado (`status = active`), o código de convite de ambos os usuários é desativado automaticamente.
4. O onboarding financeiro só é acessível quando `couples.status = 'active'`.
5. A renda mensal de cada usuário é individual e visível apenas para o próprio usuário e para o parceiro vinculado.
6. O parceiro que recebe o código também precisa ter concluído o cadastro individual (incluindo verificação de e-mail e perfil básico) antes de inserir o código do outro.
7. Se o usuário inserir um código inválido ou de um perfil incompleto, o app exibe uma mensagem de erro e permite nova tentativa.

---

## Estados da jornada do usuário

| Estado               | Descrição                                | Telas disponíveis                                       |
| -------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `unverified`         | Conta criada, e-mail não confirmado      | Tela de verificação de e-mail (código OTP)              |
| `profile_incomplete` | E-mail confirmado, perfil não preenchido | Etapa 2 do cadastro                                     |
| `awaiting_partner`   | Perfil completo, sem vínculo ativo       | Vincular parceiro + Aguardando parceiro + Editar perfil |
| `linked`             | Casal vinculado                          | App completo                                            |

---

## Tom e identidade do produto

- O app é voltado para casais jovens, de 20 a 35 anos, começando a vida juntos
- O tom de voz é acolhedor, direto e levemente afetivo — sem ser infantil
- Evitar linguagem de banco ou fintech fria; preferir frases como "a vida financeira de vocês" em vez de "seu portfólio"
- As notificações e alertas devem soar como um lembrete de um amigo, não como uma cobrança

---

## O que este prompt NÃO cobre (escopo futuro)

- Onboarding financeiro completo (definição de limites e metas após o vínculo)
- Módulo de orçamento mensal compartilhado
- Sistema de alertas por categoria de gasto
- Dashboard financeiro do casal
- Importação de extratos bancários
- Relatórios mensais
