# SPEC COMPLETA — EVENTOS SOB CONTROLE
## Sistema financeiro para alunas de mentoria

> Documento de implementação para Codex.
> Stack alvo: Next.js + TypeScript + Tailwind + Supabase.
> Objetivo: substituir a planilha por um sistema simples, visual, persistente e multiusuário, com acesso exclusivo às alunas autorizadas pela mentora.

---

# 1. Visão do produto

O sistema deve funcionar como uma ferramenta financeira simples para profissionais de eventos/serviços.

A aluna entra, lança seus dados e enxerga rapidamente:

- o que vendeu;
- para quem vendeu;
- quanto vendeu;
- quanto já recebeu;
- quanto ainda tem a receber;
- quantos eventos realizou;
- despesas e custos;
- resultado/lucro;
- ticket médio;
- saldo por conta/caixa;
- distribuição do resultado final entre pró-labore, reserva, marketing, conhecimento e investimentos.

O produto **não deve parecer um ERP**. A interface deve ser extremamente limpa, rápida e compreensível por alguém que hoje usa uma planilha.

---

# 2. Regras gerais do MVP

## 2.1 Acesso

- Não existe cadastro público.
- Somente alunas autorizadas pela mentora podem entrar.
- Login final da aluna: **e-mail + senha**.
- A mentora/admin cria ou convida a aluna.
- A aluna recebe um link para definir a senha.
- Depois disso, acessa normalmente por `/login`.
- Se a aluna tiver acesso suspenso, os dados continuam salvos.
- Ao reativar o acesso, todos os dados reaparecem.
- Não apagar dados automaticamente por inadimplência.
- Hard delete de workspace/aluna não deve existir na interface do MVP.

## 2.2 Perfis de acesso

### `student`
Aluna da mentoria.

Pode:

- visualizar e editar somente os próprios dados;
- cadastrar clientes;
- cadastrar eventos;
- lançar entradas/recebimentos;
- lançar despesas;
- cadastrar contas/caixas;
- editar regras de distribuição;
- visualizar relatórios e gráficos do próprio workspace.

### `platform_admin`
Mentora / responsável pelo sistema.

Pode:

- cadastrar/invitar alunas;
- reenviar convite;
- ver status de acesso;
- ativar, suspender ou arquivar uma aluna;
- definir período de carência;
- visualizar último acesso;
- visualizar indicadores gerais da base;
- abrir uma aluna e visualizar seus dados financeiros em **modo somente leitura**;
- não deve editar lançamentos financeiros da aluna no MVP;
- visualizar log de ações administrativas.

---

# 3. Stack obrigatória

## Aplicação

- Next.js com App Router
- TypeScript
- Tailwind CSS
- React Server Components quando fizer sentido
- Server Actions para mutations do app
- Route Handlers apenas onde realmente forem necessários
- Supabase como Auth + PostgreSQL

## Bibliotecas

### Supabase
- `@supabase/supabase-js`
- `@supabase/ssr`

### Formulários e validação
- `react-hook-form`
- `zod`
- `@hookform/resolvers`

### UI
- `lucide-react`
- `sonner`
- `clsx`
- `tailwind-merge`
- Radix UI apenas para primitives necessários:
  - Dialog
  - Dropdown Menu
  - Select
  - Popover
  - Tabs
  - Tooltip

Não usar um design system visual pronto. A aparência deve ser customizada.

### Gráficos
- `recharts`

### Datas
- `date-fns`
- locale `pt-BR`

### Valores monetários
- `react-number-format`

## Não usar no MVP

- Redux
- Zustand, salvo necessidade real
- ORM adicional
- Prisma
- Drizzle
- GraphQL
- biblioteca de calendário pesada
- biblioteca de dashboard pronta

Supabase deve ser acessado diretamente por uma camada de services/queries.

---

# 4. Design system

A aplicação deve usar no máximo 3 cores de marca.

```css
--event-ink:   #120C12;
--event-paper: #FFF8FB;
--event-rose:  #F45B92;
```

Variações com alpha/opacidade são permitidas.

Exemplos:

```css
rgba(18, 12, 18, 0.08)
rgba(244, 91, 146, 0.12)
```

Não adicionar azul, verde, roxo, amarelo etc. como cores de interface.

## Fonte

- Manrope

## Visual

- clean;
- sofisticado;
- feminino sem parecer infantil;
- inspirado na landing “Sem planilha”;
- tema visual compatível com casamentos/eventos;
- grandes áreas de respiro;
- cards simples;
- bordas finas;
- raio entre 16px e 24px;
- sombras muito suaves;
- sem excesso de badges;
- sem excesso de texto;
- uma ação principal por tela.

## Componentes base

Criar:

- `AppShell`
- `Sidebar`
- `MobileBottomNav`
- `Topbar`
- `PageHeader`
- `MetricCard`
- `ChartCard`
- `EmptyState`
- `MoneyInput`
- `DateInput`
- `StatusPill`
- `ConfirmDialog`
- `FormDrawer`
- `PeriodFilter`
- `EventCard`
- `FinancialMovementRow`

---

# 5. Responsividade

## Desktop

- sidebar fixa: 232–248px;
- conteúdo central com `max-width: 1440px`;
- topbar entre 60 e 68px;
- dashboard usa grid;
- tabelas completas.

## Tablet

- sidebar recolhível;
- grids de 2 colunas;
- drawers maiores.

## Mobile

Prioridade alta.

### Regras

