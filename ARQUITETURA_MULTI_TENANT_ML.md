# 🏗️ Arquitetura Multi-Tenant - Mercado Livre

**Data:** 12/12/2025  
**Versão:** 1.0  
**Status:** ✅ Implementado

---

## 📋 Visão Geral

O sistema Markthub CRM implementa uma **arquitetura multi-tenant** para a integração com o Mercado Livre, onde:

- ✅ **Cada usuário/cliente** tem sua própria conexão independente com o Mercado Livre
- ✅ **Admin Master** visualiza o status de TODAS as integrações de todos os clientes
- ✅ **Clientes individuais** veem apenas sua própria integração
- ✅ **Tokens OAuth2** são armazenados por usuário, não por tenant
- ✅ **Isolamento completo** entre as contas dos clientes

---

## 🎯 Objetivos

### **1. Isolamento de Dados**
Cada cliente conecta sua própria conta de vendedor do Mercado Livre e gerencia seus próprios:
- Produtos
- Pedidos
- Tokens de acesso
- Sincronizações

### **2. Visibilidade Admin**
O administrador master pode:
- Ver status de todas as integrações
- Identificar quais clientes estão conectados
- Monitorar tokens expirados
- Visualizar estatísticas agregadas

### **3. Escalabilidade**
A arquitetura suporta:
- Múltiplos clientes por tenant
- Múltiplos tenants no sistema
- Crescimento ilimitado de integrações

---

## 🗄️ Estrutura do Banco de Dados

### **Tabela: `marketplace_integrations`**

```sql
CREATE TABLE marketplace_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,              -- NOVO: vincula ao usuário específico
  marketplace VARCHAR(50) NOT NULL,       -- 'mercado_livre'
  access_token TEXT NOT NULL,             -- Token OAuth2 criptografado
  refresh_token TEXT NOT NULL,            -- Refresh token criptografado
  token_expires_at TIMESTAMP NOT NULL,    -- Expiração do token
  is_active BOOLEAN DEFAULT true,         -- Status da integração
  config JSONB,                           -- Configurações (ml_user_id, nickname, etc)
  last_sync_at TIMESTAMP,                 -- Última sincronização
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, marketplace)            -- Um usuário = uma integração por marketplace
);
```

### **Índices para Performance**

```sql
CREATE INDEX idx_ml_integrations_user_id ON marketplace_integrations(user_id);
CREATE INDEX idx_ml_integrations_tenant_id ON marketplace_integrations(tenant_id);
CREATE INDEX idx_ml_integrations_is_active ON marketplace_integrations(is_active);
CREATE INDEX idx_ml_integrations_marketplace ON marketplace_integrations(marketplace);
```

---

## 🔌 API Endpoints

### **Para Clientes (Usuários Normais)**

#### **GET /api/integrations/mercadolivre/status**
Retorna status da integração do usuário logado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "connected": true,
  "integration": {
    "id": 123,
    "ml_user_id": "123456789",
    "ml_nickname": "loja_exemplo",
    "last_sync": "2025-12-12T10:30:00Z",
    "token_expires_at": "2025-12-19T10:30:00Z",
    "is_token_valid": true
  }
}
```

#### **GET /api/integrations/mercadolivre/auth/url**
Gera URL de autorização OAuth2 para conectar conta ML.

#### **POST /api/integrations/mercadolivre/sync/products**
Sincroniza produtos do Mercado Livre do usuário.

#### **POST /api/integrations/mercadolivre/sync/orders**
Sincroniza pedidos do Mercado Livre do usuário.

---

### **Para Admin Master (Superadmin)**

#### **GET /api/admin/mercadolivre/all-status**
Retorna status de TODAS as integrações de todos os usuários.

**Headers:**
```
Authorization: Bearer <token_superadmin>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 15,
    "connected": 12,
    "disconnected": 3,
    "token_expired": 2
  },
  "integrations": [
    {
      "id": 1,
      "tenant": {
        "id": 1,
        "name": "Loja ABC"
      },
      "user": {
        "id": 5,
        "username": "joao",
        "email": "joao@lojabc.com",
        "name": "João Silva"
      },
      "mercadolivre": {
        "user_id": "123456789",
        "nickname": "loja_abc_ml"
      },
      "status": {
        "connected": true,
        "token_valid": true,
        "token_expires_at": "2025-12-19T10:30:00Z",
        "last_sync": "2025-12-12T10:30:00Z"
      },
      "timestamps": {
        "created_at": "2025-12-01T08:00:00Z",
        "updated_at": "2025-12-12T10:30:00Z"
      }
    }
    // ... mais integrações
  ]
}
```

#### **GET /api/admin/mercadolivre/stats**
Retorna apenas estatísticas agregadas (sem dados sensíveis).

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 15,
    "connected": 12,
    "disconnected": 3,
    "token_expired": 2,
    "last_sync_global": "2025-12-12T10:30:00Z"
  }
}
```

