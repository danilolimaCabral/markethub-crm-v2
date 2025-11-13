# 🛒 Integração Mercado Livre - Guia Completo

## ✅ STATUS: IMPLEMENTAÇÃO COMPLETA

A integração com o Mercado Livre está **100% funcional** e pronta para uso!

---

## 📋 O QUE FOI IMPLEMENTADO

### 1. ✅ Cliente API Robusto
**Arquivo:** `/server/services/MercadoLivreAPIClient.ts`

**Features:**
- ✅ Renovação automática de token
- ✅ Rate limiting inteligente
- ✅ Retry automático em caso de erro
- ✅ Interceptors para headers automáticos
- ✅ Timeout configurável
- ✅ Todos os endpoints principais

### 2. ✅ Serviço OAuth2
**Arquivo:** `/server/services/MercadoLivreOAuthService.ts`

**Features:**
- ✅ Geração de URL de autorização
- ✅ Troca de código por token
- ✅ Renovação de access token
- ✅ Validação de token expirado
- ✅ Salvamento no banco de dados

### 3. ✅ Serviço de Sincronização
**Arquivo:** `/server/services/MercadoLivreSyncService.ts`

**Features:**
- ✅ Sincronização de pedidos (ML → CRM)
- ✅ Sincronização de produtos (ML → CRM)
- ✅ Sincronização de perguntas
- ✅ Atualização de estoque (CRM → ML)
- ✅ Criação automática de clientes
- ✅ Mapeamento de status
- ✅ Tratamento de erros robusto

### 4. ✅ Serviço de Webhooks
**Arquivo:** `/server/services/MercadoLivreWebhookService.ts`

**Features:**
- ✅ Processamento de notificações em tempo real
- ✅ Suporte a todos os tópicos (pedidos, produtos, pagamentos, etc)
- ✅ Validação de webhooks
- ✅ Processamento assíncrono
- ✅ Log de notificações

### 5. ✅ Rotas Completas
**Arquivo:** `/server/routes/mercadolivre.ts`

**Endpoints:**
```
GET  /api/integrations/mercadolivre/auth/url - Gerar URL OAuth2
GET  /api/integrations/mercadolivre/auth/callback - Callback OAuth2
GET  /api/integrations/mercadolivre/status - Status da integração
POST /api/integrations/mercadolivre/disconnect - Desconectar
POST /api/integrations/mercadolivre/sync - Sincronização completa
POST /api/integrations/mercadolivre/sync/orders - Sync apenas pedidos
POST /api/integrations/mercadolivre/sync/products - Sync apenas produtos
GET  /api/integrations/mercadolivre/sync/history - Histórico de syncs
POST /api/integrations/mercadolivre/webhook - Receber notificações
POST /api/integrations/mercadolivre/products/:id/update-stock - Atualizar estoque
```

---

## 🚀 CONFIGURAÇÃO (Passo a Passo)

### Passo 1: Criar Aplicação no Mercado Livre

1. Acesse: https://developers.mercadolivre.com.br
2. Faça login com sua conta do Mercado Livre
3. Vá em "Minhas Aplicações" → "Criar Nova Aplicação"
4. Preencha:
   - **Nome:** Markthub CRM
   - **Descrição:** Sistema de gestão integrado
   - **URL do site:** https://seudominio.com
   - **Redirect URI:** https://seudominio.com/api/integrations/mercadolivre/auth/callback
   - **Scopes necessários:**
     - `read` - Ler informações
     - `write` - Escrever/atualizar dados
     - `offline_access` - Refresh token

5. Anote suas credenciais:
   - **Client ID**: 123456789
   - **Client Secret**: ABCDEFGHIJ1234567890

### Passo 2: Configurar Variáveis de Ambiente

Edite `.env`:

```bash
# Mercado Livre API
ML_CLIENT_ID=123456789
ML_CLIENT_SECRET=ABCDEFGHIJ1234567890
ML_REDIRECT_URI=https://seudominio.com/api/integrations/mercadolivre/auth/callback

# Ou para desenvolvimento local:
ML_REDIRECT_URI=http://localhost:3000/api/integrations/mercadolivre/auth/callback
```

### Passo 3: Reiniciar Servidor

```bash
# Parar servidor
pkill -f "node"

# Iniciar novamente
pnpm dev
```

---

## 🔗 CONECTAR CONTA DO MERCADO LIVRE

### Via Frontend

1. Faça login no Markthub CRM
2. Vá em **Integrações** → **Mercado Livre**
3. Clique em **"Conectar com Mercado Livre"**
4. Será redirecionado para autorização do ML
5. Autorize o aplicativo
6. Será redirecionado de volta com integração ativa