- nunca depender de hover;
- largura mínima considerada: 360px;
- sem scroll horizontal;
- inputs 100%;
- botões principais `min-height: 48px`;
- cards de métricas em grid 2x2 quando possível;
- gráficos com altura entre 220 e 280px;
- tabelas viram cards/listas;
- modais complexos viram bottom sheet / drawer;
- sidebar vira bottom navigation;
- CTA `+ Novo` deve ser facilmente alcançável;
- respeitar `env(safe-area-inset-bottom)`;
- fontes:
  - page title: 28–32px;
  - card title: 16–20px;
  - valores: 24–30px;
- não usar textos gigantes da landing dentro do app.

## Bottom nav

Itens:

1. Início
2. Eventos
3. `+` Novo
4. Financeiro
5. Mais

---

# 6. Navegação da aluna

Sidebar desktop:

```text
Eventos Sob Controle

Visão geral
Eventos
Financeiro
Clientes

Configurações
Sair
```

Não criar 10 itens no menu.

---

# 7. Rotas

## Público / autenticação

```text
/login
/esqueci-senha
/resetar-senha
/definir-senha
/auth/callback
```

Não criar `/signup`.

## Aluna

```text
/app
/app/eventos
/app/eventos/novo
/app/eventos/[eventId]
/app/financeiro
/app/clientes
/app/configuracoes
/app/acesso-suspenso
```

`/app` é o dashboard.

## Admin

```text
/admin
/admin/alunas
/admin/alunas/nova
/admin/alunas/[userId]
/admin/logs
```

---

# 8. Dashboard da aluna

## Header

```text
Olá, {primeiro_nome}
Visão geral do seu financeiro

[Este mês v]                  [+ Novo lançamento]
```

Filtros:

- este mês;
- mês anterior;
- este ano;
- período personalizado.

## Métricas principais

Mostrar no máximo 6 de forma imediata.

### Linha principal

1. Vendido
2. Recebido
3. A receber
4. Resultado

### Linha secundária

5. Eventos
6. Ticket médio

## Definições

### Vendido
Soma de `sale_amount` dos eventos não cancelados cuja `sale_date` esteja dentro do período.

### Recebido
Soma de transações `income` no período.

### A receber
Soma:

```text
event.sale_amount - total de recebimentos daquele evento
```

Somente valores positivos.

### Despesas
Soma de transações `expense` no período.

### Resultado
Resultado de caixa:

```text
recebido - despesas
```

### Eventos
Quantidade de eventos do período.

Para “realizados”, considerar:

```text
status = completed
```

e usar `event_date`.

### Ticket médio

```text
total vendido / quantidade de vendas
```

Ignorar eventos cancelados.

## Gráfico principal

Título:

```text
Movimento financeiro
```

Recharts `AreaChart` ou `ComposedChart`.

Mostrar por mês:

- Recebido: rosa sólido
- Despesas: ink
- Resultado: linha rosa/ink tracejada

Período padrão: últimos 6 meses.

## Gráfico secundário

Título:

```text
Eventos por mês
```

`BarChart`.

## Card de distribuição

Título:

```text
Como distribuir seu resultado
```

Mostrar o resultado positivo do período e as divisões:

- Pró-labore
- Reserva
- Marketing
- Conhecimento
- Investimento na empresa
- Lucro

As porcentagens são configuráveis.

---

# 9. Fluxo “Novo lançamento”

Botão global:

```text
+ Novo
```

Ao clicar, abrir drawer/modal com:

```text
O que você quer lançar?

[ Novo evento ]
[ Recebimento ]
[ Despesa ]
```

No mobile usar bottom sheet.

---

# 10. Eventos

## Lista `/app/eventos`

Header:

```text
Eventos
Acompanhe vendas, clientes, recebimentos e resultado.

[Buscar...]  [Período]  [Status]  [+ Novo evento]
```

Desktop:

Tabela clean.

Colunas:

- cliente/evento;
- serviço;
- data do evento;
- valor vendido;
- recebido;
- a receber;
- resultado previsto;
- status.

Mobile:

Card por evento.

Exemplo:

```text
Mariana & Lucas
Assessoria Completa

15 out 2026

Vendido        R$ 5.900
Recebido       R$ 3.900
A receber      R$ 2.000
Resultado      R$ 4.560

[Ver evento]
```

## Status

```text
scheduled
completed
cancelled
```

Labels:

- Agendado
- Realizado
- Cancelado

Não criar cor verde para realizado.
Usar rosa/ink/paper e diferenças de preenchimento/opacidade.

---

# 11. Cadastro de evento

Campos obrigatórios:

```text
Cliente
Serviço
Data da venda
Data do evento
Valor vendido
```

Campos opcionais:

```text
Valor recebido agora
Conta de destino
Custo de equipe inicial
Conta de saída
Observações
```

## UX

Cliente:

- select pesquisável;
- opção `+ Novo cliente` dentro do formulário.

Serviço:

- select de serviços cadastrados;
- opção `+ Novo serviço`.

Valor recebido agora:

- se > 0, criar uma transação `income` ligada ao evento.

Custo de equipe inicial:

- se > 0, criar uma transação `expense`;
- usar categoria padrão `Equipe`;
- ligar ao evento.

Tudo deve ser feito em uma única transação lógica da aplicação.
Se uma parte falhar, não deixar dados parcialmente criados.

---

# 12. Detalhe do evento

URL:

```text
/app/eventos/[eventId]
```

## Cabeçalho

```text
Mariana & Lucas
Assessoria Completa
15 de outubro de 2026

[Editar] [...]
```

