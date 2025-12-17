# Smart Biz360 - Sistema de Gestão Multi-Tenant

## Visão Geral

O **Smart Biz360** é um sistema de gestão empresarial completo, desenvolvido com arquitetura multi-tenant para comercialização como SaaS. O sistema oferece módulos integrados para vendas, finanças, equipe e integrações com marketplaces.

## Tecnologias Utilizadas

### Backend
- **Node.js** com Express.js
- **PostgreSQL** como banco de dados
- **JWT** para autenticação
- **Stripe** para processamento de pagamentos

### Frontend
- **React 18** com TypeScript
- **Vite** como bundler
- **TailwindCSS** para estilização
- **Shadcn/UI** para componentes

## Arquitetura Multi-Tenant

O sistema implementa uma arquitetura multi-tenant com isolamento completo de dados:

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Biz360 Platform                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Tenant A│  │ Tenant B│  │ Tenant C│  │ Tenant N│        │
│  │ (CNPJ)  │  │ (CNPJ)  │  │ (CNPJ)  │  │ (CNPJ)  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│  ┌────┴────────────┴────────────┴────────────┴────┐        │
│  │              Camada de Isolamento              │        │
│  └────────────────────────────────────────────────┘        │
│                           │                                 │
│  ┌────────────────────────┴────────────────────────┐       │
│  │              PostgreSQL Database                │       │
│  │  (Row-Level Security por tenant_id)            │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Módulos do Sistema

### 1. Gestão de Vendas
- Controle de pedidos e clientes
- Gestão de produtos e estoque
- Integração com marketplaces

### 2. Fluxo de Caixa Inteligente
- Dashboard financeiro em tempo real
- Previsão de fluxo de caixa com IA
- Categorização automática de transações
- Alertas de vencimentos

### 3. Gestão de Equipe
- Quadro Kanban de tarefas
- Sistema de gamificação
- Ranking e conquistas
- Relatórios de produtividade

### 4. Automação Tributária
- Cálculo automático de impostos
- Suporte a diferentes regimes tributários
- Integração com notas fiscais

### 5. Integrações
- Mercado Livre (API oficial)
- Amazon
- Shopee
- Magalu
- Americanas

## Planos de Assinatura

| Plano | Preço/mês | Usuários | Produtos | Pedidos/mês |
|-------|-----------|----------|----------|-------------|
| Gratuito | R$ 0 | 1 | 50 | 100 |
| Starter | R$ 97 | 3 | 500 | 1.000 |
| Professional | R$ 197 | 10 | 2.000 | 2.000 |
| Business | R$ 397 | 25 | Ilimitado | Ilimitado |
| Enterprise | Sob consulta | Ilimitado | Ilimitado | Ilimitado |

## Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Configuração

1. Clone o repositório:
```bash
git clone https://github.com/danilolimaCabral/markethub-crm-v2.git
cd markethub-crm-v2
```

2. Instale as dependências:
```bash
npm install --legacy-peer-deps
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute as migrations:
```bash
# Criar banco de dados
psql -U postgres -c "CREATE DATABASE smart_biz360;"

# Executar migrations
psql -U postgres -d smart_biz360 -f db/migrations/000_base_schema.sql
psql -U postgres -d smart_biz360 -f db/migrations/004_subscriptions_and_plans.sql
psql -U postgres -d smart_biz360 -f db/migrations/005_smart_biz360_modules.sql
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura de Diretórios

```
markethub-crm-v2/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilitários
│   └── public/             # Assets estáticos
├── server/                 # Backend Express
│   ├── routes/             # Rotas da API
│   ├── services/           # Serviços de negócio
│   ├── middleware/         # Middlewares
│   └── integrations/       # Integrações externas
├── db/
│   └── migrations/         # Scripts SQL
└── .env                    # Variáveis de ambiente
```

## APIs Principais

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Renovar token

### Registro de Tenant
- `POST /api/register/validate-cnpj` - Validar CNPJ
- `POST /api/register/create` - Criar novo tenant
- `GET /api/register/plans` - Listar planos disponíveis

### Assinaturas
- `GET /api/subscriptions/current` - Assinatura atual
- `POST /api/subscriptions/checkout` - Iniciar checkout
- `POST /api/subscriptions/cancel` - Cancelar assinatura

### Fluxo de Caixa
- `GET /api/cashflow/summary` - Resumo financeiro
- `GET /api/cashflow/transactions` - Listar transações
- `POST /api/cashflow/transactions` - Criar transação
- `GET /api/cashflow/forecast` - Previsão de caixa

### Tarefas
- `GET /api/tasks` - Listar tarefas
- `POST /api/tasks` - Criar tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `GET /api/tasks/leaderboard` - Ranking de gamificação

## Webhooks

O sistema recebe webhooks do Stripe para processar eventos de pagamento:

- `checkout.session.completed` - Checkout concluído
- `invoice.paid` - Fatura paga
- `invoice.payment_failed` - Falha no pagamento
- `customer.subscription.updated` - Assinatura atualizada
- `customer.subscription.deleted` - Assinatura cancelada

## Segurança

- Autenticação JWT com refresh tokens
- Suporte a 2FA (Two-Factor Authentication)
- Isolamento de dados por tenant
- Criptografia de senhas com bcrypt
- Rate limiting nas APIs
- Validação de CNPJ no cadastro

## Variáveis de Ambiente

```env
# Servidor
NODE_ENV=production
PORT=5000

# Banco de Dados
DATABASE_URL=postgresql://user:pass@host:5432/smart_biz360

# JWT
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx
```

## Suporte

Para suporte técnico ou dúvidas sobre o sistema:
- Email: suporte@smartbiz360.com
- Documentação: https://docs.smartbiz360.com

## Licença

Este software é proprietário e licenciado sob termos comerciais.
© 2024 Smart Biz360. Todos os direitos reservados.