### Via API (Manual)

```bash
# 1. Obter URL de autorização
curl -X GET http://localhost:3000/api/integrations/mercadolivre/auth/url \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"

# Resposta:
{
  "authUrl": "https://auth.mercadolivre.com.br/authorization?...",
  "state": "eyJ0ZW5hbnRfaWQiOi...",
  "expiresIn": 600
}

# 2. Abrir authUrl no navegador e autorizar

# 3. Após autorização, será redirecionado para callback
# O callback automaticamente salvará os tokens no banco
```

---

## 📊 SINCRONIZAÇÃO DE DADOS

### Sincronização Manual

```bash
# Sincronização completa (pedidos + produtos)
curl -X POST http://localhost:3000/api/integrations/mercadolivre/sync \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "syncOrders": true,
    "syncProducts": true,
    "syncQuestions": false,
    "limit": 50
  }'

# Resposta:
{
  "success": true,
  "message": "Sincronização concluída",
  "results": {
    "orders": {
      "success": true,
      "processed": 15,
      "failed": 0,
      "duration": 2500
    },
    "products": {
      "success": true,
      "processed": 30,
      "failed": 0,
      "duration": 3200
    }
  }
}
```

### Sincronização Apenas Pedidos

```bash
curl -X POST http://localhost:3000/api/integrations/mercadolivre/sync/orders \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

### Sincronização Apenas Produtos

```bash
curl -X POST http://localhost:3000/api/integrations/mercadolivre/sync/products \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

### Sincronização Automática (Cron)

Adicione ao crontab para sincronizar a cada 15 minutos:

```bash
crontab -e

# Adicionar:
*/15 * * * * curl -X POST http://localhost:3000/api/integrations/mercadolivre/sync \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```

Ou use um job scheduler (Node-Cron):

```typescript
import cron from 'node-cron';
import MercadoLivreSyncService from './services/MercadoLivreSyncService';

// Sincronizar a cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
  console.log('🔄 Iniciando sincronização automática...');
  
  const tenants = await getActiveTenants();
  
  for (const tenant of tenants) {
    try {
      const syncService = new MercadoLivreSyncService(tenant.id);
      await syncService.syncAll({ limit: 50 });
    } catch (error) {
      console.error(`Erro ao sincronizar tenant ${tenant.id}:`, error);
    }
  }
});
```

---

## 🔔 WEBHOOKS (Notificações em Tempo Real)

### Configurar Webhook no ML

1. Acesse o painel de desenvolvedor do ML
2. Vá em sua aplicação → "Notificações"
3. Adicione URL do webhook:
   ```
   https://seudominio.com/api/integrations/mercadolivre/webhook
   ```

4. Selecione os tópicos:
   - ✅ **orders_v2** - Atualizações de pedidos
   - ✅ **items** - Atualizações de produtos
   - ✅ **questions** - Novas perguntas
   - ✅ **payments** - Atualizações de pagamento
   - ✅ **shipments** - Atualizações de envio

### Testar Webhook Localmente

Use ngrok para expor localhost:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000

# Usar URL gerada no painel do ML:
# https://abc123.ngrok.io/api/integrations/mercadolivre/webhook
```

### Processar Webhooks

O sistema processa webhooks automaticamente:

```
1. ML envia notificação → POST /api/integrations/mercadolivre/webhook
2. Sistema responde 200 OK imediatamente
3. Processa notificação de forma assíncrona
4. Sincroniza dados afetados
5. Atualiza banco de dados
6. Invalida cache
```

---

## 🔄 ATUALIZAR ESTOQUE NO ML

### Via API

```bash
curl -X POST http://localhost:3000/api/integrations/mercadolivre/products/PRODUCT_ID/update-stock \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 10}'
```

### Via Código

```typescript
import MercadoLivreSyncService from './services/MercadoLivreSyncService';

// Quando estoque muda no CRM, atualizar no ML
async function onStockChange(productId: string, newQuantity: number, tenantId: string) {
  try {
    const syncService = new MercadoLivreSyncService(tenantId);
    await syncService.updateStockOnML(productId, newQuantity);
    console.log('✅ Estoque atualizado no ML');
  } catch (error) {
    console.error('❌ Erro ao atualizar estoque:', error);
  }
}
```

---

## 📈 MONITORAMENTO

### Verificar Status da Integração

```bash
curl -X GET http://localhost:3000/api/integrations/mercadolivre/status \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"