## Cards

- Valor vendido
- Recebido
- A receber
- Custos do evento
- Resultado previsto

## Resultado previsto do evento

```text
sale_amount - despesas vinculadas ao evento
```

Esse número é diferente do resultado de caixa.

## Seções

### Recebimentos

Listar:

```text
12/09/2026   Pix       R$ 1.000
10/10/2026   Pix       R$ 1.500
```

Botão:

```text
+ Adicionar recebimento
```

### Custos do evento

Listar despesas vinculadas.

```text
Equipe             R$ 700
Deslocamento       R$ 180
Material           R$ 95
```

Botão:

```text
+ Adicionar custo
```

### Cliente

Resumo do cliente.

---

# 13. Clientes

Tabela:

`event_fin_clients`

Tela `/app/clientes`.

Campos:

```text
Nome
Telefone
E-mail
Observações
```

Mostrar:

- total de eventos;
- total vendido;
- último evento.

Ao abrir cliente:

- dados;
- eventos relacionados;
- total histórico vendido;
- total recebido.

---

# 14. Financeiro

URL:

```text
/app/financeiro
```

Tabs:

```text
Movimentações
Contas
Distribuição
```

---

# 15. Movimentações

Uma única timeline/lista com entradas e despesas.

Filtros:

- tipo;
- período;
- evento;
- categoria;
- conta.

## Tipos

```text
income
expense
```

## Entrada

Pode estar ligada a evento.

Campos:

```text
Valor
Data
Evento opcional
Conta
Forma de pagamento
Descrição opcional
```

## Despesa

Campos:

```text
Valor
Data
Categoria
Evento opcional
Conta
Descrição
```

---

# 16. Contas / caixa

O sistema deve suportar controle manual de onde o dinheiro está.

Exemplos:

- Caixa
- Nubank
- Banco Inter
- Dinheiro
- Conta Empresa

## MVP

Não integrar com banco.

Usuária cadastra contas manualmente.

Cada conta possui:

```text
Nome
Tipo
Saldo inicial
Ativa/inativa
```

Tipos:

```text
cash
bank
digital
other
```

## Saldo atual

```text
saldo_inicial
+ entradas vinculadas à conta
- despesas vinculadas à conta
```

Mostrar cards compactos por conta.

Não implementar transferência entre contas no MVP.

---

# 17. Distribuição do resultado

Base:

```text
max(resultado_de_caixa, 0)
```

Onde:

```text
resultado_de_caixa = recebimentos - despesas
```

Mostrar:

```text
Resultado disponível: R$ 8.240
```

Categorias padrão:

- Pró-labore
- Marketing
- Conhecimento
- Investimento na empresa
- Lucro
- Reserva de emergência

## Regras

- cada aluna escolhe seus percentuais;
- soma total não pode passar de 100%;
- UI deve mostrar soma atual;
- idealmente soma deve fechar em 100%;
- se estiver abaixo de 100%, exibir “X% ainda não distribuído”;
- se passar de 100%, impedir salvar.

A distribuição é **planejamento**, não movimentação automática de dinheiro.

---

# 18. Serviços

Não precisa ter item próprio no menu.

Gerenciar em:

```text
Configurações > Serviços
```

Campos:

```text
Nome
Preço padrão opcional
Ativo
```

Seeds:

- Assessoria Final
- Assessoria Parcial
- Assessoria Completa

A aluna pode criar outros.

---

# 19. Categorias de despesas

Gerenciar em:

```text
Configurações > Categorias
```

Categorias seed inspiradas na planilha:

- Equipe
- Logística / Transporte
- Marketing
- Cursos e Mentorias
- Internet
- Telefone
- Estacionamento
- Manutenção de veículo
- Escritório
- Limpeza
- Condomínio
- Impressão
- Plataforma de Eventos
- Contador
- Impostos
- Material
- Outros

Usuária pode:

- criar categoria;
- renomear;
- desativar.

Não apagar uma categoria se já tiver transações.
Usar `is_active = false`.

---

# 20. Configurações da aluna

URL:

```text
/app/configuracoes
```

Seções:

### Perfil
- nome;
- e-mail somente leitura;
- nome da empresa opcional.

### Serviços
- CRUD básico.

### Categorias
- CRUD básico.

### Distribuição
- percentuais.

### Segurança
- alterar senha;
- sair de todas as sessões opcional.

---

# 21. Painel administrativo

A mentora usa `/admin`.

Visualmente deve seguir a mesma linguagem do sistema, mas com sidebar própria.

Menu:

```text
Visão geral
Alunas
Logs
Sair
```

---

# 22. Dashboard admin

Métricas:

- total de alunas;
- acessos ativos;
- em carência;
- suspensas;
- novas neste mês.

Gráfico simples:

```text
Alunas cadastradas por mês
```

Lista:

```text
Últimos acessos
```

Não colocar dados financeiros agregados de todas as alunas como foco principal.

---

# 23. Lista de alunas

URL:

```text
/admin/alunas
```

Campos:

- nome;
- e-mail;
- status;
- cadastro;
- último acesso.

Filtros:

- ativa;
- carência;
- suspensa;
- arquivada.

Ações:

- ver;
- reenviar convite;
- suspender;
- reativar;
- arquivar.

CTA:

```text
+ Adicionar aluna
```

---

# 24. Criar/invitar aluna

Não usar cadastro público.

Fluxo:

1. Admin clica `Adicionar aluna`.
2. Informa:
   - nome;
   - e-mail.
