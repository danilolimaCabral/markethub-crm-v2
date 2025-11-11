# Arquitetura de Integrações - MarketHub CRM

## 🎯 VISÃO GERAL

O MarketHub CRM terá um **sistema de integrações modular e escalável** que permite conectar com ERPs, marketplaces e outros sistemas através de:

1. **API Pública RESTful** (para integrações customizadas)
2. **Webhooks** (para eventos em tempo real)
3. **Conectores Nativos** (para ERPs populares)
4. **Hub de Integração Visual** (no-code)

---

## 📐 ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│                    MARKETHUB CRM                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   Backend    │  │   Database   │     │
│  │   (React)    │  │  (Node.js)   │  │ (PostgreSQL) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                            │                                │
│                    ┌───────┴───────┐                       │
│                    │               │                        │
│              ┌─────▼─────┐   ┌────▼────┐                  │
│              │  API      │   │Webhooks │                   │
│              │  Pública  │   │ Engine  │                   │
│              └─────┬─────┘   └────┬────┘                  │
│                    │               │                        │
└────────────────────┼───────────────┼────────────────────────┘
                     │               │
        ┌────────────┴───────────────┴────────────┐
        │                                          │
┌───────▼────────┐  ┌────────▼─────────┐  ┌──────▼──────┐
│   Conectores   │  │   Integradores   │  │   Zapier/   │
│    Nativos     │  │    Externos      │  │    Make     │
└───────┬────────┘  └────────┬─────────┘  └──────┬──────┘
        │                    │                     │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   │  Bling  │          │  Omie   │          │  Tiny   │
   │  API    │          │  API    │          │  ERP    │
   └─────────┘          └─────────┘          └─────────┘
```

---

## 🔌 COMPONENTES

### **1. API Pública RESTful**

**Base URL:** `https://api.markethubcrm.com.br/v1`

**Endpoints Principais:**

```
# Autenticação
POST   /auth/token                 # Obter token de acesso
POST   /auth/refresh               # Renovar token

# Produtos
GET    /products                   # Listar produtos
POST   /products                   # Criar produto
GET    /products/:id               # Obter produto
PUT    /products/:id               # Atualizar produto
DELETE /products/:id               # Deletar produto

# Pedidos
GET    /orders                     # Listar pedidos
POST   /orders                     # Criar pedido
GET    /orders/:id                 # Obter pedido
PUT    /orders/:id                 # Atualizar pedido

# Estoque
GET    /inventory                  # Listar estoque
PUT    /inventory/:product_id      # Atualizar estoque

# Clientes
GET    /customers                  # Listar clientes
POST   /customers                  # Criar cliente
GET    /customers/:id              # Obter cliente
PUT    /customers/:id              # Atualizar cliente

# Integrações
GET    /integrations               # Listar integrações ativas
POST   /integrations               # Criar integração
GET    /integrations/:id           # Obter integração
PUT    /integrations/:id           # Atualizar integração
DELETE /integrations/:id           # Deletar integração

# Webhooks
GET    /webhooks                   # Listar webhooks
POST   /webhooks                   # Criar webhook
DELETE /webhooks/:id               # Deletar webhook
```

**Autenticação:**
- OAuth 2.0 (Client Credentials)
- API Keys (para integrações simples)
- JWT Tokens

**Rate Limiting:**
- 100 requisições/minuto (plano Starter)
- 500 requisições/minuto (plano Professional)
- 2000 requisições/minuto (plano Business)
- Ilimitado (plano Enterprise)

---

### **2. Webhooks Engine**

**Eventos Disponíveis:**

```javascript
// Produtos
product.created
product.updated
product.deleted
product.stock_low

// Pedidos
order.created
order.updated
order.status_changed
order.shipped
order.delivered
order.cancelled

// Clientes
customer.created
customer.updated

// Estoque
inventory.updated
inventory.low_stock_alert

// Integrações
integration.connected
integration.disconnected
integration.error
```

**Formato do Payload:**

```json
{
  "event": "order.created",
  "timestamp": "2025-11-10T20:30:00Z",
  "tenant_id": "tenant_123",
  "data": {
    "order_id": "ORD-12345",
    "customer": {
      "id": "CUST-789",
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "items": [
      {
        "product_id": "PROD-456",
        "quantity": 2,
        "price": 99.90
      }
    ],
    "total": 199.80,
    "status": "pending"
  }
}
```