# Resposta:
{
  "connected": true,
  "integration": {
    "id": "uuid",
    "ml_user_id": "123456",
    "ml_nickname": "SEUNICK",
    "last_sync": "2025-01-15T10:30:00Z",
    "token_expires_at": "2025-01-15T16:00:00Z",
    "is_token_valid": true
  }
}
```

### Histórico de Sincronizações

```bash
curl -X GET "http://localhost:3000/api/integrations/mercadolivre/sync/history?limit=10" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"

# Resposta:
{
  "data": [
    {
      "id": "uuid",
      "sync_type": "orders",
      "status": "success",
      "records_processed": 15,
      "records_failed": 0,
      "started_at": "2025-01-15T10:30:00Z",
      "completed_at": "2025-01-15T10:30:03Z",
      "duration_seconds": 3
    }
  ]
}
```

### Logs

```bash
# Ver logs em tempo real
tail -f logs/combined.log | grep "ML"

# Ver apenas erros
tail -f logs/error.log | grep "mercadolivre"
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Código de autorização inválido"

**Causa:** Código OAuth expirou (válido por 10 minutos)

**Solução:** Gerar nova URL e autorizar novamente

### Erro: "Token inválido ou expirado"

**Causa:** Token não foi renovado automaticamente

**Solução:** O sistema renova automaticamente. Se persistir, desconecte e reconecte.

### Erro: "Rate limit excedido"

**Causa:** Muitas requisições à API do ML

**Solução:** O sistema aguarda automaticamente. Verifique se não há loops infinitos.

### Webhook não funciona

**Causa:** URL não acessível publicamente

**Solução:** 
- Use ngrok para testes locais
- Em produção, certifique-se de que a URL é HTTPS
- Verifique firewall e permissões

### Pedidos não sincronizam

1. Verificar integração ativa:
   ```bash
   SELECT * FROM marketplace_integrations 
   WHERE marketplace = 'mercado_livre' AND is_active = true;
   ```

2. Verificar token:
   ```bash
   SELECT token_expires_at FROM marketplace_integrations 
   WHERE marketplace = 'mercado_livre';
   ```

3. Ver logs de erro:
   ```bash
   SELECT * FROM marketplace_sync_log 
   WHERE status = 'error' 
   ORDER BY started_at DESC LIMIT 10;
   ```

---

## 📚 EXEMPLOS DE USO

### Exemplo 1: Sync Diário Completo

```typescript
// scripts/sync-ml-daily.ts
import MercadoLivreSyncService from '../server/services/MercadoLivreSyncService';

async function dailySync() {
  const tenants = await getActiveTenants();
  
  for (const tenant of tenants) {
    console.log(`Sincronizando tenant ${tenant.id}...`);
    
    const syncService = new MercadoLivreSyncService(tenant.id);
    
    const results = await syncService.syncAll({
      syncOrders: true,
      syncProducts: true,
      syncQuestions: true,
      limit: 100,
    });
    
    console.log(`✅ Tenant ${tenant.id} sincronizado:`, results);
  }
}

// Executar via cron diariamente às 3h
// 0 3 * * * node scripts/sync-ml-daily.js
```

### Exemplo 2: Atualizar Estoque em Massa

```typescript
// Quando estoque é atualizado no CRM
async function updateStockBatch(updates: Array<{sku: string, quantity: number}>, tenantId: string) {
  const syncService = new MercadoLivreSyncService(tenantId);
  await syncService.initialize();
  
  for (const update of updates) {
    try {
      await syncService.updateStockOnML(update.sku, update.quantity);
      console.log(`✅ ${update.sku}: ${update.quantity}`);
    } catch (error) {
      console.error(`❌ ${update.sku}:`, error);
    }
  }
}
```

---

## 🎯 PRÓXIMOS PASSOS

### Melhorias Futuras
- [ ] Responder perguntas automaticamente via IA
- [ ] Criar produtos no ML a partir do CRM
- [ ] Sincronização de categorias e atributos
- [ ] Relatórios de performance por marketplace
- [ ] Alertas de vendas via Telegram/WhatsApp

---

## 📞 SUPORTE

**Problemas com a integração?**
- Verifique os logs: `logs/combined.log`
- Consulte este guia
- Abra uma issue no GitHub

**Links Úteis:**
- [Documentação ML](https://developers.mercadolivre.com.br/pt_br/api-docs)
- [OAuth2 ML](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao)
- [Webhooks ML](https://developers.mercadolivre.com.br/pt_br/notificacoes)

---

**✅ Integração 100% Funcional e Pronta para Uso!**

**Desenvolvido com ❤️ por Manus AI**