3. Backend cria:
   - workspace;
   - convite;
   - usuário Supabase via Admin API.
4. Supabase envia link de convite.
5. Aluna abre link.
6. Página `/definir-senha`.
7. Aluna cria senha.
8. Redirecionar para onboarding.
9. Login futuro é e-mail + senha.

## Onboarding

Primeiro acesso:

```text
Bem-vinda ao Eventos Sob Controle

Como você quer chamar seu negócio?
[________________]

[Começar]
```

Depois:

- cria wallet padrão `Caixa Geral`;
- cria categorias padrão;
- cria serviços padrão;
- cria distribuição padrão.

---

# 25. Status de acesso da aluna

Workspace possui:

```text
active
grace
suspended
archived
```

## `active`

Uso normal.

## `grace`

Uso normal, mas admin visualiza que está em carência.

Não precisa mostrar aviso para aluna no MVP.

## `suspended`

A aluna consegue autenticar, porém deve ser redirecionada para:

```text
/app/acesso-suspenso
```

Mensagem simples:

```text
Seu acesso está temporariamente suspenso.

Se precisar regularizar ou tiver alguma dúvida,
entre em contato com a mentoria.
```

Nenhum dado financeiro é apagado.

## `archived`

Conta sem uso, mantida por segurança/histórico.
Não permitir entrada no app.

---

# 26. Visualização de aluna pelo admin

URL:

```text
/admin/alunas/[userId]
```

Mostrar:

### Cabeçalho

- nome;
- e-mail;
- status;
- cadastro;
- último acesso.

### Ações

- suspender;
- reativar;
- colocar em carência;
- arquivar;
- reenviar convite.

### Resumo financeiro — somente leitura

- vendido;
- recebido;
- despesas;
- resultado;
- eventos;
- ticket médio.

Botão:

```text
Ver dados da aluna
```

O admin pode navegar por:

- eventos;
- clientes;
- movimentações.

Mas tudo deve ser readonly.

Não permitir:

- criar;
- editar;
- apagar;

dados financeiros da aluna no MVP.

---

# 27. Banco de dados — convenção

Todas as tabelas deste projeto devem começar com:

```text
event_fin_
```

Isso é obrigatório para facilitar identificação no Supabase.

Não usar nomes genéricos como:

```text
profiles
events
clients
transactions
```

Usar:

```text
event_fin_profiles
event_fin_events
event_fin_clients
event_fin_transactions
```

---

# 28. Enums PostgreSQL

Criar:

```sql
event_fin_system_role
  'student'
  'platform_admin'

event_fin_member_role
  'owner'

event_fin_workspace_status
  'active'
  'grace'
  'suspended'
  'archived'

event_fin_event_status
  'scheduled'
  'completed'
  'cancelled'

event_fin_transaction_type
  'income'
  'expense'

event_fin_wallet_type
  'cash'
  'bank'
  'digital'
  'other'

event_fin_payment_method
  'pix'
  'cash'
  'credit_card'
  'debit_card'
  'bank_transfer'
  'other'

event_fin_invite_status
  'pending'
  'accepted'
  'expired'
  'cancelled'
```

---

# 29. Tabelas Supabase

## 29.1 `event_fin_profiles`

Relaciona o usuário do Supabase Auth ao sistema.

```sql
id uuid primary key references auth.users(id) on delete cascade
full_name text not null
system_role event_fin_system_role not null default 'student'
last_seen_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Índices:

```sql
system_role
last_seen_at
```

---

## 29.2 `event_fin_workspaces`

Uma aluna possui um workspace financeiro.

```sql
id uuid primary key default gen_random_uuid()
name text not null
status event_fin_workspace_status not null default 'active'
currency text not null default 'BRL'
timezone text not null default 'America/Sao_Paulo'
grace_until timestamptz
onboarding_completed_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
archived_at timestamptz
```

---

## 29.3 `event_fin_workspace_members`

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid not null references event_fin_workspaces(id) on delete cascade
user_id uuid not null references auth.users(id) on delete cascade
role event_fin_member_role not null default 'owner'
created_at timestamptz not null default now()

unique(workspace_id, user_id)
```

Índices:

```sql
user_id
workspace_id
```

No MVP:

```text
1 aluna = 1 workspace
```

Mas manter membership para não bloquear expansão futura.

---

## 29.4 `event_fin_invites`

```sql
id uuid primary key default gen_random_uuid()
email citext not null
full_name text not null
workspace_id uuid references event_fin_workspaces(id) on delete cascade
status event_fin_invite_status not null default 'pending'
auth_user_id uuid references auth.users(id)
invited_by uuid not null references auth.users(id)
expires_at timestamptz
accepted_at timestamptz
created_at timestamptz not null default now()
```

---

## 29.5 `event_fin_clients`

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid not null references event_fin_workspaces(id) on delete cascade
name text not null
phone text
email text
notes text
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Índices:

```sql
workspace_id
(workspace_id, name)
```

---

## 29.6 `event_fin_services`

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid not null references event_fin_workspaces(id) on delete cascade
name text not null
default_price numeric(14,2)
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

unique(workspace_id, name)
```

---

## 29.7 `event_fin_events`

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid not null references event_fin_workspaces(id) on delete cascade
client_id uuid not null references event_fin_clients(id)
service_id uuid references event_fin_services(id)

title text
service_name_snapshot text not null

sale_date date not null
event_date date
sale_amount numeric(14,2) not null check (sale_amount >= 0)

status event_fin_event_status not null default 'scheduled'
notes text

created_at timestamptz not null default now()
updated_at timestamptz not null default now()
cancelled_at timestamptz
```

