# 📘 Guia Completo - Integração Mercado Livre

**Sistema:** Markthub CRM V2  
**Data:** 12/12/2025  
**Versão:** 1.0

---

## 🎯 Visão Geral

Este guia documenta a integração completa com a API do Mercado Livre, incluindo:
- ✅ Autenticação OAuth 2.0
- ✅ Sincronização de produtos
- ✅ Sincronização de pedidos
- ✅ Gestão de estoque
- ✅ Atualização de preços
- ✅ Respostas a perguntas

---

## 🔑 Credenciais do Aplicativo

**Nome:** Markthub CRM (MKT02)  
**Client ID:** `6702284202610735`  
**Client Secret:** `co8Zb40AZvmMIvnhLk0vfRwuxPCESNac`  
**Redirect URI:** `https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback`

**Permissões Configuradas:**
- `read` - Leitura de dados
- `write` - Escrita de dados
- `offline_access` - Refresh token
- `read_items` - Ler produtos
- `write_items` - Escrever produtos
- `read_orders` - Ler pedidos
- `write_orders` - Escrever pedidos
- `read_questions` - Ler perguntas
- `write_questions` - Responder perguntas
- `read_messages` - Ler mensagens
- `write_messages` - Enviar mensagens

---

## 🔐 Fluxo OAuth 2.0

### **Passo 1: Redirecionar para Autorização**

```javascript
const authUrl = `https://auth.mercadolivre.com.br/authorization?` +
  `response_type=code&` +
  `client_id=6702284202610735&` +
  `redirect_uri=https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback`;

// Redirecionar usuário
window.location.href = authUrl;
```

### **Passo 2: Receber Código de Autorização**

Após autorização, ML redireciona para:
```
https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback?code=TG-...
```

### **Passo 3: Trocar Código por Tokens**

```javascript
const response = await fetch('https://api.mercadolibre.com/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: '6702284202610735',
    client_secret: 'co8Zb40AZvmMIvnhLk0vfRwuxPCESNac',
    code: code, // Código recebido
    redirect_uri: 'https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback'
  })
});