#### **GET /api/admin/mercadolivre/user/:userId/status**
Retorna status de integração de um usuário específico.

---

## 🎨 Componentes Frontend

### **1. MLAdminDashboard** (Admin Master)

**Localização:** `client/src/components/MLAdminDashboard.tsx`

**Funcionalidades:**
- ✅ Exibe estatísticas gerais (total, conectados, desconectados, tokens expirados)
- ✅ Lista todas as integrações com detalhes
- ✅ Mostra informações do usuário, tenant e conta ML
- ✅ Indica status visual (conectado/desconectado/token expirado)
- ✅ Botão de atualização manual
- ✅ Formatação de datas em PT-BR

**Acesso:** Apenas superadmin

---

### **2. IntegracaoMercadoLivre** (Cliente)

**Localização:** `client/src/pages/IntegracaoMercadoLivre.tsx`

**Lógica de Renderização:**

```typescript
// Se for superadmin → Mostrar MLAdminDashboard
if (isSuperAdmin) {
  return <MLAdminDashboard />;
}

// Se não estiver conectado → Mostrar tela de conexão
if (!connected) {
  return <ConectarMercadoLivre />;
}

// Se estiver conectado → Mostrar dashboard individual
return <DashboardMercadoLivre />;
```

**Funcionalidades para Cliente:**
- ✅ Conectar conta ML (OAuth2)
- ✅ Ver status da conexão
- ✅ Sincronizar produtos
- ✅ Sincronizar pedidos
- ✅ Visualizar estatísticas
- ✅ Monitorar API (aba Monitoramento API)

---

## 🔐 Segurança

### **1. Autenticação**
- Todos os endpoints requerem JWT válido
- Token armazenado em `localStorage`
- Middleware `authenticateToken` valida cada requisição

### **2. Autorização**
- Endpoints admin requerem `role = 'superadmin'`
- Middleware `requireSuperAdmin` bloqueia acesso não autorizado
- Clientes só acessam seus próprios dados

### **3. Isolamento de Dados**
- Queries filtram por `user_id` do token JWT
- Impossível acessar dados de outro usuário
- Cascade delete remove integrações ao deletar usuário

### **4. Tokens OAuth2**
- Armazenados criptografados no banco
- Renovados automaticamente antes de expirar
- Revogados ao desconectar

---

## 🔄 Fluxo OAuth2

### **1. Usuário Clica em "Conectar"**

```
Cliente → Frontend → GET /api/integrations/mercadolivre/auth/url
                  ← URL de autorização + state
```

### **2. Redirecionamento para Mercado Livre**

```
Frontend → Mercado Livre (autorização)
        ← Callback com code + state
```

### **3. Troca de Código por Tokens**

```
Mercado Livre → Backend → POST /api/integrations/mercadolivre/auth/callback
                       → Trocar code por access_token + refresh_token
                       → Salvar no banco vinculado ao user_id
                       ← Redirecionar para frontend com sucesso
```

### **4. Tokens Salvos**