Regras:

- `service_name_snapshot` mantém o nome usado mesmo se serviço for renomeado.
- `title` pode ser:
  - casamento do casal;
  - debutante;
  - nome do evento.
- se `title` vazio, mostrar nome do cliente.

Índices:

```sql
workspace_id
client_id
service_id
event_date
sale_date
status
(workspace_id, sale_date)
(workspace_id, event_date)
```

---

## 29.8 `event_fin_wallets`

Contas/caixa manual.

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid not null references event_fin_workspaces(id) on delete cascade
name text not null
type event_fin_wallet_type not null default 'bank'
opening_balance numeric(14,2) not null default 0
is_active boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

unique(workspace_id, name)
```

---

## 29.9 `event_fin_categories`

Principalmente despesas.

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid not null references event_fin_workspaces(id) on delete cascade
name text not null
transaction_type event_fin_transaction_type not null default 'expense'
is_system boolean not null default false
is_active boolean not null default true
sort_order integer not null default 0
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

unique(workspace_id, name, transaction_type)
```

---

## 29.10 `event_fin_transactions`

Tabela financeira central.

```sql
id uuid primary key default gen_random_uuid()

workspace_id uuid not null references event_fin_workspaces(id) on delete cascade
type event_fin_transaction_type not null

event_id uuid references event_fin_events(id) on delete set null
wallet_id uuid references event_fin_wallets(id) on delete set null
category_id uuid references event_fin_categories(id) on delete restrict

amount numeric(14,2) not null check (amount > 0)
occurred_at date not null

payment_method event_fin_payment_method
description text
notes text

created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Regras:

### income

- categoria pode ser null;
- pode ligar a `event_id`;
- se ligada a evento, conta como recebimento daquele evento.

### expense

- categoria deve ser obrigatória;
- `event_id` é opcional;
- com `event_id`: custo daquele evento;
- sem `event_id`: despesa geral.

Índices:

```sql
workspace_id
event_id
wallet_id
category_id
type
occurred_at
(workspace_id, occurred_at)
(workspace_id, type, occurred_at)
(event_id, type)
```

---

# 30. Distribuição do resultado — tabelas

Precisamos manter histórico de mudanças de percentual.

## 30.1 `event_fin_allocation_sets`

```sql
id uuid primary key default gen_random_uuid()
workspace_id uuid not null references event_fin_workspaces(id) on delete cascade
effective_from date not null
created_at timestamptz not null default now()

unique(workspace_id, effective_from)
```

## 30.2 `event_fin_allocation_items`

```sql
id uuid primary key default gen_random_uuid()
allocation_set_id uuid not null references event_fin_allocation_sets(id) on delete cascade
name text not null
percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100)
sort_order integer not null default 0

unique(allocation_set_id, name)
```

Ao alterar percentuais:

- não editar retrospectivamente;
- criar novo `allocation_set`;
- `effective_from` = primeiro dia do mês atual ou data escolhida;
- dashboard usa o conjunto válido para o período.

---

# 31. Log administrativo

## `event_fin_admin_audit_logs`

```sql
id uuid primary key default gen_random_uuid()
admin_user_id uuid not null references auth.users(id)
target_user_id uuid references auth.users(id)
workspace_id uuid references event_fin_workspaces(id)
action text not null
metadata jsonb not null default '{}'::jsonb
created_at timestamptz not null default now()
```

Exemplos de `action`:

```text
student_invited
student_suspended
student_reactivated
student_archived
invite_resent
grace_changed
```

---

# 32. Triggers

Criar função padrão:

```sql
event_fin_set_updated_at()
```

Aplicar em:

- profiles;
- workspaces;
- clients;
- services;
- events;
- wallets;
- categories;
- transactions.

Criar índices e constraints nas migrations.

---

# 33. RLS

Ativar RLS em **todas** as tabelas `event_fin_*`.

Não confiar apenas na proteção das rotas Next.js.

## Helpers SQL

Criar funções:

```sql
event_fin_is_platform_admin()
event_fin_user_has_workspace(uuid)
event_fin_user_has_active_workspace(uuid)
```

Recomendação:

- `SECURITY DEFINER`;
- `SET search_path = public`;
- não expor lógica insegura;
- retornar boolean;
- revogar permissões desnecessárias.

---

# 34. Matriz de RLS

## Student

### `event_fin_profiles`
- SELECT próprio perfil;
- UPDATE próprio perfil limitado via backend;
- sem INSERT direto.

### `event_fin_workspaces`
- SELECT workspace em que é member;
- student não altera `status`.

### Dados financeiros
Student pode CRUD somente quando:

```text
é membro do workspace
AND workspace.status IN ('active', 'grace')
```

Tabelas:

- clients;
- services;
- events;
- wallets;
- categories;
- transactions;
- allocation_sets;
- allocation_items.

## Suspenso

Pode:

- autenticar;
- SELECT básico de perfil/workspace para saber o status.

Não pode:

- ler dados financeiros;
- criar;
- atualizar;
- apagar.

## Admin

Admin pode:

- SELECT em todos os workspaces;
- SELECT em todos os dados financeiros;
- gerenciar profiles/workspaces/invites;
- não deve ter policy de UPDATE/DELETE nas transações financeiras das alunas.

Operações administrativas sensíveis devem ser feitas por Server Action com Supabase service role.

---

# 35. Supabase Auth

Variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

`SUPABASE_SERVICE_ROLE_KEY`:

- somente servidor;
- nunca importar em Client Component;
- nunca usar `NEXT_PUBLIC_`.

Criar:

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/admin.ts
```