const tokens = await response.json();
/*
{
  "access_token": "APP_USR-...",
  "token_type": "Bearer",
  "expires_in": 21600,
  "refresh_token": "TG-...",
  "scope": "offline_access read write",
  "user_id": 123456789
}
*/
```

### **Passo 4: Salvar Tokens no Banco**

```sql
INSERT INTO marketplace_integrations (
  user_id,
  tenant_id,
  marketplace,
  access_token,
  refresh_token,
  expires_at,
  ml_user_id,
  scope,
  created_at,
  updated_at
) VALUES (
  $1, $2, 'mercado_livre',
  $3, $4, NOW() + INTERVAL '6 hours',
  $5, $6, NOW(), NOW()
);
```

### **Passo 5: Renovar Token (quando expirar)**

```javascript
const response = await fetch('https://api.mercadolibre.com/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: '6702284202610735',
    client_secret: 'co8Zb40AZvmMIvnhLk0vfRwuxPCESNac',
    refresh_token: refreshToken
  })
});
```

---

## 📦 Sincronização de Produtos

### **1. Buscar Produtos do Cliente ML**

```javascript
const response = await fetch('https://api.mercadolibre.com/users/me/items/search', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();
// { results: ['MLB123', 'MLB456', ...], paging: {...} }
```

### **2. Buscar Detalhes de Cada Produto**

```javascript
const productId = 'MLB123456789';
const response = await fetch(`https://api.mercadolibre.com/items/${productId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const product = await response.json();
/*
{
  "id": "MLB123456789",
  "title": "Produto Exemplo",
  "price": 99.90,
  "available_quantity": 10,
  "sold_quantity": 5,
  "condition": "new",
  "pictures": [...],
  "attributes": [...],
  "variations": [...]
}
*/
```

### **3. Salvar Produto no Sistema**

```sql
INSERT INTO produtos (
  tenant_id,
  user_id,
  ml_item_id,
  titulo,
  preco,
  quantidade,
  vendidos,
  condicao,
  fotos,
  atributos,
  created_at,
  updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
)
ON CONFLICT (ml_item_id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  preco = EXCLUDED.preco,
  quantidade = EXCLUDED.quantidade,
  vendidos = EXCLUDED.vendidos,
  updated_at = NOW();
```

### **4. Criar/Atualizar Produto no ML**

```javascript
// Criar novo produto
const response = await fetch('https://api.mercadolibre.com/items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Produto Novo",
    category_id: "MLB1234",
    price: 99.90,
    currency_id: "BRL",
    available_quantity: 10,
    buying_mode: "buy_it_now",
    listing_type_id: "gold_special",
    condition: "new",
    description: { plain_text: "Descrição do produto" },
    pictures: [
      { source: "https://exemplo.com/foto.jpg" }
    ]
  })
});

// Atualizar produto existente
const response = await fetch(`https://api.mercadolibre.com/items/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    price: 89.90,
    available_quantity: 15
  })
});
```

---

## 🛒 Sincronização de Pedidos

### **1. Buscar Pedidos do Cliente**

```javascript
const response = await fetch('https://api.mercadolibre.com/orders/search?seller=' + userId, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();
// { results: [{order1}, {order2}, ...], paging: {...} }
```

### **2. Buscar Detalhes de um Pedido**

```javascript
const orderId = '123456789';
const response = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const order = await response.json();
/*
{
  "id": 123456789,
  "status": "paid",
  "date_created": "2025-12-12T10:00:00.000Z",
  "total_amount": 99.90,
  "buyer": {...},
  "order_items": [
    {
      "item": {
        "id": "MLB123",
        "title": "Produto",
        "unit_price": 99.90
      },
      "quantity": 1
    }
  ],
  "shipping": {...},
  "payments": [...]
}
*/
```

### **3. Salvar Pedido no Sistema**

```sql
INSERT INTO pedidos (
  tenant_id,
  user_id,
  ml_order_id,
  status,
  data_pedido,
  valor_total,
  comprador_nome,
  comprador_email,
  items,
  envio,
  pagamentos,
  created_at,
  updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
)
ON CONFLICT (ml_order_id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();
```

### **4. Atualizar Status do Pedido**

```javascript
const response = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: "shipped",
    shipping: {
      tracking_number: "BR123456789",
      tracking_method: "correios"
    }
  })
});
```

---

## 📊 Atualização de Estoque

### **Atualizar Quantidade Disponível**

```javascript
const response = await fetch(`https://api.mercadolibre.com/items/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    available_quantity: 25
  })
});
```

---

## 💰 Atualização de Preços

### **Atualizar Preço de um Produto**

```javascript
const response = await fetch(`https://api.mercadolibre.com/items/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    price: 119.90
  })
});
```

---

## ❓ Gestão de Perguntas

### **1. Buscar Perguntas**

```javascript
const response = await fetch(`https://api.mercadolibre.com/questions/search?item=${productId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### **2. Responder Pergunta**

```javascript
const questionId = '123456789';
const response = await fetch(`https://api.mercadolibre.com/answers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question_id: questionId,
    text: "Resposta para a pergunta"
  })
});
```

---

## 📈 Webhooks (Notificações em Tempo Real)

### **Configurar Webhook**

```javascript
const response = await fetch('https://api.mercadolibre.com/applications/6702284202610735', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notifications_callback_url: 'https://www.markthubcrm.com.br/api/webhooks/mercadolivre'
  })
});
```

### **Receber Notificação**

```javascript
app.post('/api/webhooks/mercadolivre', (req, res) => {
  const notification = req.body;
  /*
  {
    "resource": "/orders/123456789",
    "user_id": 123456,
    "topic": "orders_v2",
    "application_id": 6702284202610735,
    "sent": "2025-12-12T10:00:00.000Z"
  }
  */
  
  // Processar notificação
  if (notification.topic === 'orders_v2') {
    // Buscar pedido atualizado
    // Sincronizar com banco
  }
  
  res.sendStatus(200);
});
```

---

## 🔄 Sincronização Automática

### **Script de Sincronização**

```javascript
async function syncMercadoLivre(userId) {
  // 1. Buscar tokens do banco
  const integration = await getIntegration(userId);
  
  // 2. Verificar se token expirou
  if (integration.expires_at < new Date()) {
    await refreshToken(integration);
  }
  
  // 3. Sincronizar produtos
  await syncProducts(integration.access_token, userId);
  
  // 4. Sincronizar pedidos
  await syncOrders(integration.access_token, userId);
  
  // 5. Sincronizar perguntas
  await syncQuestions(integration.access_token, userId);
  
  console.log('✅ Sincronização concluída!');
}

// Executar a cada 15 minutos
setInterval(() => {
  syncAllUsers();
}, 15 * 60 * 1000);
```

---

## 📝 Endpoints Principais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/oauth/token` | POST | Obter/renovar tokens |
| `/users/me` | GET | Dados do usuário |
| `/users/me/items/search` | GET | Listar produtos |
| `/items/{id}` | GET | Detalhes do produto |
| `/items` | POST | Criar produto |
| `/items/{id}` | PUT | Atualizar produto |
| `/orders/search` | GET | Buscar pedidos |
| `/orders/{id}` | GET | Detalhes do pedido |
| `/questions/search` | GET | Buscar perguntas |
| `/answers` | POST | Responder pergunta |
| `/sites/MLB/categories` | GET | Categorias |
| `/currencies` | GET | Moedas |

---

## 🚀 Próximos Passos

1. ✅ Credenciais configuradas
2. ✅ API testada e funcionando
3. ⏳ Implementar sincronização automática
4. ⏳ Configurar webhooks
5. ⏳ Criar interface de gerenciamento
6. ⏳ Adicionar relatórios e analytics

---

**Documentação Oficial:** https://developers.mercadolivre.com.br/  
**Suporte:** https://developers.mercadolivre.com.br/pt_br/forum

---

**Última atualização:** 12/12/2025  
**Versão:** 1.0
