# Pesquisa: API do Mercado Livre

## 📚 Documentação Oficial

**URL Principal:** https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br

A API do Mercado Livre é uma API REST que permite integração completa com a plataforma de e-commerce.

---

## 🔐 Autenticação OAuth2

### Fluxo Server-Side (Recomendado)

O Mercado Livre utiliza **OAuth 2.0** com o fluxo **Authorization Code Grant Type**.

### Passo 1: Criar Aplicação

1. Acesse: https://developers.mercadolivre.com.br/
2. Faça login com sua conta Mercado Livre
3. Crie uma nova aplicação
4. Obtenha:
   - **Client ID** (APP_ID)
   - **Client Secret**
   - Configure **Redirect URI** (deve ser exata)

### Passo 2: Solicitar Autorização

**URL de Autorização:**

```
https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=$APP_ID&redirect_uri=$YOUR_URL&code_challenge=$CODE_CHALLENGE&code_challenge_method=$CODE_METHOD&state=$RANDOM_ID
```

**Parâmetros:**

- `response_type`: "code"
- `client_id`: ID da sua aplicação
- `redirect_uri`: URL de callback (deve ser exata)
- `state`: Identificador único para segurança (recomendado)
- `code_challenge`: Código PKCE (opcional, mas recomendado)
- `code_challenge_method`: "S256" ou "plain"

**Exemplo:**

```
https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=1620218256833906&redirect_uri=https://localhost.com/redirect&state=ABC1234
```

### Passo 3: Receber o Code

Após autorização, o usuário é redirecionado para:

```
https://YOUR_REDIRECT_URI?code=$SERVER_GENERATED_AUTHORIZATION_CODE&state=$RANDOM_ID
```

**Exemplo:**

```
https://localhost.com/redirect?code=TG-61828b7fffcc9a001b4bc890-314029626&state=ABC1234
```

### Passo 4: Trocar Code por Access Token

**Endpoint:** `POST https://api.mercadolibre.com/oauth/token`

**Body (x-www-form-urlencoded):**

```
grant_type=authorization_code
&client_id=$APP_ID
&client_secret=$CLIENT_SECRET
&code=$CODE
&redirect_uri=$REDIRECT_URI
&code_verifier=$CODE_VERIFIER
```

**Resposta:**

```json
{
  "access_token": "APP_USR-12345678-031820-X-12345678",
  "token_type": "Bearer",
  "expires_in": 21600,
  "scope": "offline_access read write",
  "user_id": 12345678,
  "refresh_token": "TG-12345678-12345678-12345678"
}
```

### Passo 5: Usar Access Token

**Header de Autorização:**

```
Authorization: Bearer APP_USR-12345678-031820-X-12345678
```

**Exemplo de Requisição:**

```bash
curl -H 'Authorization: Bearer APP_USR-12345678-031820-X-12345678' \
https://api.mercadolibre.com/users/me
```

### Passo 6: Refresh Token

Quando o access token expirar (6 horas), use o refresh token:

**Endpoint:** `POST https://api.mercadolibre.com/oauth/token`

**Body:**

```
grant_type=refresh_token
&client_id=$APP_ID
&client_secret=$CLIENT_SECRET
&refresh_token=$REFRESH_TOKEN
```

---

## 📦 Principais Endpoints da API

### Usuários

- **GET /users/me** - Dados do usuário autenticado
- **GET /users/{user_id}** - Dados de um usuário específico

### Produtos/Itens

- **GET /items/{item_id}** - Detalhes de um produto
- **POST /items** - Criar novo produto
- **PUT /items/{item_id}** - Atualizar produto
- **GET /users/{user_id}/items/search** - Listar produtos do vendedor

### Pedidos

- **GET /orders/{order_id}** - Detalhes de um pedido
- **GET /orders/search** - Buscar pedidos
- **GET /orders/search/recent** - Pedidos recentes

### Categorias

- **GET /sites/MLB/categories** - Listar categorias (MLB = Brasil)
- **GET /categories/{category_id}** - Detalhes de categoria

### Perguntas

- **GET /questions/search** - Buscar perguntas
- **POST /answers** - Responder pergunta

### Envios