`admin.ts` deve usar service role e ser `server-only`.

---

# 36. Fluxo de convite

Server Action:

```ts
inviteStudent({
  fullName,
  email
})
```

Passos:

1. validar admin;
2. garantir e-mail não cadastrado;
3. criar `event_fin_workspaces`;
4. criar invite;
5. chamar Supabase Admin API:
   - `inviteUserByEmail`;
   - metadata:
     - `event_fin_workspace_id`;
     - `event_fin_full_name`;
     - `event_fin_system_role = student`.
6. gravar `auth_user_id`;
7. criar membership;
8. criar seeds do workspace;
9. registrar audit log.

Se convite falhar:

- rollback lógico;
- workspace/invite não deve ficar em estado inconsistente.

Usar transação via RPC quando necessário.

---

# 37. Definir senha

Após convite:

```text
/auth/callback
→ /definir-senha
```

Tela:

```text
Crie sua senha

Nova senha
Confirmar senha

[Salvar senha]
```

Depois:

```text
/app
```

Sem signup público.

---

# 38. Middleware / guards

Middleware:

- renova cookies Supabase;
- não deve ser a única segurança.

Layouts server-side devem validar.

## `/app`

Verificar:

```text
session existe
role = student
workspace existe
status
```

Se:

```text
suspended → /app/acesso-suspenso
archived → /app/acesso-suspenso
```

## `/admin`

Verificar:

```text
system_role = platform_admin
```

Caso contrário retornar 403 ou redirect.

---

# 39. Queries principais

Criar camada:

```text
src/features/dashboard/queries.ts
src/features/events/queries.ts
src/features/finance/queries.ts
src/features/admin/queries.ts
```

Não espalhar queries Supabase por componentes.

---

# 40. Cálculos

Centralizar em:

```text
src/lib/finance/calculations.ts
```

Funções puras:

```ts
calculateEventReceived()
calculateEventOutstanding()
calculateEventExpenses()
calculateEventExpectedResult()
calculateCashResult()
calculateAverageTicket()
calculateWalletBalance()
calculateAllocation()
```

---

# 41. Fórmulas oficiais

## Recebido de um evento

```text
SUM(transactions.amount)
WHERE type = income
AND event_id = evento
```

## A receber do evento

```text
MAX(sale_amount - received, 0)
```

## Custos do evento

```text
SUM(transactions.amount)
WHERE type = expense
AND event_id = evento
```

## Resultado previsto do evento

```text
sale_amount - event_expenses
```

## Resultado de caixa do período

```text
receipts_in_period - expenses_in_period
```

## Ticket médio

```text
sum(sale_amount) / count(events)
```

## Saldo da wallet

```text
opening_balance
+ SUM(income)
- SUM(expense)
```

## Distribuição

```text
base = MAX(cash_result, 0)

category_amount =
base * percentage / 100
```

---

# 42. View/RPC recomendada para eventos

Criar uma RPC ou view segura para retornar:

```text
event_id
sale_amount
received_amount
outstanding_amount
expense_amount
expected_result
```

Nome sugerido:

```text
event_fin_event_financial_summary
```

Se usar view, garantir segurança compatível com RLS.

Alternativamente criar RPC:

```sql
event_fin_get_event_financials(p_workspace_id uuid)
```

A função deve validar acesso ao workspace.

---

# 43. RPC de dashboard

Criar:

```text
event_fin_get_dashboard_metrics(
  p_workspace_id,
  p_start_date,
  p_end_date
)
```

Retornar:

```json
{
  "sold": 28400,
  "received": 21900,
  "expenses": 13660,
  "cash_result": 8240,
  "outstanding": 6500,
  "event_count": 12,
  "completed_event_count": 9,
  "average_ticket": 2366.67
}
```

Também retornar séries ou criar segunda RPC:

```text
event_fin_get_monthly_series(...)
```

---

# 44. Estrutura de pastas

```text
src/
  app/
    (auth)/
      login/
      esqueci-senha/
      resetar-senha/
      definir-senha/
    auth/
      callback/
    (student)/
      app/
        layout.tsx
        page.tsx
        eventos/
          page.tsx
          novo/
          [eventId]/
        financeiro/
        clientes/
        configuracoes/
        acesso-suspenso/
    admin/
      layout.tsx
      page.tsx
      alunas/
        page.tsx
        nova/
        [userId]/
      logs/

  components/
    ui/
    layout/
    charts/

  features/
    auth/
    dashboard/
    events/
    clients/
    finance/
    allocations/
    settings/
    admin/

  lib/
    supabase/
      client.ts
      server.ts
      admin.ts
    auth/
      guards.ts
    finance/
      calculations.ts
      currency.ts
    utils/
      cn.ts

  types/
    database.types.ts
    domain.ts

supabase/
  migrations/
    001_event_fin_enums.sql
    002_event_fin_core.sql
    003_event_fin_finance.sql
    004_event_fin_allocations.sql
    005_event_fin_admin.sql
    006_event_fin_rls.sql
    007_event_fin_functions.sql
    008_event_fin_seed_helpers.sql
```

---

# 45. Actions

Criar actions separadas.

## Eventos

```text
createEvent
updateEvent
cancelEvent
markEventCompleted
```