```sql
INSERT INTO marketplace_integrations (
  tenant_id, user_id, marketplace,
  access_token, refresh_token, token_expires_at,
  is_active, config
) VALUES (
  1, 5, 'mercado_livre',
  'encrypted_access_token', 'encrypted_refresh_token', '2025-12-19 10:30:00',
  true, '{"ml_user_id": "123456789", "ml_nickname": "loja_abc"}'
);
```

---

## 📊 Casos de Uso

### **Caso 1: Cliente Conecta sua Conta ML**

1. Cliente faz login no Markthub CRM
2. Acessa página "Mercado Livre"
3. Clica em "Conectar com Mercado Livre"
4. É redirecionado para autorização do ML
5. Autoriza o aplicativo
6. Retorna ao Markthub com conexão ativa
7. Pode sincronizar produtos e pedidos

**Resultado:** Integração salva vinculada ao `user_id` do cliente

---

### **Caso 2: Admin Master Monitora Integrações**

1. Superadmin faz login
2. Acessa página "Mercado Livre"
3. Vê dashboard com TODAS as integrações
4. Visualiza estatísticas:
   - 15 integrações totais
   - 12 conectadas
   - 3 desconectadas
   - 2 com token expirado
5. Identifica clientes que precisam reconectar

**Resultado:** Visão completa do status de todos os clientes

---

### **Caso 3: Token Expira**

1. Sistema detecta token próximo de expirar
2. Automaticamente usa `refresh_token` para renovar
3. Atualiza `access_token` e `token_expires_at` no banco
4. Cliente continua usando sem interrupção

**Resultado:** Renovação automática transparente

---

## 🚀 Deploy e Manutenção

### **Migration**

Executar migration para criar/atualizar estrutura:

```bash
node scripts/migrate.js
```

Ou manualmente:

```bash
psql $DATABASE_URL < db/migrations/001_multi_tenant_ml.sql
```

### **Variáveis de Ambiente**

```env
ML_CLIENT_ID=7719573488458
ML_CLIENT_SECRET=mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD
ML_REDIRECT_URI=https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback
```

### **Monitoramento**

- Verificar tokens expirados: `GET /api/admin/mercadolivre/stats`
- Logs de sincronização: Console do servidor
- Erros OAuth: Sentry (se configurado)

---

## 📈 Escalabilidade

### **Suporta:**
- ✅ Ilimitados usuários por tenant
- ✅ Ilimitados tenants no sistema
- ✅ Múltiplas integrações por usuário (futuramente)
- ✅ Sincronização paralela de múltiplos clientes

### **Performance:**
- Índices otimizados para queries rápidas
- Cache de tokens em memória (Redis opcional)
- Renovação assíncrona de tokens

---

## 🔮 Próximos Passos

### **Melhorias Futuras:**

1. **Notificações**
   - Alertar cliente quando token expirar
   - Notificar admin sobre integrações inativas

2. **Webhooks**
   - Receber eventos do ML em tempo real
   - Atualizar pedidos automaticamente

3. **Analytics**
   - Dashboard com métricas de uso
   - Relatórios de sincronização

4. **Múltiplas Contas ML**
   - Permitir um usuário conectar várias contas ML
   - Seletor de conta ativa

---

## 📚 Referências

- **Documentação ML:** https://developers.mercadolivre.com.br/
- **OAuth2 Guide:** https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
- **API Reference:** https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br

---

## ✅ Checklist de Implementação

- [x] Estrutura do banco de dados
- [x] Migrations
- [x] Rotas backend (cliente)
- [x] Rotas backend (admin)
- [x] Componente MLAdminDashboard
- [x] Lógica de detecção de superadmin
- [x] OAuth2 flow
- [x] Renovação automática de tokens
- [x] Documentação
- [x] Deploy em produção

---

**Status:** ✅ **Implementação Completa e Funcional**

O sistema está pronto para uso em produção com suporte completo a multi-tenant! 🎉
