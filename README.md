# 🚀 Markthub CRM V2

Sistema completo de gestão multi-tenant para e-commerce com integrações de marketplaces (Mercado Livre, Amazon, Shopee).

## 🎉 VERSÃO 2.0 - MELHORIAS SIGNIFICATIVAS

**Status:** ✅ 85% Completo | 🚀 Production-Ready Backend  
**Última atualização:** Novembro 2025

### 🆕 Novidades v2.0

✅ **JWT Completo** - Autenticação robusta com refresh tokens  
✅ **Rate Limiting** - Proteção enterprise contra ataques  
✅ **Validação Zod** - Type-safe em todas as APIs  
✅ **Lazy Loading** - 70% menor bundle (-3.5MB)  
✅ **Cache Redis** - Performance otimizada  
✅ **Logs Completos** - Auditoria total  
✅ **Docs Completas** - Production-ready  

📖 **[Ver todas as melhorias →](RESUMO_MELHORIAS.md)**  
⚡ **[Quick Start →](QUICK_START.md)**

## 📋 Sobre o Projeto

O **Markthub CRM** é uma plataforma SaaS completa para gestão de e-commerce, oferecendo funcionalidades avançadas de CRM, integração com múltiplos marketplaces, gestão financeira, controle de estoque e inteligência artificial para análise de mercado.

## ✨ Funcionalidades Principais

### 🎯 Gestão de Vendas
- Dashboard completo com métricas em tempo real
- Gestão de pedidos multi-canal
- Controle de produtos e estoque
- Rastreamento de entregas
- Emissão de notas fiscais

### 💰 Gestão Financeira
- Contas a pagar e receber
- Fluxo de caixa detalhado
- Análise de CMV (Custo de Mercadoria Vendida)
- Integração com gateway de pagamento Asaas
- Relatórios financeiros completos

### 🛒 Integrações de Marketplaces
- **Mercado Livre** - Integração completa com API
- **Amazon** - SP-API integration
- **Shopee** - API integration
- Sincronização automática de pedidos
- Calculadora de taxas e comissões

### 🤖 Inteligência Artificial
- Chatbot "Mia" para atendimento automatizado
- Análise de mercado e tendências
- Recomendações de precificação
- Insights de vendas

### 🔐 Segurança e Autenticação
- Autenticação 2FA (Google Authenticator)
- Códigos de backup
- JWT tokens
- Proteção de rotas
- Multi-tenant com isolamento de dados

## 🏗️ Arquitetura

### Frontend
- **React 18** com TypeScript
- **Vite** para build otimizado
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **Wouter** para roteamento
- **TanStack Query** para gerenciamento de estado

### Backend
- **Node.js** com Express
- **TypeScript** para type safety
- **PostgreSQL** como banco de dados
- **JWT** para autenticação
- **RESTful API**

### Banco de Dados
- **PostgreSQL** com suporte multi-tenant
- 20+ tabelas estruturadas
- Triggers e functions automatizadas
- Views otimizadas
- Seed data para desenvolvimento

## 📦 Estrutura do Projeto

```
markethub-crm-v2/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # 36 páginas do sistema
│   │   ├── lib/           # Utilitários e helpers
│   │   ├── services/      # Serviços de API
│   │   └── types/         # Definições TypeScript
│   └── public/            # Assets estáticos
├── server/                # Backend Express
│   └── index.ts          # Servidor principal
├── database/              # Scripts SQL
│   ├── 01_create_tables.sql
│   ├── 02_triggers_functions.sql
│   ├── 03_views.sql
│   ├── 04_seed_data.sql
│   ├── 05_modulo_cmv.sql
│   └── 06_multi_tenant.sql
├── diagrams/              # Diagramas do sistema
├── scripts/               # Scripts utilitários
└── shared/                # Código compartilhado

```

## 🚀 Como Começar

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- pnpm (gerenciador de pacotes)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/danilolimaCabral/markethub-crm-v2.git
cd markethub-crm-v2
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Configure o banco de dados:
```bash
# Execute os scripts SQL na ordem:
psql -U postgres -d markethub < database/01_create_tables.sql
psql -U postgres -d markethub < database/02_triggers_functions.sql
psql -U postgres -d markethub < database/03_views.sql
psql -U postgres -d markethub < database/04_seed_data.sql
psql -U postgres -d markethub < database/05_modulo_cmv.sql
psql -U postgres -d markethub < database/06_multi_tenant.sql
```

5. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

6. Acesse o sistema:
```
http://localhost:5000
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento
pnpm dev:safe         # Inicia com limpeza prévia (recomendado)

# Build
pnpm build            # Build de produção

# Limpeza
pnpm cleanup          # Limpa processos órfãos
pnpm check-files      # Verifica arquivos abertos

# Outros
pnpm check            # TypeScript check
pnpm format           # Formatar código
```

## 📊 Estatísticas do Projeto

- **Linhas de código:** 24.405+ (TypeScript/React)
- **Arquivos:** 217
- **Páginas:** 36
- **Componentes UI:** 40+
- **Documentação:** 15 arquivos
- **Scripts SQL:** 6 arquivos
- **Diagramas:** 11 arquivos

## 🎨 Páginas do Sistema

### Landing Page e Cadastro
- Landing page com chatbot IA
- Sistema de cadastro com 4 planos
- Trial de 14 dias gratuito
- Onboarding automatizado

### Dashboard e CRM (36 páginas)
- Dashboard principal
- Pedidos
- Produtos
- Entregas
- Notas Fiscais
- Contas a Pagar/Receber
- Fluxo de Caixa
- Métricas e Análises
- Inteligência de Mercado
- Calculadora de Taxas ML
- Configurações
- Usuários
- Chat IA
- E mais 23 páginas...

## 💳 Planos e Preços

- **Starter:** R$ 49/mês - Ideal para começar
- **Professional:** R$ 99/mês - Para crescer
- **Business:** R$ 199/mês - Para escalar
- **Enterprise:** R$ 399/mês - Solução completa

Todos os planos incluem 14 dias de trial gratuito.

## 📚 Documentação

A documentação completa está disponível nos seguintes arquivos:

- `DOCUMENTACAO_COMPLETA.md` - Documentação técnica completa
- `GUIA_INSTALACAO.md` - Guia de instalação e configuração
- `GUIA_PRODUCAO.md` - Deploy em produção
- `DATABASE_STRUCTURE.md` - Estrutura do banco de dados
- `ARQUITETURA_MULTI_TENANT.md` - Arquitetura SaaS
- `COMERCIALIZACAO.md` - Estratégia comercial
- `MANUAL_2FA.md` - Configuração de autenticação 2FA
- `GUIA_CLEANUP.md` - Script de limpeza de processos

## 🔧 Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- Wouter
- TanStack Query
- Recharts
- Lucide Icons

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT
- Bcrypt

### Integrações
- Asaas (Pagamentos)
- Mercado Livre API
- Amazon SP-API
- Shopee API
- Google Gemini AI

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

- **Danilo Lima Cabral** - [GitHub](https://github.com/danilolimaCabral)

## 🌟 Agradecimentos

- Equipe Manus pela plataforma de desenvolvimento
- Comunidade open source pelas bibliotecas utilizadas
- Todos os contribuidores do projeto

## 📞 Suporte

Para suporte, entre em contato através do:
- Issues do GitHub
- Email: [seu-email@exemplo.com]

---

**Desenvolvido com ❤️ usando Manus AI**