## Clientes

```text
createClient
updateClient
archiveClient
```

## Transações

```text
createIncome
createExpense
updateTransaction
deleteTransaction
```

## Wallets

```text
createWallet
updateWallet
archiveWallet
```

## Configurações

```text
createService
updateService
archiveService
createCategory
updateCategory
archiveCategory
updateAllocationRules
```

## Admin

```text
inviteStudent
resendStudentInvite
suspendStudent
reactivateStudent
setStudentGrace
archiveStudent
```

Todas com:

- `zod`;
- autenticação;
- autorização;
- validação de workspace;
- `revalidatePath`.

---

# 46. Validações

## Dinheiro

- armazenar em `numeric(14,2)`;
- nunca usar float para cálculos de dinheiro;
- converter adequadamente no frontend.

## Evento

```text
sale_amount >= 0
event_date pode ser null
client obrigatório
sale_date obrigatório
```

## Transação

```text
amount > 0
occurred_at obrigatório
workspace obrigatório
expense exige category_id
```

## Distribuição

```text
cada percentage entre 0 e 100
total <= 100
```

---

# 47. Formatação brasileira

Moeda:

```ts
new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})
```

Datas:

```text
dd/MM/yyyy
```

UI:

```text
15 de outubro de 2026
```

Timezone padrão:

```text
America/Sao_Paulo
```

---

# 48. Estados vazios

Não mostrar dashboard cheio de zeros sem contexto.

## Sem eventos

```text
Seu financeiro começa pelo primeiro evento.

Cadastre uma venda para acompanhar recebimentos,
custos e resultado.

[+ Cadastrar primeiro evento]
```

## Sem movimentações

```text
Nenhuma movimentação neste período.
```

## Sem clientes

```text
Você ainda não cadastrou clientes.

[+ Novo cliente]
```

---

# 49. Loading

Usar skeletons.

Não usar spinner de tela inteira em navegação normal.

Skeletons:

- cards do dashboard;
- gráfico;
- tabela/lista.

---

# 50. Feedback de ações

Sonner.

Exemplos:

```text
Evento criado
Recebimento adicionado
Despesa salva
Alterações salvas
Aluna convidada
Acesso suspenso
Acesso reativado
```

Erros:

```text
Não foi possível salvar. Tente novamente.
```

Detalhe técnico vai para log, não para usuário.

---

# 51. Exclusões e arquivamento

## Evento

Pode cancelar.
Não hard delete por padrão.

## Cliente

Desativar se tiver eventos.

## Serviço/categoria/wallet

Arquivar/desativar se já usados.

## Transação

Pode excluir, mas sempre pedir confirmação.

## Aluna

Nunca hard delete pela UI admin.

---

# 52. Auditoria mínima

Admin actions devem registrar `event_fin_admin_audit_logs`.

Também registrar:

- quem executou;
- alvo;
- quando;
- metadata relevante.

Não precisa auditar cada lançamento financeiro no MVP.

---

# 53. Segurança

Obrigatório:

- RLS;
- service role somente server-side;
- nenhuma chave privada no browser;
- validação server-side com Zod;
- workspace_id nunca confiado apenas pelo client;
- ao receber workspace_id, verificar membership;
- admin routes verificam role no servidor;
- sem public signup;
- e-mail deve ser normalizado;
- não retornar stack trace para usuário;
- queries financeiras devem sempre estar filtradas pelo workspace permitido.

---

# 54. Seed de novo workspace

Ao criar uma aluna, executar:

```text
createDefaultWorkspaceData(workspaceId)
```

Criar:

## Wallet

```text
Caixa Geral
type = cash
opening_balance = 0
```

## Serviços

```text
Assessoria Final
Assessoria Parcial
Assessoria Completa
```

## Categorias

As categorias descritas na seção 19.

## Distribuição inicial

Sugestão inicial apenas para demo:

```text
Pró-labore              50%
Reserva de emergência   20%
Investimento             15%
Marketing                10%
Conhecimento              5%
```

Não tratar esses percentuais como regra financeira obrigatória.
A aluna pode alterar.

---

# 55. Experiência visual do dashboard

Referência estética:

```text
paper background
ink text/sidebar
rose accent
```

Exemplo desktop:

```text
┌──────────────┬────────────────────────────────────────────┐
│              │ Olá, Shirley                              │
│  LOGO        │ Visão geral                  Este mês  +  │
│              │                                            │
│  Início      │ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
│  Eventos     │ │Vendido │ │Recebido│ │A receber│ │Result│ │
│  Financeiro  │ └────────┘ └────────┘ └────────┘ └──────┘ │
│  Clientes    │                                            │
│              │ ┌────────────────────┐ ┌────────────────┐  │
│              │ │ Movimento          │ │ Eventos / mês  │  │
│              │ │ gráfico            │ │ gráfico        │  │
│              │ └────────────────────┘ └────────────────┘  │
│ Config.      │                                            │
└──────────────┴────────────────────────────────────────────┘
```

---

# 56. Gráficos

## Recharts

### Dashboard
`ComposedChart`

- recebido: `#F45B92`;
- despesas: `#120C12`;
- resultado: stroke `#F45B92`, dashed;
- grid quase invisível.

### Eventos/mês
`BarChart`

- rosa;
- raio superior.

### Distribuição
Não precisa donut obrigatoriamente.
Pode usar barras horizontais, mais legíveis.

Evitar gráficos coloridos estilo BI.

---

# 57. Animações

Aplicação deve ser mais discreta que a landing.

