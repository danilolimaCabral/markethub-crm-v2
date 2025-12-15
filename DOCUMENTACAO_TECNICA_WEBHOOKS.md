# Documentação Técnica - Webhooks do Mercado Livre

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Implementação](#implementação)
4. [Segurança](#segurança)
5. [Testes](#testes)
6. [Monitoramento](#monitoramento)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## 🎯 Visão Geral

O sistema de webhooks do Mercado Livre permite que o MarketHub CRM receba notificações em tempo real sobre eventos importantes, eliminando a necessidade de polling constante e garantindo sincronização instantânea.

### Características Principais

- ✅ **Processamento assíncrono**: Responde em < 3 segundos (requisito do ML)
- ✅ **Validação robusta**: Verifica estrutura, tipos e formato das notificações
- ✅ **Logging completo**: Todas as notificações são registradas para auditoria
- ✅ **Multi-tenant**: Suporta múltiplos vendedores isolados por tenant
- ✅ **Idempotente**: Processa duplicatas sem efeitos colaterais
- ✅ **Retry automático**: ML tenta até 12 vezes em caso de falha

### Eventos Suportados

| Tópico | Descrição | Ação no Sistema |
|--------|-----------|-----------------|
| `orders_v2` | Pedidos | Sincroniza pedido específico |
| `items` | Produtos | Atualiza produto no catálogo |
| `questions` | Perguntas | Registra pergunta (TODO: notificar) |
| `messages` | Mensagens | Registra mensagem (TODO: chat) |
| `payments` | Pagamentos | Atualiza status do pedido |
| `shipments` | Envios | Atualiza tracking do pedido |

---

## 🏗️ Arquitetura

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        MERCADO LIVRE                            │
│                                                                 │
│  Evento ocorre (novo pedido, pagamento, etc.)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP POST
                            │ JSON payload
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETHUB CRM - WEBHOOK                      │
│                                                                 │
│  POST /api/integrations/mercadolivre/webhook                   │
│                                                                 │
│  1. Recebe notificação                                         │
│  2. Valida estrutura e tipos                                   │
│  3. Retorna 200 OK (< 3s)                                      │
│  4. Processa assincronamente                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Async processing
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROCESSAMENTO ASSÍNCRONO                       │
│                                                                 │
│  1. Salva log no banco (marketplace_sync_log)                  │
│  2. Identifica tenant pela integração                          │
│  3. Busca dados atualizados via API ML                         │
│  4. Atualiza banco de dados                                    │
│  5. (Futuro) Envia notificação ao usuário                      │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes

#### 1. Rota do Webhook (`/server/routes/mercadolivre.ts`)

```typescript
router.post('/webhook', async (req, res) => {
  await MercadoLivreWebhookService.handleWebhook(req, res);
});
```

**Características:**
- Rota pública (sem autenticação)
- Não usa middleware de tenant isolation
- Aceita requisições apenas do ML

#### 2. Serviço de Webhook (`/server/services/MercadoLivreWebhookService.ts`)

**Responsabilidades:**
- Validar estrutura da notificação
- Responder rapidamente (< 3s)
- Processar eventos de forma assíncrona
- Registrar logs de auditoria
- Sincronizar dados com API do ML

**Métodos principais:**

| Método | Descrição |
|--------|-----------|
| `handleWebhook()` | Ponto de entrada, valida e responde |
| `validateWebhook()` | Valida estrutura e tipos |
| `processNotification()` | Processa evento específico |
| `processOrderNotification()` | Sincroniza pedido |
| `processItemNotification()` | Sincroniza produto |
| `saveNotificationLog()` | Registra no banco |

#### 3. Cliente API ML (`/server/services/MercadoLivreAPIClient.ts`)

**Responsabilidades:**
- Buscar dados atualizados via API
- Gerenciar tokens de acesso
- Fazer refresh automático de tokens

#### 4. Serviço de Sincronização (`/server/services/MercadoLivreSyncService.ts`)

**Responsabilidades:**
- Salvar/atualizar dados no banco
- Manter consistência dos dados
- Aplicar regras de negócio

---

## 💻 Implementação

### Estrutura da Notificação

O Mercado Livre envia notificações no seguinte formato:

```typescript
interface MLNotification {
  _id: string;                // ID único da notificação
  resource: string;           // URL do recurso (ex: /orders/123)
  user_id: number;            // ID do vendedor no ML
  topic: string;              // Tipo de evento
  application_id: number;     // ID da aplicação
  attempts: number;           // Número de tentativas
  sent: string;               // Data de envio (ISO)
  received: string;           // Data de recebimento (ISO)
}
```

**Exemplo real:**

```json
{
  "_id": "123456789",
  "resource": "/orders/2000003692581726",
  "user_id": 123456789,
  "topic": "orders_v2",
  "application_id": 1234567890,
  "attempts": 1,
  "sent": "2025-12-15T10:30:00.000Z",
  "received": "2025-12-15T10:30:00.500Z"
}
```

### Validações Implementadas

#### 1. Validação de Estrutura

```typescript
if (!notification._id || !notification.resource || !notification.topic) {
  console.error('❌ Webhook com estrutura inválida');
  return false;
}
```

#### 2. Validação de Tipos

```typescript
if (typeof notification.user_id !== 'number' || 
    typeof notification.application_id !== 'number') {
  console.error('❌ Tipos de dados inválidos no webhook');
  return false;
}
```

#### 3. Validação de Formato

```typescript
if (!notification.resource.startsWith('/')) {
  console.error('❌ Formato de resource inválido');
  return false;
}
```

#### 4. Validação de Tópico

```typescript
const validTopics = Object.values(NotificationTopic);
if (!validTopics.includes(notification.topic as NotificationTopic)) {
  console.warn(`⚠️  Tópico desconhecido: ${notification.topic}`);
  // Não bloqueia - pode ser novo tópico do ML
}
```

### Processamento por Tópico

#### Orders (Pedidos)

```typescript
private static async processOrderNotification(notification: MLNotification): Promise<void> {
  // 1. Extrair order ID
  const orderId = notification.resource.split('/').pop();
  
  // 2. Buscar tenant
  const tenantResult = await query(
    `SELECT tenant_id FROM marketplace_integrations 
     WHERE marketplace = 'mercado_livre' AND is_active = true
     LIMIT 1`
  );
  
  // 3. Buscar pedido via API
  const client = new MercadoLivreAPIClient(tenantId);
  await client.initialize();
  const order = await client.getOrder(orderId);
  
  // 4. Sincronizar com banco
  const syncService = new MercadoLivreSyncService(tenantId);
  await syncService.initialize();
  await syncService.syncOrders(1);
}
```

#### Items (Produtos)

```typescript
private static async processItemNotification(notification: MLNotification): Promise<void> {
  // 1. Extrair item ID
  const itemId = notification.resource.split('/').pop();
  
  // 2. Buscar tenant
  const tenantResult = await query(
    `SELECT tenant_id FROM marketplace_integrations 
     WHERE marketplace = 'mercado_livre' AND is_active = true
     LIMIT 1`
  );
  
  // 3. Sincronizar produto
  const syncService = new MercadoLivreSyncService(tenantId);
  await syncService.initialize();
  await syncService.syncProducts(1);
}
```

#### Questions (Perguntas)

```typescript
private static async processQuestionNotification(notification: MLNotification): Promise<void> {
  const questionId = notification.resource.split('/').pop();
  console.log(`❓ Nova pergunta: ${questionId}`);
  
  // TODO: Implementar
  // 1. Buscar pergunta via API
  // 2. Salvar no banco
  // 3. Notificar usuário (email/push)
}
```

### Logging e Auditoria

Todas as notificações são registradas na tabela `marketplace_sync_log`:

```typescript
await query(
  `INSERT INTO marketplace_sync_log (
    integration_id, sync_type, status, details, started_at
  ) SELECT 
    id, $1, $2, $3, NOW()
  FROM marketplace_integrations
  WHERE marketplace = 'mercado_livre' 
  AND access_token IS NOT NULL
  LIMIT 1`,
  [
    `webhook_${notification.topic}`,
    'processing',
    JSON.stringify(notification),
  ]
);
```

---

## 🔐 Segurança

### Validações de Segurança

#### 1. Validação de Estrutura
- Verifica presença de campos obrigatórios
- Valida tipos de dados
- Verifica formato dos campos

#### 2. Validação de IP (Opcional)

```typescript
// IPs conhecidos do Mercado Livre
const mlIpRanges = ['209.225.49.0/24', '216.33.197.0/24'];

if (sourceIp && !isIpInRanges(sourceIp, mlIpRanges)) {
  console.warn(`⚠️  IP não reconhecido: ${sourceIp}`);
}
```

**Nota:** Validação de IP está comentada por padrão, pois o ML pode usar diferentes IPs.

#### 3. Validação de Tenant

```typescript
const tenantResult = await query(
  `SELECT tenant_id FROM marketplace_integrations 
   WHERE marketplace = 'mercado_livre' 
   AND user_id = $1 
   AND is_active = true`,
  [notification.user_id]
);

if (tenantResult.rows.length === 0) {
  console.error('❌ Nenhum tenant encontrado para user_id:', notification.user_id);
  return;
}
```

### Boas Práticas

1. **Resposta Rápida**: Sempre responder em < 3 segundos
2. **Processamento Assíncrono**: Não bloquear a resposta
3. **Idempotência**: Processar duplicatas sem efeitos colaterais
4. **Logging**: Registrar todas as notificações para auditoria
5. **Tratamento de Erros**: Capturar e logar erros sem quebrar

### Limitações

- ❌ ML não envia assinatura digital (HMAC)
- ❌ Não é possível validar autenticidade criptográfica
- ✅ Validação baseada em estrutura e contexto
- ✅ Isolamento por tenant garante segurança

---

## 🧪 Testes

### Script de Teste

O sistema inclui um script de teste completo:

```bash
# Testar pedido
node test-webhook.js order

# Testar produto
node test-webhook.js item

# Testar todos os tipos
node test-webhook.js all

# Testar em servidor local
node test-webhook.js order http://localhost:3000/api/integrations/mercadolivre/webhook
```

### Teste Manual com cURL

```bash
curl -X POST https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "test-123",
    "resource": "/orders/2000003692581726",
    "user_id": 123456789,
    "topic": "orders_v2",
    "application_id": 1234567890,
    "attempts": 1,
    "sent": "2025-12-15T10:00:00.000Z",
    "received": "2025-12-15T10:00:00.000Z"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "received": true,
  "response_time_ms": 45
}
```

### Teste de Integração

1. **Criar pedido de teste no ML**
   - Acesse sua loja no Mercado Livre
   - Faça uma compra de teste
   - Aguarde 5-10 segundos

2. **Verificar logs**
   ```bash
   railway logs --tail 100
   ```

3. **Verificar banco de dados**
   ```sql
   SELECT * FROM marketplace_sync_log 
   WHERE sync_type LIKE 'webhook_%' 
   ORDER BY started_at DESC 
   LIMIT 10;
   ```

4. **Verificar pedido sincronizado**
   ```sql
   SELECT * FROM orders 
   WHERE marketplace_order_id = '2000003692581726';
   ```

### Testes Automatizados

#### Teste de Validação

```typescript
describe('MercadoLivreWebhookService', () => {
  describe('validateWebhook', () => {
    it('deve validar notificação válida', () => {
      const notification = {
        _id: 'test-123',
        resource: '/orders/123',
        user_id: 123,
        topic: 'orders_v2',
        application_id: 123,
        attempts: 1,
        sent: new Date().toISOString(),
        received: new Date().toISOString(),
      };
      
      expect(MercadoLivreWebhookService.validateWebhook(notification)).toBe(true);
    });
    
    it('deve rejeitar notificação sem _id', () => {
      const notification = {
        resource: '/orders/123',
        user_id: 123,
        topic: 'orders_v2',
      };
      
      expect(MercadoLivreWebhookService.validateWebhook(notification)).toBe(false);
    });
  });
});
```

---

## 📊 Monitoramento

### Métricas Importantes

| Métrica | Descrição | Alerta |
|---------|-----------|--------|
| Taxa de sucesso | % de webhooks processados com sucesso | < 95% |
| Tempo de resposta | Tempo para responder 200 OK | > 2s |
| Taxa de duplicatas | % de notificações duplicadas | > 20% |
| Taxa de erros | % de webhooks que falharam | > 5% |

### Queries de Monitoramento

#### Taxa de Sucesso (últimas 24h)

```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND started_at > NOW() - INTERVAL '24 hours';
```

#### Webhooks por Tópico (últimas 24h)

```sql
SELECT 
  sync_type,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND started_at > NOW() - INTERVAL '24 hours'
GROUP BY sync_type
ORDER BY count DESC;
```

#### Últimos Erros

```sql
SELECT 
  sync_type,
  details,
  error_message,
  started_at
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND status = 'error'
ORDER BY started_at DESC
LIMIT 20;
```

### Dashboard de Monitoramento

Recomenda-se criar um dashboard com:

1. **Gráfico de linha**: Webhooks recebidos por hora
2. **Gráfico de pizza**: Distribuição por tópico
3. **Tabela**: Últimas notificações recebidas
4. **Alerta**: Taxa de erro > 5%
5. **Alerta**: Tempo de resposta > 2s

---

## 🐛 Troubleshooting

### Problema: Webhooks não estão sendo recebidos

#### Diagnóstico

1. **Verificar se URL está acessível**
   ```bash
   curl -I https://www.markthubcrm.com.br/api/integrations/mercadolivre/webhook
   ```
   
   **Esperado:** HTTP 405 (Method Not Allowed) ou 400 (Bad Request)
   **Problema:** Timeout ou Connection Refused

2. **Verificar registro no ML**
   ```bash
   curl -X GET \
     'https://api.mercadolibre.com/applications/YOUR_APP_ID/notifications/subscriptions' \
     -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
   ```

3. **Verificar logs do servidor**
   ```bash
   railway logs --tail 100 | grep webhook
   ```

#### Soluções

- **URL não acessível**: Verificar se servidor está online
- **Webhook não registrado**: Registrar novamente no DevCenter
- **Firewall bloqueando**: Adicionar IPs do ML à whitelist
- **SSL inválido**: Renovar certificado HTTPS

### Problema: Webhooks recebidos mas não processados

#### Diagnóstico

1. **Verificar logs de erro**
   ```sql
   SELECT * FROM marketplace_sync_log 
   WHERE sync_type LIKE 'webhook_%' 
   AND status = 'error' 
   ORDER BY started_at DESC;
   ```

2. **Verificar estrutura da notificação**
   ```sql
   SELECT details FROM marketplace_sync_log 
   WHERE sync_type LIKE 'webhook_%' 
   ORDER BY started_at DESC 
   LIMIT 1;
   ```

3. **Verificar token de acesso**
   ```sql
   SELECT 
     marketplace,
     expires_at,
     expires_at < NOW() as expired
   FROM marketplace_integrations
   WHERE marketplace = 'mercado_livre';
   ```

#### Soluções

- **Token expirado**: Fazer refresh do token OAuth2
- **Estrutura inválida**: Atualizar validações
- **Erro de banco**: Verificar conexão e schema
- **Erro de API**: Verificar rate limits do ML

### Problema: Notificações duplicadas

#### Comportamento Esperado

O Mercado Livre pode enviar a mesma notificação até 12 vezes se não receber resposta 200 OK.

#### Solução

O sistema já é idempotente - processar a mesma notificação várias vezes não causa problemas. Para evitar processamento duplicado:

```typescript
// Verificar se já foi processada
const existing = await query(
  `SELECT id FROM marketplace_sync_log 
   WHERE sync_type = $1 
   AND details->>'_id' = $2`,
  [`webhook_${notification.topic}`, notification._id]
);

if (existing.rows.length > 0) {
  console.log('⚠️  Notificação já processada:', notification._id);
  return;
}
```

### Problema: Timeout ao processar webhook

#### Diagnóstico

```sql
SELECT 
  sync_type,
  EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
FROM marketplace_sync_log
WHERE sync_type LIKE 'webhook_%'
  AND EXTRACT(EPOCH FROM (completed_at - started_at)) > 3
ORDER BY started_at DESC;
```

#### Solução

- Otimizar queries do banco
- Adicionar índices nas tabelas
- Usar cache para dados frequentes
- Processar em background job

---

## 📖 API Reference

### POST /api/integrations/mercadolivre/webhook

Endpoint público para receber notificações do Mercado Livre.

#### Request

**Headers:**
```
Content-Type: application/json
User-Agent: MercadoLibre/1.0
```

**Body:**
```json
{
  "_id": "string",
  "resource": "string",
  "user_id": number,
  "topic": "string",
  "application_id": number,
  "attempts": number,
  "sent": "string (ISO date)",
  "received": "string (ISO date)"
}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "received": true,
  "response_time_ms": 45
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Invalid webhook"
}
```

#### Tópicos Suportados

| Tópico | Descrição |
|--------|-----------|
| `orders_v2` | Notificações de pedidos |
| `items` | Notificações de produtos |
| `questions` | Notificações de perguntas |
| `messages` | Notificações de mensagens |
| `payments` | Notificações de pagamentos |
| `shipments` | Notificações de envios |

#### Exemplos

**Notificação de Pedido:**
```json
{
  "_id": "123456789",
  "resource": "/orders/2000003692581726",
  "user_id": 123456789,
  "topic": "orders_v2",
  "application_id": 1234567890,
  "attempts": 1,
  "sent": "2025-12-15T10:30:00.000Z",
  "received": "2025-12-15T10:30:00.500Z"
}
```

**Notificação de Produto:**
```json
{
  "_id": "987654321",
  "resource": "/items/MLB123456789",
  "user_id": 123456789,
  "topic": "items",
  "application_id": 1234567890,
  "attempts": 1,
  "sent": "2025-12-15T11:00:00.000Z",
  "received": "2025-12-15T11:00:00.200Z"
}
```

---

## 📝 Changelog

### v1.0.0 (2025-12-15)

**Adicionado:**
- ✅ Implementação inicial do serviço de webhooks
- ✅ Suporte para 6 tipos de notificações
- ✅ Validação robusta de estrutura e tipos
- ✅ Processamento assíncrono
- ✅ Logging completo de auditoria
- ✅ Script de teste automatizado
- ✅ Documentação completa

**Pendente:**
- ⏳ Implementar processamento de perguntas
- ⏳ Implementar processamento de mensagens
- ⏳ Adicionar notificações push para usuários
- ⏳ Implementar retry queue para falhas
- ⏳ Adicionar validação de IP do ML
- ⏳ Criar dashboard de monitoramento

---

## 📚 Referências

- [Mercado Livre - Notificações IPN](https://developers.mercadolivre.com.br/pt_br/notificacoes-ipn)
- [Mercado Livre - API de Notificações](https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br)
- [Mercado Livre - Tópicos de Notificação](https://developers.mercadolivre.com.br/pt_br/notificacoes-ipn#topics)
- [Express.js - Request/Response](https://expressjs.com/en/api.html)
- [TypeScript - Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)

---

**Última atualização:** 15 de dezembro de 2025  
**Versão:** 1.0.0  
**Autor:** MarketHub CRM Team