- **GET /shipments/{shipment_id}** - Detalhes de envio
- **GET /orders/{order_id}/shipments** - Envios de um pedido

---

## 🔒 Segurança e Boas Práticas

### PKCE (Proof Key for Code Exchange)

**Recomendado para maior segurança:**

1. Gerar `code_verifier` aleatório (43-128 caracteres)
2. Criar `code_challenge` = SHA256(code_verifier)
3. Enviar `code_challenge` na autorização
4. Enviar `code_verifier` ao trocar code por token

### Invalidação de Tokens

Um access token pode ser invalidado antes de expirar por:

- Alteração de senha pelo usuário
- Atualização do Client Secret
- Revogação de permissões pelo usuário
- Inatividade de 4 meses sem chamadas à API

### Permissões Funcionais

O usuário que autorizar deve ser **administrador** da conta. Operadores/colaboradores não podem autorizar aplicações.

---

## ⚠️ Limites e Restrições

### Rate Limits

- **Limite padrão:** Não especificado na documentação pública
- **Recomendação:** Implementar retry com backoff exponencial
- **Monitorar headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Erros Comuns

**Invalid Grant:**
- Code já foi usado
- Code expirou (10 minutos)
- Redirect URI não corresponde

**Invalid Operator User ID:**
- Usuário é operador/colaborador, não administrador

**Redirect URI Mismatch:**
- URL de callback não corresponde exatamente à configurada

---

## 🌎 Sites por País

- **Brasil:** MLB - mercadolivre.com.br
- **Argentina:** MLA - mercadolibre.com.ar
- **México:** MLM - mercadolibre.com.mx
- **Colômbia:** MCO - mercadolibre.com.co
- **Chile:** MLC - mercadolibre.cl
- **Uruguai:** MLU - mercadolibre.com.uy

---

## 📖 Recursos Adicionais

### Documentação por Unidade de Negócio

1. **Mercado Livre** (17 módulos) - Produtos, pedidos, vendas
2. **Mercado Shops** (20 módulos) - Lojas virtuais
3. **Mercado Envios** (23 módulos) - Logística e envios
4. **Mercado Pago** - Pagamentos e transações

### Guias Principais

- **Guia para Produtos:** Publicação, categorização, variações
- **Gestão de Aplicações:** Criação e configuração
- **Recursos Cross:** Recursos compartilhados entre unidades
- **Segurança:** Medidas de segurança e boas práticas

---

## 🔧 Exemplo de Integração Completa

### 1. Criar Aplicação no Mercado Livre

```
https://developers.mercadolivre.com.br/
→ Criar Aplicação
→ Obter Client ID e Client Secret
→ Configurar Redirect URI
```

### 2. Implementar Fluxo OAuth2

```javascript
// 1. Redirecionar usuário para autorização
const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;

// 2. Receber code no callback
// GET /callback?code=TG-xxx&state=xxx

// 3. Trocar code por token
const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    redirect_uri: redirectUri
  })
});

const { access_token, refresh_token } = await tokenResponse.json();

// 4. Usar access token
const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

### 3. Consultar Pedidos

```javascript
const ordersResponse = await fetch('https://api.mercadolibre.com/orders/search/recent', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

const orders = await ordersResponse.json();
```

### 4. Renovar Token

```javascript
const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refresh_token
  })
});

const { access_token: newAccessToken } = await refreshResponse.json();
```

---

## 📝 Notas Importantes

1. **Ambiente de Testes:** Use usuários de teste para desenvolvimento
2. **Expiração:** Access token expira em 6 horas (21600 segundos)
3. **Refresh Token:** Não expira, mas pode ser invalidado
4. **Redirect URI:** Deve ser **exatamente** igual à configurada
5. **HTTPS:** Obrigatório para Redirect URI em produção
6. **State Parameter:** Recomendado para prevenir CSRF

---

## 🔗 Links Úteis

- **Documentação:** https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br
- **Autenticação:** https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
- **Criar Aplicação:** https://developers.mercadolivre.com.br/pt_br/registre-sua-aplicacao
- **API Reference:** https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br
- **Suporte:** https://developers.mercadolivre.com.br/support

---

**Data da Pesquisa:** 07/11/2025  
**Última Atualização da Documentação:** 11/09/2025
