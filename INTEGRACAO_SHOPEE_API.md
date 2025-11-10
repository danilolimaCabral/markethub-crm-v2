# Integração com Shopee Open Platform API

## Visão Geral

A Shopee Open Platform API permite que desenvolvedores integrem seus sistemas com a plataforma Shopee para gerenciar produtos, pedidos, estoque, promoções e chat.

**Documentação Oficial:** https://open.shopee.com/

## Principais Características

- **Autenticação:** OAuth 2.0 com autorização de loja
- **Formato:** REST/JSON
- **Versão Atual:** v2.0
- **Regiões:** Sudeste Asiático, Taiwan, Brasil

## Registro Necessário

1. Criar conta de desenvolvedor em https://open.shopee.com/
2. Registrar aplicação
3. Obter Partner ID e Partner Key
4. Solicitar autorização das lojas (sellers)

## Domínios por Região

| Região | Domínio |
|--------|---------|
| Singapura | https://partner.shopeemobile.com |
| Tailândia | https://partner.uat.shopeemobile.com |
| Brasil | https://partner.shopeemobile.com.br |

## Autenticação

### Fluxo de Autorização

1. **Gerar URL de autorização**
2. **Vendedor autoriza a aplicação**
3. **Receber código de autorização**
4. **Trocar código por access token**
5. **Usar access token nas requisições**

### Gerar Assinatura

Todas as requisições devem incluir uma assinatura HMAC-SHA256:

```
sign = HMAC-SHA256(partner_key, base_string)
base_string = partner_id + path + timestamp
```

## Endpoints Principais

### Produtos (Product API)

- **GET /api/v2/product/get_item_list** - Listar produtos
- **GET /api/v2/product/get_item_base_info** - Detalhes do produto
- **POST /api/v2/product/add_item** - Adicionar produto
- **POST /api/v2/product/update_item** - Atualizar produto
- **POST /api/v2/product/delete_item** - Deletar produto
- **POST /api/v2/product/update_stock** - Atualizar estoque

### Pedidos (Order API)

- **GET /api/v2/order/get_order_list** - Listar pedidos
- **GET /api/v2/order/get_order_detail** - Detalhes do pedido
- **GET /api/v2/order/get_shipment_list** - Lista de envios
- **POST /api/v2/order/ship_order** - Marcar como enviado

### Logística (Logistics API)

- **GET /api/v2/logistics/get_shipping_parameter** - Parâmetros de envio
- **POST /api/v2/logistics/create_shipping_document** - Criar etiqueta
- **GET /api/v2/logistics/get_tracking_number** - Rastreamento

### Loja (Shop API)

- **GET /api/v2/shop/get_shop_info** - Informações da loja
- **GET /api/v2/shop/get_profile** - Perfil da loja

### Marketing (Marketing API)

- **GET /api/v2/discount/get_discount_list** - Listar promoções
- **POST /api/v2/discount/add_discount** - Criar promoção

## Exemplo de Integração (Node.js)

```javascript
const crypto = require('crypto');
const axios = require('axios');

class ShopeeAPI {
  constructor(partnerId, partnerKey, shopId, accessToken) {
    this.partnerId = partnerId;
    this.partnerKey = partnerKey;
    this.shopId = shopId;
    this.accessToken = accessToken;
    this.baseURL = 'https://partner.shopeemobile.com.br';
  }

  // Gerar assinatura
  generateSign(path, timestamp) {
    const baseString = `${this.partnerId}${path}${timestamp}`;
    return crypto
      .createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex');
  }

  // Fazer requisição
  async makeRequest(method, path, params = {}, body = null) {
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSign(path, timestamp);

    const url = `${this.baseURL}${path}`;
    const commonParams = {
      partner_id: parseInt(this.partnerId),
      timestamp: timestamp,
      sign: sign,
      shop_id: parseInt(this.shopId),
      access_token: this.accessToken
    };

    try {
      const response = await axios({
        method: method,
        url: url,
        params: { ...commonParams, ...params },
        data: body,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro Shopee API:', error.response?.data || error.message);
      throw error;
    }
  }

  // Listar produtos
  async listProducts(offset = 0, pageSize = 50) {
    return this.makeRequest('GET', '/api/v2/product/get_item_list', {
      offset: offset,
      page_size: pageSize,
      item_status: 'NORMAL'
    });
  }

  // Obter detalhes do produto
  async getProduct(itemId) {
    return this.makeRequest('GET', '/api/v2/product/get_item_base_info', {
      item_id_list: itemId
    });
  }

  // Listar pedidos
  async listOrders(timeFrom, timeTo) {
    return this.makeRequest('GET', '/api/v2/order/get_order_list', {
      time_range_field: 'create_time',
      time_from: timeFrom,
      time_to: timeTo,
      page_size: 50
    });
  }

  // Obter detalhes do pedido
  async getOrder(orderSn) {
    return this.makeRequest('GET', '/api/v2/order/get_order_detail', {
      order_sn_list: orderSn
    });
  }

  // Atualizar estoque
  async updateStock(itemId, stockList) {
    return this.makeRequest('POST', '/api/v2/product/update_stock', {}, {
      item_id: itemId,
      stock_list: stockList
    });
  }
}

// Uso
const shopee = new ShopeeAPI(
  'YOUR_PARTNER_ID',
  'YOUR_PARTNER_KEY',
  'YOUR_SHOP_ID',
  'YOUR_ACCESS_TOKEN'
);

// Listar produtos
const products = await shopee.listProducts();
console.log('Produtos:', products);

// Listar pedidos dos últimos 7 dias
const now = Math.floor(Date.now() / 1000);
const sevenDaysAgo = now - (7 * 24 * 60 * 60);
const orders = await shopee.listOrders(sevenDaysAgo, now);
console.log('Pedidos:', orders);
```

## Rate Limits

- **Limite padrão:** 1000 requisições por minuto por shop
- **Limite por endpoint:** Varia (consultar documentação)

## Complexidade de Integração

⭐⭐⭐ (3/5 - Média complexidade)

- Autenticação OAuth 2.0 padrão
- Requer assinatura HMAC-SHA256
- Documentação clara e organizada
- Menos complexo que Amazon SP-API

## Links Úteis

- **Documentação:** https://open.shopee.com/developer-guide/4
- **API Reference:** https://open.shopee.com/documents/v2/v2.product.get_category?module=89&type=1
- **Portal de Desenvolvedores:** https://open.shopee.com/

## Próximos Passos

- [ ] Criar comparativo entre ML, Amazon e Shopee
- [ ] Implementar sincronização automática
- [ ] Criar dashboard unificado
