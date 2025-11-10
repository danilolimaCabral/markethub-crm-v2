# Guia Completo de Integrações - MarketHub CRM

## Visão Geral

Este guia consolida todas as informações necessárias para integrar o **MarketHub CRM** com os principais marketplaces: **Mercado Livre**, **Amazon** e **Shopee**.

---

## Comparativo de APIs

| Característica | Mercado Livre | Amazon SP-API | Shopee |
|----------------|---------------|---------------|---------|
| **Complexidade** | ⭐⭐⭐ (Média) | ⭐⭐⭐⭐⭐ (Alta) | ⭐⭐⭐ (Média) |
| **Autenticação** | OAuth 2.0 | OAuth 2.0 + AWS Sig V4 | OAuth 2.0 + HMAC |
| **Documentação** | Excelente (PT-BR) | Extensa mas complexa | Boa (EN) |
| **Rate Limits** | Moderados | Restritivos | Generosos |
| **Registro** | Simples | Complexo (requer AWS) | Simples |
| **Tempo de Setup** | 1-2 horas | 4-8 horas | 2-3 horas |
| **Custo** | Gratuito | Gratuito | Gratuito |

---

## Checklist de Integração

### Mercado Livre ✅

- [ ] Criar conta de desenvolvedor em https://developers.mercadolivre.com.br
- [ ] Registrar aplicação e obter Client ID + Client Secret
- [ ] Implementar fluxo OAuth2 (Authorization Code)
- [ ] Obter e armazenar Refresh Token
- [ ] Implementar renovação automática de Access Token
- [ ] Testar endpoints principais (pedidos, produtos, perguntas)
- [ ] Implementar webhook para notificações em tempo real
- [ ] Tratar rate limits (10 req/s)

### Amazon SP-API ⚠️

- [ ] Criar conta de vendedor Amazon
- [ ] Registrar como desenvolvedor SP-API
- [ ] Criar usuário IAM na AWS Console
- [ ] Gerar Access Key ID + Secret Access Key
- [ ] Criar política IAM com permissões execute-api
- [ ] Registrar aplicação no Seller Central
- [ ] Obter LWA Client ID + Client Secret
- [ ] Implementar fluxo OAuth2 para obter Refresh Token
- [ ] Implementar geração de LWA Access Token
- [ ] Implementar assinatura AWS Signature V4
- [ ] Testar endpoints principais (orders, catalog, listings)
- [ ] Implementar retry com backoff exponencial
- [ ] Configurar SQS para notificações (opcional)
- [ ] Tratar rate limits restritivos

### Shopee 🛒

- [ ] Criar conta de desenvolvedor em https://open.shopee.com
- [ ] Registrar aplicação e obter Partner ID + Partner Key
- [ ] Implementar fluxo de autorização de loja
- [ ] Obter Shop ID + Access Token
- [ ] Implementar geração de assinatura HMAC-SHA256
- [ ] Testar endpoints principais (produtos, pedidos)
- [ ] Implementar sincronização periódica
- [ ] Tratar rate limits (1000 req/min)

---

## Ordem Recomendada de Implementação

1. **Mercado Livre** (Começar aqui)
   - Mais simples
   - Documentação em português
   - Mercado brasileiro

2. **Shopee** (Segundo)
   - Complexidade média
   - Boa documentação
   - Crescimento no Brasil

3. **Amazon** (Por último)
   - Mais complexo
   - Requer AWS
   - Maior investimento de tempo

---

## Estrutura de Código Sugerida

```
/src
  /integrations
    /mercadolivre
      - auth.js          # OAuth2 flow
      - api.js           # API client
      - webhooks.js      # Webhook handler
      - sync.js          # Sincronização
    /amazon
      - auth.js          # LWA + AWS Signature
      - api.js           # SP-API client
      - notifications.js # SQS handler
      - sync.js          # Sincronização
    /shopee
      - auth.js          # OAuth2 + HMAC
      - api.js           # API client
      - sync.js          # Sincronização
    /common
      - database.js      # PostgreSQL queries
      - queue.js         # Job queue
      - logger.js        # Logging
```

---

## Fluxo de Sincronização Unificado

### 1. Pedidos