Usar:

- `transition-all duration-200`;
- fade/slide curto ao abrir drawer;
- skeleton;
- barra do gráfico animando no mount;
- hover leve no desktop;
- nada que atrase uso.

Não usar animação infinita dentro do app.

---

# 58. Páginas críticas — prioridade de implementação

## Fase 1
- Supabase setup;
- migrations;
- Auth;
- RLS;
- invite flow;
- layouts.

## Fase 2
- dashboard;
- clientes;
- serviços;
- eventos.

## Fase 3
- transactions;
- finance page;
- wallets;
- event financial summary.

## Fase 4
- distribution;
- charts;
- responsive/mobile.

## Fase 5
- admin;
- student invite;
- suspend/reactivate;
- read-only student financial view.

## Fase 6
- loading states;
- empty states;
- QA;
- accessibility;
- final polish.

---

# 59. Testes mínimos

Pode usar Vitest para funções puras.
Playwright é recomendado para fluxos principais.

## Unit

Testar:

```text
outstanding
event expected result
cash result
average ticket
wallet balance
allocation percentages
```

## E2E

### Student
1. login;
2. criar cliente;
3. criar evento;
4. adicionar recebimento;
5. adicionar despesa;
6. verificar dashboard;
7. verificar a receber;
8. completar evento.

### Admin
1. login admin;
2. convidar aluna;
3. verificar listagem;
4. suspender;
5. student é bloqueada do app;
6. reativar;
7. student volta com os mesmos dados.

---

# 60. Critérios de aceite

O MVP só é considerado concluído quando:

- [ ] não existe signup público;
- [ ] admin consegue convidar aluna;
- [ ] aluna consegue definir senha;
- [ ] login e-mail/senha funciona;
- [ ] cada aluna vê apenas os próprios dados;
- [ ] RLS foi validada;
- [ ] aluna cria cliente;
- [ ] aluna cria evento;
- [ ] aluna registra múltiplos recebimentos;
- [ ] aluna registra despesas gerais;
- [ ] aluna registra despesas de evento;
- [ ] vendido é calculado corretamente;
- [ ] recebido é calculado corretamente;
- [ ] a receber é calculado corretamente;
- [ ] resultado é calculado corretamente;
- [ ] ticket médio é calculado;
- [ ] eventos mês/ano são exibidos;
- [ ] resultado previsto por evento funciona;
- [ ] wallets exibem saldo;
- [ ] distribuição por percentual funciona;
- [ ] gráficos funcionam;
- [ ] admin lista alunas;
- [ ] admin visualiza dados de uma aluna em readonly;
- [ ] admin suspende acesso;
- [ ] suspensão não apaga dados;
- [ ] reativação devolve acesso com dados intactos;
- [ ] layout funciona em 360px;
- [ ] nenhuma tela principal possui scroll horizontal;
- [ ] app respeita as 3 cores;
- [ ] loading/empty/error states existem;
- [ ] service role não aparece no client bundle.

---

# 61. Fora do escopo do MVP

Não implementar agora:

- Open Finance;
- integração bancária automática;
- emissão de nota fiscal;
- emissão de boleto;
- geração automática de Pix;
- gateway de pagamento;
- conciliação bancária;
- transferências entre contas;
- recorrência automática de despesas;
- contabilidade fiscal;
- DRE contábil formal;
- estoque;
- CRM;
- funil de vendas;
- automações de WhatsApp;
- app nativo;
- push notifications;
- múltiplos funcionários por aluna;
- importação automática da planilha;
- exportações fiscais;
- assinatura/cobrança automática da mensalidade.

Esses itens podem ser versões futuras.

---

# 62. Observações para o Codex

## Regra 1
Não inventar funcionalidades que não estejam nesta spec.

## Regra 2
Priorizar clareza e simplicidade.

## Regra 3
Toda tabela de domínio deve usar prefixo:

```text
event_fin_
```

## Regra 4
Não duplicar lógica financeira no frontend e backend.

Fórmulas devem ficar centralizadas e, quando possível, agregações devem vir do PostgreSQL.

## Regra 5
Não confiar em `workspace_id` fornecido pelo navegador.

Sempre validar via usuário autenticado/RLS.

## Regra 6
Admin usa service role apenas em código server-side.

## Regra 7
Student e admin usam o mesmo projeto Supabase.

## Regra 8
UI deve parecer um produto especializado para profissionais de eventos, não um ERP genérico.

## Regra 9
Textos principais devem usar linguagem leiga:

Preferir:

```text
Vendido
Recebido
A receber
Despesas
Resultado
Eventos
```

Evitar:

```text
Receita operacional líquida
Passivo
Competência
DRE
```

## Regra 10
Mobile deve ser tratado como primeira classe, não como adaptação posterior.

---

# 63. Resultado esperado

Ao concluir, deve existir um sistema em que:

```text
ADMIN
   ↓
convida apenas quem comprou a mentoria
   ↓
ALUNA
   ↓
define senha
   ↓
entra no sistema
   ↓
cadastra clientes e eventos
   ↓
lança recebimentos e despesas
   ↓
sistema calcula automaticamente
   ↓
vendas / recebido / a receber / custos / resultado
   ↓
acompanha mês e ano
   ↓
distribui resultado
```

E o admin consegue:

```text
ver alunas
→ controlar acesso
→ suspender/reactivar
→ visualizar dados em readonly
→ manter histórico
```

Sem apagar os dados financeiros quando o acesso for suspenso.
