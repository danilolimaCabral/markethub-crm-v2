# 📘 Documentação Completa do Sistema CRM

**Versão:** 1.0.0  
**Última Atualização:** Novembro 2025  
**Autor:** Manus AI

---

## 📑 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Módulos do Sistema](#módulos-do-sistema)
4. [Sistema de Autenticação](#sistema-de-autenticação)
5. [Sistema de Permissões](#sistema-de-permissões)
6. [Integrações](#integrações)
7. [Armazenamento de Dados](#armazenamento-de-dados)

---

## 🎯 Visão Geral do Sistema

Este é um **Sistema de Gestão Empresarial (CRM)** completo e moderno, desenvolvido para gerenciar operações comerciais, vendas, finanças e integrações com marketplaces. O sistema foi projetado com foco em **usabilidade**, **segurança** e **escalabilidade**.

### Principais Características

O sistema oferece uma plataforma integrada que centraliza todas as operações comerciais em um único lugar. Com interface moderna e intuitiva, permite que equipes de diferentes departamentos trabalhem de forma colaborativa e eficiente. O controle granular de permissões garante que cada usuário tenha acesso apenas aos módulos necessários para suas funções.

A arquitetura foi desenvolvida pensando em empresas que precisam de um sistema robusto mas acessível, sem a complexidade e custos elevados de soluções enterprise tradicionais. Toda a lógica de negócio está implementada no frontend, utilizando localStorage para persistência de dados, o que garante funcionamento rápido e sem necessidade de infraestrutura complexa de backend.

### Público-Alvo

O sistema é ideal para **pequenas e médias empresas** que vendem em marketplaces (especialmente Mercado Livre), lojas de e-commerce, distribuidores e empresas de varejo que precisam centralizar operações de vendas, estoque, finanças e atendimento ao cliente.

---

## 🏗️ Arquitetura e Tecnologias

### Stack Tecnológico

A aplicação foi construída utilizando as tecnologias mais modernas e estáveis do mercado, garantindo performance, manutenibilidade e experiência de usuário excepcional.

| Camada | Tecnologia | Versão | Descrição |
|--------|-----------|--------|-----------|
| **Frontend Framework** | React | 19 | Biblioteca JavaScript para construção de interfaces |
| **Linguagem** | TypeScript | 5.x | Superset tipado do JavaScript |
| **Roteamento** | Wouter | 3.x | Roteador minimalista para React |
| **Estilização** | Tailwind CSS | 4.x | Framework CSS utility-first |
| **Componentes UI** | shadcn/ui | Latest | Biblioteca de componentes acessíveis |
| **Ícones** | Lucide React | Latest | Biblioteca de ícones moderna |
| **Build Tool** | Vite | 7.x | Build tool ultra-rápido |
| **Gerenciador de Pacotes** | pnpm | 10.x | Gerenciador de pacotes eficiente |

### Bibliotecas Especializadas

Para funcionalidades específicas, o sistema utiliza bibliotecas especializadas que garantem qualidade e confiabilidade:

**Importação de Dados:**
- **xlsx** (v0.18.5) - Leitura e escrita de arquivos Excel
- **papaparse** (v5.5.3) - Parser robusto para arquivos CSV

**Autenticação 2FA:**
- Implementação própria de TOTP (Time-based One-Time Password)
- Geração de QR Codes para integração com Google Authenticator e Authy

### Arquitetura de Componentes

O sistema segue uma arquitetura modular baseada em componentes React, com separação clara de responsabilidades. A estrutura de diretórios foi organizada para facilitar manutenção e escalabilidade.

```
client/src/
├── pages/          # Páginas principais (rotas)
├── components/     # Componentes reutilizáveis
│   ├── ui/        # Componentes base do shadcn/ui
│   └── ...        # Componentes customizados
├── hooks/          # React Hooks customizados
├── lib/            # Utilitários e helpers
├── contexts/       # Contextos React (temas, auth)
└── const.ts        # Constantes globais
```

---

## 📦 Módulos do Sistema

O sistema é composto por **22 módulos** organizados em **6 categorias** principais. Cada módulo foi desenvolvido para atender necessidades específicas de gestão empresarial.

### 1. CENTRAL (Módulos Principais)

#### 1.1 Dashboard

O Dashboard é o centro de comando do sistema, oferecendo uma visão consolidada de todas as operações da empresa em tempo real.

**Funcionalidades:**
- Métricas principais de vendas, faturamento e pedidos pendentes
- Gráficos interativos de performance mensal e anual
- Indicadores de saúde financeira (contas a pagar/receber)
- Alertas de ações pendentes e tarefas prioritárias
- Visão rápida de estoque baixo e produtos mais vendidos

**Benefícios:**
Permite que gestores tomem decisões baseadas em dados atualizados, identificando rapidamente oportunidades e problemas que requerem atenção imediata.

#### 1.2 Assistente IA

Chat inteligente integrado que auxilia usuários em tarefas cotidianas e consultas ao sistema.

**Funcionalidades:**
- Interface de chat conversacional
- Consultas sobre dados do sistema
- Sugestões de ações baseadas em contexto
- Ajuda contextual sobre funcionalidades

**Benefícios:**
Reduz curva de aprendizado e aumenta produtividade ao fornecer assistência instantânea sem necessidade de consultar manuais ou suporte técnico.

---

### 2. OPERACIONAL (Gestão de Vendas e Operações)

#### 2.1 Pedidos

Gerenciamento completo do ciclo de vida dos pedidos, desde a criação até a entrega.

**Funcionalidades:**
- Listagem de pedidos com filtros avançados (status, data, cliente)
- Visualização detalhada de cada pedido
- Atualização de status (pendente, processando, enviado, entregue)
- Rastreamento de pedidos
- Histórico completo de alterações
- Integração com sistema de entregas

**Benefícios:**
Centraliza todas as informações de pedidos em um único lugar, facilitando acompanhamento e garantindo que nenhum pedido seja esquecido ou atrasado.

#### 2.2 Produtos

Catálogo completo de produtos com gestão de estoque e precificação.

**Funcionalidades:**
- Cadastro de produtos com fotos, descrições e especificações
- Controle de estoque (quantidade, alertas de estoque baixo)
- Gestão de variações (tamanhos, cores, modelos)
- Categorização e tags para organização
- Histórico de movimentações de estoque
- Importação em massa via planilhas

**Benefícios:**
Mantém inventário organizado e atualizado, evitando vendas de produtos sem estoque e facilitando reposição no momento certo.

#### 2.3 Anúncios

Gerenciamento de anúncios em marketplaces e canais de venda.

**Funcionalidades:**
- Listagem de anúncios ativos e inativos
- Edição de títulos, descrições e preços
- Controle de visibilidade (publicar/pausar)
- Sincronização com marketplaces
- Análise de performance de anúncios

**Benefícios:**
Permite otimizar anúncios para maximizar vendas, ajustando preços e descrições com base em performance real.

#### 2.4 Clientes

Base de dados completa de clientes com histórico de compras e interações.

**Funcionalidades:**
- Cadastro completo de clientes (dados pessoais, endereços, contatos)
- Histórico de pedidos por cliente
- Segmentação de clientes (VIP, recorrentes, inativos)
- Notas e observações sobre clientes
- Análise de valor de vida do cliente (LTV)

**Benefícios:**
Permite personalizar atendimento e criar estratégias de fidelização baseadas em comportamento e histórico de cada cliente.

#### 2.5 Entregas

Controle logístico de entregas e rastreamento de envios.

**Funcionalidades:**
- Gestão de entregas pendentes e em andamento
- Integração com transportadoras
- Códigos de rastreamento
- Atualização de status de entrega
- Alertas de atrasos
- Cálculo de prazos de entrega

**Benefícios:**
Garante que clientes recebam produtos no prazo, reduzindo reclamações e aumentando satisfação.

#### 2.6 Notas Fiscais

Gestão de documentos fiscais e conformidade tributária.

**Funcionalidades:**
- Emissão de notas fiscais eletrônicas (NF-e)
- Armazenamento de XMLs e DANFEs
- Consulta de notas emitidas
- Relatórios fiscais para contabilidade
- Integração com sistemas de emissão de NF-e

**Benefícios:**
Mantém empresa em conformidade fiscal e facilita trabalho do contador com documentação organizada e acessível.

#### 2.7 Pós-Vendas

Atendimento ao cliente após a venda, gestão de trocas, devoluções e SAC.

**Funcionalidades:**
- Registro de solicitações de suporte
- Gestão de trocas e devoluções
- Acompanhamento de garantias
- Histórico de atendimentos por cliente
- Avaliação de satisfação

**Benefícios:**
Melhora experiência do cliente e reduz churn ao resolver problemas rapidamente e de forma organizada.

#### 2.8 Importação

Ferramenta para importação em massa de dados via planilhas.

**Funcionalidades:**
- Upload de arquivos Excel e CSV
- Mapeamento automático de colunas
- Validação de dados antes de importar
- Pré-visualização de dados
- Importação incremental (atualizar dados existentes)

**Benefícios:**
Economiza horas de trabalho manual ao permitir cadastro e atualização de centenas de produtos ou clientes em minutos.

#### 2.9 Inteligência de Mercado

Análise de mercado e precificação competitiva.

**Funcionalidades:**
- Monitoramento de preços da concorrência
- Análise de tendências de mercado
- Sugestões de precificação
- Identificação de oportunidades
- Relatórios de posicionamento competitivo

**Benefícios:**
Permite tomar decisões estratégicas de precificação baseadas em dados reais do mercado, maximizando margens sem perder competitividade.

#### 2.10 Tabela de Preços

Gestão centralizada de precificação de produtos.

**Funcionalidades:**
- Visualização de preços atuais vs. mercado
- Ajuste em massa de preços
- Cálculo automático de margens
- Histórico de alterações de preços
- Regras de precificação (markup, desconto)

**Benefícios:**
Facilita gestão de preços e garante que margens de lucro sejam mantidas em todos os produtos.

---

### 3. FINANCEIRO (Gestão Financeira)

#### 3.1 Contas a Pagar

Controle de despesas e obrigações financeiras da empresa.

**Funcionalidades:**
- Cadastro de contas a pagar (fornecedores, impostos, despesas)
- Controle de vencimentos e pagamentos
- Alertas de contas vencidas
- Categorização de despesas
- Relatórios de despesas por período e categoria
- Fluxo de aprovação de pagamentos

**Benefícios:**
Evita atrasos e multas ao manter todas as obrigações financeiras organizadas e com alertas de vencimento.

#### 3.2 Contas a Receber

Gestão de receitas e valores a receber de clientes.

**Funcionalidades:**
- Controle de recebimentos pendentes
- Gestão de inadimplência
- Emissão de cobranças
- Conciliação bancária
- Previsão de recebimentos
- Relatórios de aging (tempo de atraso)

**Benefícios:**
Melhora fluxo de caixa ao facilitar cobrança e acompanhamento de valores a receber.

#### 3.3 Fluxo de Caixa

Visão consolidada da saúde financeira da empresa.

**Funcionalidades:**
- Saldo atual e projetado
- Entradas e saídas por período
- Gráficos de evolução do caixa
- Projeções futuras baseadas em contas a pagar/receber
- Alertas de saldo baixo
- Exportação de relatórios

**Benefícios:**
Permite planejamento financeiro preciso e evita surpresas desagradáveis com falta de capital de giro.

---

### 4. ANÁLISE (Relatórios e Indicadores)

#### 4.1 Relatórios

Central de relatórios gerenciais e operacionais.

**Funcionalidades:**
- Relatórios pré-configurados (vendas, estoque, financeiro)
- Filtros personalizáveis (período, categoria, cliente)
- Exportação em Excel e PDF
- Agendamento de relatórios automáticos
- Dashboards customizáveis

**Benefícios:**
Fornece insights acionáveis para tomada de decisão estratégica baseada em dados consolidados.

#### 4.2 Análise de Vendas

Análise detalhada de performance de vendas.

**Funcionalidades:**
- Vendas por período (dia, semana, mês, ano)
- Produtos mais vendidos
- Performance por canal de venda
- Análise de sazonalidade
- Comparativo entre períodos
- Metas vs. realizado

**Benefícios:**
Identifica padrões de venda e oportunidades de crescimento, permitindo ajustes estratégicos em tempo hábil.

#### 4.3 Métricas

Indicadores-chave de performance (KPIs) do negócio.

**Funcionalidades:**
- KPIs principais (ticket médio, taxa de conversão, ROI)
- Gráficos de evolução de métricas
- Comparativos históricos
- Metas e objetivos
- Alertas de performance

**Benefícios:**
Mantém equipe alinhada com objetivos através de métricas claras e acompanhamento constante de resultados.

---

### 5. INTEGRAÇÕES (Conexões Externas)

#### 5.1 Mercado Livre

Integração completa com a API do Mercado Livre para gestão de vendas no marketplace.

**Funcionalidades:**
- Configuração de credenciais OAuth2
- Dashboard de vendas do ML
- Sincronização de pedidos
- Gestão de produtos e anúncios
- Respostas a perguntas de clientes
- Métricas de performance no marketplace
- Sincronização manual e automática

**Benefícios:**
Centraliza gestão de vendas do Mercado Livre no CRM, eliminando necessidade de acessar múltiplas plataformas.

**Status de Implementação:**
Interface completa desenvolvida. Requer configuração de credenciais OAuth2 do Mercado Livre para ativação das chamadas reais à API.

#### 5.2 Importação Financeira

Sistema de importação de planilhas financeiras com atualização automática.

**Funcionalidades:**
- Upload de arquivos Excel e CSV
- Parser automático de colunas financeiras
- Validação de dados antes de importar
- Pré-visualização com correção de erros
- Histórico de importações
- Template de planilha para download
- Mapeamento inteligente de colunas

**Benefícios:**
Facilita integração com sistemas contábeis e ERPs externos, permitindo importar dados financeiros de forma rápida e segura.

---

### 6. ADMINISTRAÇÃO (Gestão do Sistema)

#### 6.1 Usuários

Gerenciamento completo de usuários e permissões.

**Funcionalidades:**
- CRUD completo de usuários (criar, editar, excluir)
- Definição de permissões por módulo
- Perfis pré-configurados (Admin, Vendedor, Financeiro, Operacional)
- Perfis personalizados
- Controle granular de acesso
- Histórico de ações de usuários

**Benefícios:**
Garante segurança ao permitir que cada usuário acesse apenas os módulos necessários para suas funções, reduzindo riscos de erros e vazamento de informações.

#### 6.2 Configurações

Configurações gerais do sistema e personalização.

**Funcionalidades:**
- Configurações de perfil do usuário
- Autenticação de 2 fatores (2FA)
- Preferências de interface
- Configurações de notificações
- Backup e restauração de dados
- Logs de sistema

**Benefícios:**
Permite personalizar sistema de acordo com necessidades específicas de cada empresa e usuário.

---

## 🔐 Sistema de Autenticação

O sistema possui um robusto mecanismo de autenticação com múltiplas camadas de segurança.

### Autenticação Básica

A autenticação principal utiliza credenciais de usuário e senha armazenadas de forma segura no localStorage do navegador. O sistema valida credenciais e mantém sessão ativa até logout explícito do usuário.

**Credenciais Padrão:**
- **Usuário:** admin
- **Senha:** admin123

### Autenticação de 2 Fatores (2FA)

Para aumentar segurança, o sistema oferece autenticação de dois fatores baseada em TOTP (Time-based One-Time Password), compatível com aplicativos como Google Authenticator e Authy.

**Processo de Configuração:**
1. Usuário acessa Configurações > Segurança
2. Ativa opção "Autenticação de 2 Fatores"
3. Escaneia QR Code com aplicativo autenticador
4. Insere código de verificação para confirmar
5. Recebe códigos de backup para recuperação

**Processo de Login com 2FA:**
1. Usuário insere credenciais normais
2. Sistema valida usuário e senha
3. Se 2FA estiver ativo, redireciona para tela de verificação
4. Usuário insere código de 6 dígitos do aplicativo
5. Sistema valida código e libera acesso

**Códigos de Backup:**
Ao ativar 2FA, o sistema gera 10 códigos de backup de uso único que podem ser utilizados caso o usuário perca acesso ao aplicativo autenticador.

### Recuperação de Senha

O sistema possui fluxo de recuperação de senha via email (interface implementada, requer integração com serviço de email).

---

## 🛡️ Sistema de Permissões

O sistema de permissões foi desenvolvido para oferecer controle granular de acesso, permitindo que administradores definam exatamente quais módulos cada usuário pode acessar.

### Arquitetura de Permissões

As permissões são baseadas em **módulos**, onde cada módulo corresponde a uma funcionalidade específica do sistema. Um usuário só pode acessar os módulos para os quais possui permissão explícita.

### Módulos Disponíveis

O sistema possui **22 módulos** que podem ser habilitados ou desabilitados individualmente para cada usuário:

| Módulo | ID | Descrição |
|--------|-----|-----------|
| Dashboard | `dashboard` | Visão geral do sistema |
| Assistente IA | `chat` | Chat com IA |
| Pedidos | `pedidos` | Gestão de pedidos |
| Produtos | `produtos` | Catálogo de produtos |
| Anúncios | `anuncios` | Gestão de anúncios |
| Clientes | `clientes` | Base de clientes |
| Entregas | `entregas` | Controle de entregas |
| Notas Fiscais | `notas-fiscais` | Gestão de NF-e |
| Pós-Vendas | `pos-vendas` | Atendimento pós-venda |
| Importação | `importacao` | Importar dados |
| Inteligência de Mercado | `inteligencia-mercado` | Análise de mercado |
| Tabela de Preços | `tabela-preco` | Gestão de preços |
| Contas a Pagar | `contas-pagar` | Despesas |
| Contas a Receber | `contas-receber` | Receitas |
| Fluxo de Caixa | `fluxo-caixa` | Controle financeiro |
| Relatórios | `relatorios` | Relatórios gerenciais |
| Análise de Vendas | `vendas` | Performance de vendas |
| Métricas | `metricas` | KPIs do negócio |
| Mercado Livre | `mercado-livre` | Integração ML |
| Importação Financeira | `importacao-financeira` | Importar planilhas |
| Usuários | `usuarios` | Gerenciar usuários |
| Configurações | `configuracoes` | Configurações |

### Perfis Pré-Configurados

Para facilitar gestão de permissões, o sistema oferece 4 perfis pré-configurados:

#### 1. Administrador (Acesso Total)
Acesso completo a todos os 22 módulos do sistema. Indicado para proprietários e gestores.

#### 2. Vendedor
Acesso a módulos relacionados a vendas e atendimento:
- Dashboard, Assistente IA, Pedidos, Produtos, Anúncios, Clientes, Pós-Vendas, Mercado Livre, Análise de Vendas, Métricas

#### 3. Financeiro
Acesso a módulos financeiros e relatórios:
- Dashboard, Contas a Pagar, Contas a Receber, Fluxo de Caixa, Notas Fiscais, Relatórios, Análise de Vendas, Métricas, Importação Financeira

#### 4. Operacional
Acesso a módulos operacionais e logística:
- Dashboard, Pedidos, Produtos, Anúncios, Clientes, Entregas, Notas Fiscais, Pós-Vendas, Importação, Mercado Livre

### Proteção de Rotas

O sistema implementa proteção de rotas através do componente `ProtectedRoute`, que verifica permissões antes de renderizar cada página. Usuários sem permissão são automaticamente redirecionados para página de erro 403 (Acesso Negado).

### Hook usePermissions

O sistema fornece um React Hook customizado (`usePermissions`) que permite verificar permissões em qualquer componente:

```typescript
const { hasPermission, isAdmin, permissions } = usePermissions();

if (hasPermission('pedidos')) {
  // Usuário pode acessar módulo de pedidos
}
```

---

## 🔌 Integrações

### Mercado Livre

A integração com Mercado Livre utiliza OAuth2 para autenticação segura e acesso à API oficial.

**Fluxo de Integração:**
1. Criar aplicação no Mercado Livre Developers
2. Configurar Redirect URI no painel do ML
3. Inserir Client ID e Client Secret no CRM
4. Autorizar acesso via OAuth2
5. Sistema recebe access token e refresh token
6. Sincronização automática de dados

**Endpoints Utilizados:**
- `GET /users/me` - Dados do vendedor
- `GET /orders/search` - Buscar pedidos
- `GET /items/{id}` - Detalhes de produtos
- `POST /items` - Criar anúncios
- `GET /questions/search` - Perguntas de clientes

**Documentação Completa:**
Consulte arquivo `PESQUISA_API_MERCADO_LIVRE.md` para detalhes técnicos completos da integração.

---

## 💾 Armazenamento de Dados

O sistema utiliza **localStorage** do navegador para persistência de dados, garantindo funcionamento offline e performance excepcional.

### Estrutura de Dados

| Chave | Descrição | Tipo |
|-------|-----------|------|
| `ia_bruno_user` | Usuário logado atualmente | Object |
| `ia_bruno_users` | Lista de todos os usuários | Array |
| `ml_config` | Configurações do Mercado Livre | Object |
| `ml_metrics` | Métricas do Mercado Livre | Object |
| `financial_records` | Registros financeiros importados | Array |
| `financial_import_history` | Histórico de importações | Array |

### Backup e Restauração

Recomenda-se exportar dados periodicamente através da funcionalidade de exportação disponível em cada módulo. Os dados podem ser restaurados através da funcionalidade de importação.

---

## 📞 Suporte e Contato

Para dúvidas, sugestões ou suporte técnico, entre em contato através dos canais oficiais da empresa.

---

**Desenvolvido com ❤️ por Manus AI**
