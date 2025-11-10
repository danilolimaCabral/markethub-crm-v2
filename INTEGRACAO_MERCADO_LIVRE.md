# Integração com Mercado Livre - Documentação Completa

## Visão Geral

O Mercado Livre oferece uma API REST completa para integração com marketplaces. A API permite gerenciar produtos, pedidos, perguntas, estoque, mensagens e muito mais.

**URL Base:** `https://api.mercadolibre.com`

---

## 1. Autenticação OAuth2

### Registro de Aplicação

1. Acesse: https://developers.mercadolivre.com.br/
2. Crie uma aplicação no portal de desenvolvedores
3. Obtenha `Client ID` e `Client Secret`
4. Configure `Redirect URI` (callback URL)

### Fluxo de Autorização (Authorization Code)

**Passo 1: Redirecionar usuário para autorização**

```
GET https://auth.mercadolibre.com.br/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI
```

**Passo 2: Receber código de autorização**

Após autorização, o usuário é redirecionado para:
```
YOUR_REDIRECT_URI?code=AUTHORIZATION_CODE
```

**Passo 3: Trocar código por access token**

```javascript
POST https://api.mercadolibre.com/oauth/token

Body:
{
  "grant_type": "authorization_code",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "code": "AUTHORIZATION_CODE",
  "redirect_uri": "YOUR_REDIRECT_URI"
}

Response:
{
  "access_token": "APP_USR-...",
  "token_type": "Bearer",
  "expires_in": 21600,
  "scope": "offline_access read write",
  "user_id": 123456789,
  "refresh_token": "TG-..."
}
```

### Refresh Token

O access token expira em 6 horas. Use o refresh token para renovar:

```javascript
POST https://api.mercadolibre.com/oauth/token

Body:
{
  "grant_type": "refresh_token",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "refresh_token": "TG-..."
}
```

---

## 2. Recursos da API

### 2.1 Produtos (Items)

#### Listar produtos do vendedor

```javascript
GET https://api.mercadolibre.com/users/{USER_ID}/items/search?access_token=ACCESS_TOKEN

Query Parameters:
- status: active, paused, closed
- offset: paginação
- limit: quantidade (max 50)
```

#### Obter detalhes de um produto

```javascript
GET https://api.mercadolibre.com/items/{ITEM_ID}
```

#### Criar produto

```javascript
POST https://api.mercadolibre.com/items?access_token=ACCESS_TOKEN

Body:
{
  "title": "Nome do Produto",
  "category_id": "MLB1234",
  "price": 99.90,
  "currency_id": "BRL",
  "available_quantity": 10,
  "buying_mode": "buy_it_now",
  "listing_type_id": "gold_special",
  "condition": "new",
  "description": {
    "plain_text": "Descrição do produto"
  },
  "pictures": [
    {
      "source": "https://url-da-imagem.jpg"
    }
  ],
  "attributes": [
    {
      "id": "BRAND",
      "value_name": "Marca"
    }
  ]
}
```

#### Atualizar produto

```javascript
PUT https://api.mercadolibre.com/items/{ITEM_ID}?access_token=ACCESS_TOKEN

Body: (mesma estrutura do POST, apenas campos a atualizar)
```

### 2.2 Pedidos (Orders)

#### Listar pedidos

```javascript
GET https://api.mercadolibre.com/orders/search?seller={USER_ID}&access_token=ACCESS_TOKEN

Query Parameters:
- order.status: paid, confirmed, cancelled
- sort: date_asc, date_desc
- offset: paginação
- limit: quantidade (max 50)
```

#### Obter detalhes de um pedido

```javascript
GET https://api.mercadolibre.com/orders/{ORDER_ID}?access_token=ACCESS_TOKEN

Response inclui:
- buyer: dados do comprador
- order_items: produtos comprados
- payments: informações de pagamento
- shipping: dados de envio
- status: status do pedido
```

### 2.3 Perguntas (Questions)

#### Listar perguntas

```javascript
GET https://api.mercadolibre.com/questions/search?item_id={ITEM_ID}&access_token=ACCESS_TOKEN

Query Parameters:
- status: UNANSWERED, ANSWERED
- sort: date_asc, date_desc
```

#### Responder pergunta

```javascript
POST https://api.mercadolibre.com/answers?access_token=ACCESS_TOKEN

Body:
{
  "question_id": 123456,
  "text": "Resposta para a pergunta"
}
```

### 2.4 Categorias

#### Buscar categorias

```javascript
GET https://api.mercadolibre.com/sites/MLB/categories
```

#### Obter atributos de uma categoria

```javascript
GET https://api.mercadolibre.com/categories/{CATEGORY_ID}/attributes
```

### 2.5 Envios (Shipments)

#### Obter informações de envio

```javascript
GET https://api.mercadolibre.com/shipments/{SHIPMENT_ID}?access_token=ACCESS_TOKEN
```

#### Imprimir etiqueta de envio

```javascript
GET https://api.mercadolibre.com/shipment_labels?shipment_ids={SHIPMENT_ID}&response_type=pdf&access_token=ACCESS_TOKEN
```

---

## 3. Webhooks (Notificações)

