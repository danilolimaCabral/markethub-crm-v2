# 🚀 Guia Completo: Integração com Mercado Livre no Markethub CRM V2

**Data:** 12 de dezembro de 2025  
**Projeto:** markethub-crm-v2  
**Status:** ✅ **DOCUMENTAÇÃO CONCLUÍDA**

---

## 🎯 Objetivo

Este guia detalha todas as funcionalidades da integração com o **Mercado Livre** no Markethub CRM V2, como configurar, usar e as melhores práticas para otimizar suas vendas.

---

## ⚙️ Funcionalidades Disponíveis

A integração com o Mercado Livre oferece um conjunto completo de ferramentas para gerenciar suas operações diretamente do Markethub CRM:

| Funcionalidade | Descrição | Endpoints da API |
| :--- | :--- | :--- |
| **Autenticação OAuth2** | Conecte sua conta do Mercado Livre de forma segura. | `/auth/url`, `/auth/callback` |
| **Sincronização de Dados** | Sincronize produtos, pedidos e perguntas. | `/sync`, `/sync/orders`, `/sync/products` |
| **Gestão de Produtos** | Atualize estoque e preços dos seus anúncios no ML. | `/products/:id/update-stock` |
| **Gestão de Pedidos** | Visualize e gerencie seus pedidos do ML. | (via sincronização) |
| **Webhooks** | Receba notificações em tempo real sobre pedidos e perguntas. | `/webhook` |
| **Histórico de Sincronização** | Acompanhe o histórico de todas as sincronizações. | `/sync/history` |
| **Desconexão** | Desconecte sua conta do ML a qualquer momento. | `/disconnect` |

---

## 🚀 Como Configurar a Integração (Passo a Passo)

### **1. Acessar a Tela de Integração**

-   No menu principal do Markethub CRM, vá para **Integrações** > **Mercado Livre**.

### **2. Gerar a URL de Autorização**

-   Clique no botão **"Conectar com Mercado Livre"**.
-   O sistema irá gerar uma URL de autorização segura.

### **3. Autorizar no Mercado Livre**

-   Você será redirecionado para a página de login do Mercado Livre.
-   Faça login com sua conta de vendedor.
-   Autorize o aplicativo **Markethub CRM** a acessar seus dados.

### **4. Callback e Confirmação**

-   Após autorizar, o Mercado Livre irá redirecioná-lo de volta para o Markethub CRM.
-   O sistema salvará seus tokens de acesso de forma segura.
-   Você verá uma mensagem de confirmação com o status **"Conectado"** e o nome da sua loja no ML.

---

## 🔄 Sincronização de Dados

A sincronização é o coração da integração. Ela garante que seus dados estejam sempre atualizados entre o Markethub CRM e o Mercado Livre.

### **Tipos de Sincronização:**

-   **Sincronização Completa:**
    -   Sincroniza pedidos, produtos e perguntas de uma só vez.
    -   **Endpoint:** `POST /api/integrations/mercadolivre/sync`
    -   **Recomendação:** Use para a primeira sincronização ou para uma atualização geral.

-   **Sincronização de Pedidos:**
    -   Sincroniza apenas os pedidos mais recentes.
    -   **Endpoint:** `POST /api/integrations/mercadolivre/sync/orders`
    -   **Recomendação:** Use para atualizar rapidamente os pedidos pendentes.

-   **Sincronização de Produtos:**
    -   Sincroniza apenas os produtos e seus estoques.
    -   **Endpoint:** `POST /api/integrations/mercadolivre/sync/products`
    -   **Recomendação:** Use para atualizar o catálogo de produtos.

### **Como Sincronizar:**

-   Na tela de integração do Mercado Livre, clique no botão **"Sincronizar Agora"**.
-   Você pode escolher o tipo de sincronização que deseja executar.
-   O sistema irá iniciar o processo em segundo plano e você pode acompanhar o progresso no **Histórico de Sincronização**.

---

## 📦 Gestão de Produtos

### **Atualizar Estoque:**

-   Quando você atualiza o estoque de um produto no Markethub CRM, o sistema pode automaticamente atualizar o estoque no Mercado Livre.
-   Você também pode forçar uma atualização de estoque para um produto específico.
-   **Endpoint:** `POST /api/integrations/mercadolivre/products/:productId/update-stock`

---

## 🔔 Webhooks (Notificações em Tempo Real)

O sistema está configurado para receber notificações em tempo real do Mercado Livre. Isso significa que:

-   **Novos Pedidos:** Aparecerão no seu dashboard assim que forem feitos.
-   **Novas Perguntas:** Serão exibidas para você responder rapidamente.
-   **Atualizações de Status:** Mudanças no status dos pedidos serão refletidas automaticamente.

**Endpoint de Webhook:** `POST /api/integrations/mercadolivre/webhook` (configurado automaticamente)

---

## 📈 Melhores Práticas

-   **Sincronização Regular:** Execute a sincronização completa pelo menos uma vez por dia para garantir que todos os dados estejam consistentes.
-   **Gestão Centralizada:** Use o Markethub CRM como sua principal ferramenta para gerenciar estoque e preços. Isso evita conflitos de dados.
-   **Atenção às Notificações:** Fique de olho nas notificações de webhooks para responder rapidamente a perguntas e processar pedidos.
-   **Segurança:** Nunca compartilhe suas credenciais do Mercado Livre. A autenticação OAuth2 foi projetada para ser segura.

---

## ❓ Solução de Problemas (Troubleshooting)

-   **Erro de Conexão:**
    -   Verifique se sua conta do Mercado Livre está ativa.
    -   Tente desconectar e reconectar a integração.

-   **Sincronização Lenta:**
    -   Se você tem muitos produtos ou pedidos, a sincronização inicial pode levar alguns minutos. Aguarde a conclusão e verifique o histórico.

-   **Dados Desatualizados:**
    -   Execute uma sincronização manual para forçar a atualização dos dados.

---

## ✅ Conclusão

A integração com o Mercado Livre no Markethub CRM V2 é uma ferramenta poderosa para centralizar e otimizar suas operações de e-commerce. Ao seguir este guia, você poderá aproveitar ao máximo todas as funcionalidades e vender mais e melhor.

Se tiver qualquer dúvida, entre em contato com o suporte!