```javascript
// Sincronizar pedidos de todos os marketplaces
async function syncAllOrders() {
  const marketplaces = ['mercadolivre', 'amazon', 'shopee'];
  
  for (const marketplace of marketplaces) {
    try {
      const orders = await fetchOrders(marketplace);
      await saveOrdersToDatabase(orders, marketplace);
      console.log(`${marketplace}: ${orders.length} pedidos sincronizados`);
    } catch (error) {
      console.error(`Erro ao sincronizar ${marketplace}:`, error);
    }
  }
}

// Executar a cada 15 minutos
setInterval(syncAllOrders, 15 * 60 * 1000);
```

### 2. Produtos

```javascript
// Sincronizar produtos
async function syncAllProducts() {
  const marketplaces = ['mercadolivre', 'amazon', 'shopee'];
  
  for (const marketplace of marketplaces) {
    try {
      const products = await fetchProducts(marketplace);
      await saveProductsToDatabase(products, marketplace);
      console.log(`${marketplace}: ${products.length} produtos sincronizados`);
    } catch (error) {
      console.error(`Erro ao sincronizar ${marketplace}:`, error);
    }
  }
}

// Executar a cada 1 hora
setInterval(syncAllProducts, 60 * 60 * 1000);
```

### 3. Estoque

```javascript
// Sincronizar estoque bidirecional
async function syncInventory(productId, quantity) {
  const marketplaces = ['mercadolivre', 'amazon', 'shopee'];
  
  for (const marketplace of marketplaces) {
    try {
      await updateStock(marketplace, productId, quantity);
      console.log(`${marketplace}: Estoque atualizado para ${quantity}`);
    } catch (error) {
      console.error(`Erro ao atualizar ${marketplace}:`, error);
    }
  }
}
```

---

## Tratamento de Erros

### Estratégia de Retry

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`Retry ${i + 1}/${maxRetries} em ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Uso
const orders = await retryWithBackoff(() => 
  mercadoLivreAPI.listOrders()
);
```

### Rate Limit Handler

```javascript
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async waitIfNeeded() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}

// Uso
const mlLimiter = new RateLimiter(10, 1000); // 10 req/s
await mlLimiter.waitIfNeeded();
const response = await mercadoLivreAPI.makeRequest(...);
```

---

## Armazenamento de Credenciais

### Variáveis de Ambiente (.env)

```bash
# Mercado Livre
ML_CLIENT_ID=your_client_id
ML_CLIENT_SECRET=your_client_secret
ML_REFRESH_TOKEN=your_refresh_token

# Amazon SP-API
AMAZON_CLIENT_ID=your_client_id
AMAZON_CLIENT_SECRET=your_client_secret
AMAZON_REFRESH_TOKEN=your_refresh_token
AMAZON_AWS_ACCESS_KEY=your_aws_access_key
AMAZON_AWS_SECRET_KEY=your_aws_secret_key
AMAZON_REGION=us-east-1
AMAZON_MARKETPLACE_ID=A2Q3Y263D00KWC

# Shopee
SHOPEE_PARTNER_ID=your_partner_id
SHOPEE_PARTNER_KEY=your_partner_key
SHOPEE_SHOP_ID=your_shop_id
SHOPEE_ACCESS_TOKEN=your_access_token

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/markethub
```

---

## Monitoramento e Logs

### Estrutura de Log

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Uso
logger.info('Sincronização iniciada', { marketplace: 'mercadolivre' });
logger.error('Erro na sincronização', { marketplace: 'amazon', error: error.message });
```

### Métricas Importantes

- Total de pedidos sincronizados por marketplace
- Tempo médio de sincronização
- Taxa de erro por marketplace
- Rate limits atingidos
- Produtos sem estoque
- Pedidos pendentes de envio

---

## Próximos Passos

1. **Implementar backend Node.js + Express**
2. **Conectar ao PostgreSQL com Prisma**
3. **Criar endpoints REST para o frontend**
4. **Implementar job queue (Bull/BullMQ)**
5. **Configurar webhooks e notificações**
6. **Criar dashboard de monitoramento**
7. **Implementar testes automatizados**
8. **Deploy em produção**

---

## Documentos de Referência

- [Integração Mercado Livre](./INTEGRACAO_MERCADO_LIVRE.md)
- [Integração Amazon SP-API](./INTEGRACAO_AMAZON_SPAPI.md)
- [Integração Shopee](./INTEGRACAO_SHOPEE_API.md)
- [Estrutura do Banco de Dados](./DATABASE_STRUCTURE.md)
- [Guia de Produção](./GUIA_PRODUCAO.md)

---

**MarketHub CRM** - Sistema completo de gestão para marketplaces