O Mercado Livre envia notificações em tempo real sobre mudanças em pedidos, perguntas, mensagens, etc.

### Configurar webhook

```javascript
POST https://api.mercadolibre.com/applications/{APP_ID}/notifications?access_token=ACCESS_TOKEN

Body:
{
  "topic": "orders_v2",
  "url": "https://seu-servidor.com/webhook"
}
```

### Tópicos disponíveis

- `orders_v2`: Novos pedidos e mudanças de status
- `items`: Mudanças em produtos
- `questions`: Novas perguntas
- `claims`: Reclamações
- `messages`: Mensagens de compradores

### Receber notificação

```javascript
POST https://seu-servidor.com/webhook

Body:
{
  "resource": "/orders/123456789",
  "user_id": 987654321,
  "topic": "orders_v2",
  "application_id": 123456,
  "attempts": 1,
  "sent": "2025-11-08T00:00:00.000Z",
  "received": "2025-11-08T00:00:01.000Z"
}
```

Após receber a notificação, faça uma chamada GET para o `resource` para obter os dados completos.

---

## 4. Rate Limits

- **Limite padrão:** 10.000 requisições por hora por aplicação
- **Limite por IP:** 1.000 requisições por hora
- **Headers de resposta:**
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp de reset

---

## 5. Códigos de Status HTTP

- `200 OK`: Sucesso
- `201 Created`: Recurso criado
- `400 Bad Request`: Erro na requisição
- `401 Unauthorized`: Token inválido ou expirado
- `403 Forbidden`: Sem permissão
- `404 Not Found`: Recurso não encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Erro no servidor

---

## 6. Exemplo Completo de Integração (Node.js)

```javascript
const axios = require('axios');

class MercadoLivreAPI {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.baseURL = 'https://api.mercadolibre.com';
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Gerar URL de autorização
  getAuthURL() {
    return `https://auth.mercadolibre.com.br/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}`;
  }

  // Trocar código por token
  async getAccessToken(code) {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      return response.data;
    } catch (error) {
      console.error('Erro ao obter token:', error.response.data);
      throw error;
    }
  }

  // Renovar token
  async refreshAccessToken() {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      
      return response.data;
    } catch (error) {
      console.error('Erro ao renovar token:', error.response.data);
      throw error;
    }
  }

  // Listar produtos
  async listItems(userId, status = 'active') {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/${userId}/items/search`,
        {
          params: {
            access_token: this.accessToken,
            status: status,
            limit: 50
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro ao listar produtos:', error.response.data);
      throw error;
    }
  }

  // Listar pedidos
  async listOrders(userId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/orders/search`,
        {
          params: {
            seller: userId,
            access_token: this.accessToken,
            sort: 'date_desc',
            limit: 50
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro ao listar pedidos:', error.response.data);
      throw error;
    }
  }

  // Obter detalhes de pedido
  async getOrder(orderId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/orders/${orderId}`,
        {
          params: {
            access_token: this.accessToken
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro ao obter pedido:', error.response.data);
      throw error;
    }
  }

  // Listar perguntas não respondidas
  async listUnansweredQuestions(itemId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/questions/search`,
        {
          params: {
            item_id: itemId,
            access_token: this.accessToken,
            status: 'UNANSWERED'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro ao listar perguntas:', error.response.data);
      throw error;
    }
  }

  // Responder pergunta
  async answerQuestion(questionId, text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/answers`,
        {
          question_id: questionId,
          text: text
        },
        {
          params: {
            access_token: this.accessToken
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro ao responder pergunta:', error.response.data);
      throw error;
    }
  }
}

// Uso
const ml = new MercadoLivreAPI(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'https://seu-app.com/callback'
);

// 1. Redirecionar usuário para autorização
console.log('URL de autorização:', ml.getAuthURL());

// 2. Após callback, trocar código por token
// await ml.getAccessToken(code);

// 3. Listar produtos
// const items = await ml.listItems(userId);

// 4. Listar pedidos
// const orders = await ml.listOrders(userId);
```

---

## 7. Boas Práticas

1. **Armazene tokens com segurança** - Use variáveis de ambiente ou banco de dados criptografado
2. **Implemente refresh automático** - Renove o token antes de expirar (5h30min após criação)
3. **Trate rate limits** - Implemente retry com backoff exponencial
4. **Use webhooks** - Evite polling constante, use notificações em tempo real
5. **Cache de categorias** - Categorias mudam raramente, faça cache local
6. **Valide dados antes de enviar** - Use os atributos obrigatórios da categoria
7. **Monitore erros** - Log todos os erros da API para debugging

---

## 8. Links Úteis

- **Portal de Desenvolvedores:** https://developers.mercadolivre.com.br/
- **Documentação Oficial:** https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br
- **Fórum de Desenvolvedores:** https://developers.mercadolivre.com.br/pt_br/forum
- **Status da API:** https://status.mercadolibre.com/

---

## 9. Próximos Passos

- [ ] Pesquisar Amazon SP-API
- [ ] Pesquisar Shopee Open Platform
- [ ] Criar comparativo entre as 3 APIs
- [ ] Implementar sincronização automática