**Retry Logic:**
- Tentativa 1: Imediato
- Tentativa 2: Após 1 minuto
- Tentativa 3: Após 5 minutos
- Tentativa 4: Após 30 minutos
- Tentativa 5: Após 1 hora

---

### **3. Conectores Nativos**

#### **Conector Bling**

```typescript
// server/integrations/bling/BlingConnector.ts

interface BlingConfig {
  apiKey: string;
  tenantId: string;
}

class BlingConnector {
  async syncProducts(): Promise<void>
  async syncOrders(): Promise<void>
  async updateStock(productId: string, quantity: number): Promise<void>
  async createOrder(order: Order): Promise<string>
}
```

#### **Conector Omie**

```typescript
// server/integrations/omie/OmieConnector.ts

interface OmieConfig {
  appKey: string;
  appSecret: string;
  tenantId: string;
}

class OmieConnector {
  async syncProducts(): Promise<void>
  async syncOrders(): Promise<void>
  async updateStock(productId: string, quantity: number): Promise<void>
  async createInvoice(order: Order): Promise<string>
}
```

#### **Conector Tiny ERP**

```typescript
// server/integrations/tiny/TinyConnector.ts

interface TinyConfig {
  token: string;
  tenantId: string;
}

class TinyConnector {
  async syncProducts(): Promise<void>
  async syncOrders(): Promise<void>
  async updateStock(productId: string, quantity: number): Promise<void>
}
```

---

### **4. Hub de Integração Visual**

**Interface no Frontend:**

```
┌─────────────────────────────────────────────┐
│  Integrações                          [+]   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Bling ERP              [Conectado]│    │
│  │  Sincronização: Automática         │    │
│  │  Última sync: 10 min atrás         │    │
│  │  [Configurar] [Sincronizar Agora]  │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Omie                   [Desconect]│    │
│  │  [Conectar]                        │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Tiny ERP               [Desconect]│    │
│  │  [Conectar]                        │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Integração Customizada            │    │
│  │  [Criar via API]                   │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 🔐 SEGURANÇA

### **Autenticação:**
- OAuth 2.0 para integrações de terceiros
- API Keys com escopo limitado
- JWT com expiração de 1 hora

### **Criptografia:**
- HTTPS obrigatório (TLS 1.3)
- Credenciais de ERPs criptografadas no banco (AES-256)

### **Rate Limiting:**
- Por tenant
- Por endpoint
- Proteção contra DDoS

### **Logs:**
- Todas as requisições logadas
- Auditoria de integrações
- Alertas de falhas

---

## 📊 MONITORAMENTO

### **Métricas:**
- Requisições por minuto
- Taxa de sucesso/erro
- Latência média
- Webhooks entregues/falhados

### **Alertas:**
- Integração offline
- Taxa de erro > 5%
- Latência > 2 segundos
- Webhook falhando repetidamente

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: API Pública (Semana 1-2)**
- ✅ Criar rotas RESTful
- ✅ Implementar autenticação OAuth
- ✅ Documentar com Swagger
- ✅ Testar com Postman

### **Fase 2: Webhooks (Semana 3)**
- ✅ Criar engine de webhooks
- ✅ Implementar retry logic
- ✅ Interface para gerenciar webhooks

### **Fase 3: Conectores Nativos (Semana 4-6)**
- ✅ Conector Bling
- ✅ Conector Omie
- ✅ Conector Tiny ERP

### **Fase 4: Hub Visual (Semana 7-8)**
- ✅ Interface de gerenciamento
- ✅ Logs de sincronização
- ✅ Configuração visual

### **Fase 5: Zapier/Make (Semana 9)**
- ✅ Criar app no Zapier
- ✅ Criar módulo no Make
- ✅ Documentar triggers e actions

---

## 💡 DIFERENCIAIS COMPETITIVOS

✅ **API Pública** - Nenhum concorrente oferece  
✅ **Hub de Integração Visual** - Único no mercado  
✅ **Webhooks em Tempo Real** - Sincronização instantânea  
✅ **Conectores Nativos** - Mais rápido que integradores externos  
✅ **Documentação Completa** - Swagger + exemplos  

---

**Próximo Passo:** Implementar API Pública e Webhooks! 🚀
