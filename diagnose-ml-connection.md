# 🔍 Diagnóstico: Problema de Conexão com Mercado Livre

## ❌ Problema Identificado

O botão "Conectar com Mercado Livre" não está funcionando devido a **múltiplos problemas**:

### 1. Rate Limiting (429 Too Many Requests)
- O sistema está bloqueando requisições devido aos testes anteriores
- **Solução:** Aguardar 10-15 minutos para o rate limit resetar

### 2. Credenciais do Mercado Livre
O sistema tenta buscar credenciais em duas fontes:

#### Opção A: Credenciais Específicas do Cliente (Tabela `marketplace_credentials`)
```sql
SELECT client_id, client_secret, config
FROM marketplace_credentials
WHERE user_id = $1 AND marketplace = 'mercado_livre' AND is_active = true
```

**Status:** Provavelmente **não existe** registro para o usuário "trueimportador"

#### Opção B: Credenciais Globais do Sistema (Variáveis de Ambiente)
```
ML_CLIENT_ID=...
ML_CLIENT_SECRET=...
ML_REDIRECT_URI=https://www.markthubcrm.com.br/api/integrations/mercadolivre/callback
```

**Status:** Configuradas no Railway ✅

---

## 🔧 Soluções

### Solução 1: Aguardar Rate Limit (Imediato)

**Tempo:** 10-15 minutos

Aguarde o rate limit resetar e tente novamente.

---

### Solução 2: Verificar Credenciais Globais (Railway)

As credenciais globais devem estar configuradas no Railway:

```bash
# Verificar no Railway Dashboard
1. Acesse railway.app
2. Selecione o projeto markethub-crm-v2
3. Vá em "Variables"
4. Confirme que existem:
   - ML_CLIENT_ID
   - ML_CLIENT_SECRET
   - ML_REDIRECT_URI
```

---

### Solução 3: Cadastrar Credenciais Específicas do Cliente

Se você quiser usar credenciais específicas para o cliente "trueimportador":

```sql
-- 1. Buscar ID do usuário
SELECT id, username, email FROM users WHERE username = 'trueimportador';

-- 2. Inserir credenciais (substitua os valores)
INSERT INTO marketplace_credentials (
  user_id,
  marketplace,
  client_id,
  client_secret,
  config,
  is_active,
  created_at,
  updated_at
) VALUES (
  1, -- ID do usuário trueimportador
  'mercado_livre',
  'SEU_CLIENT_ID',
  'SECRET_CRIPTOGRAFADO', -- Precisa ser criptografado!
  '{"redirect_uri": "https://www.markthubcrm.com.br/api/integrations/mercadolivre/callback"}',
  true,
  NOW(),
  NOW()
);
```

**⚠️ Atenção:** O `client_secret` precisa ser criptografado usando AES-256-CBC!

---

## 📊 Fluxo de Conexão OAuth2

```
1. Usuário clica "Conectar com Mercado Livre"
   ↓
2. Frontend chama: GET /api/integrations/mercadolivre/auth/url
   ↓
3. Backend busca credenciais:
   - Tenta buscar credenciais do cliente (tabela marketplace_credentials)
   - Se não encontrar, usa credenciais globais (env vars)
   ↓
4. Backend gera URL de autorização do ML
   ↓
5. Frontend redireciona usuário para ML
   ↓
6. Usuário autoriza no ML
   ↓
7. ML redireciona para: /api/integrations/mercadolivre/callback?code=...
   ↓
8. Backend troca code por access_token
   ↓
9. Backend salva token no banco
   ↓
10. Usuário é redirecionado de volta para o CRM
```

---

## 🐛 Problemas Comuns

### Problema 1: "Erro ao iniciar conexão com Mercado Livre"

**Causas possíveis:**
- ❌ Credenciais não configuradas
- ❌ Credenciais inválidas
- ❌ Rate limit ativo
- ❌ Erro de rede

**Como verificar:**
```bash
# Ver logs do servidor
railway logs | grep "Erro ao gerar URL"
railway logs | grep "credenciais"
```

### Problema 2: Produtos não aparecem

**Causas possíveis:**
- ❌ Não conectado ao ML
- ❌ Token expirado
- ❌ Nenhum produto sincronizado
- ❌ Erro na sincronização

**Como verificar:**
```sql
-- Verificar se está conectado
SELECT * FROM marketplace_integrations 
WHERE marketplace = 'mercado_livre' 
AND is_active = true;

-- Verificar produtos sincronizados
SELECT COUNT(*) FROM products 
WHERE marketplace = 'mercado_livre';

-- Verificar último sync
SELECT * FROM marketplace_sync_log 
WHERE sync_type = 'products' 
ORDER BY started_at DESC 
LIMIT 5;
```

---

## ✅ Checklist de Diagnóstico

- [ ] **Rate limit resetado?** (aguarde 10-15min)
- [ ] **Credenciais globais configuradas no Railway?**
  - [ ] ML_CLIENT_ID existe?
  - [ ] ML_CLIENT_SECRET existe?
  - [ ] ML_REDIRECT_URI existe?
- [ ] **Credenciais do cliente cadastradas?**
  - [ ] Existe registro em `marketplace_credentials`?
  - [ ] Secret está criptografado corretamente?
- [ ] **Integração ativa no banco?**
  - [ ] Existe registro em `marketplace_integrations`?
  - [ ] `is_active = true`?
  - [ ] Token não expirado?
- [ ] **Produtos sincronizados?**
  - [ ] Existem produtos na tabela `products`?
  - [ ] `marketplace = 'mercado_livre'`?

---

## 🔑 Como Obter Credenciais do Mercado Livre

Se você ainda não tem as credenciais:

1. Acesse https://developers.mercadolivre.com.br/
2. Faça login com sua conta do Mercado Livre
3. Clique em "Criar aplicação"
4. Preencha:
   - **Nome:** MarketHub CRM
   - **Descrição:** Sistema de gestão de vendas
   - **Redirect URI:** `https://www.markthubcrm.com.br/api/integrations/mercadolivre/callback`
   - **Tópicos:** Marketplace, Orders, Products
5. Após criar, copie:
   - **App ID** (Client ID)
   - **Secret Key** (Client Secret)
6. Configure no Railway:
   ```
   ML_CLIENT_ID=SEU_APP_ID
   ML_CLIENT_SECRET=SUA_SECRET_KEY
   ML_REDIRECT_URI=https://www.markthubcrm.com.br/api/integrations/mercadolivre/callback
   ```

---

## 🚀 Próximos Passos

### Passo 1: Aguardar Rate Limit (Agora)
Aguarde 10-15 minutos para o rate limit resetar.

### Passo 2: Verificar Credenciais (Railway)
Confirme que as credenciais estão configuradas no Railway.

### Passo 3: Testar Conexão
Tente conectar novamente clicando em "Conectar com Mercado Livre".

### Passo 4: Sincronizar Produtos
Após conectar, clique em "Sincronizar Produtos" para importar o catálogo.

---

## 📞 Comandos Úteis

```bash
# Ver logs em tempo real
railway logs --tail 100

# Ver erros de autenticação
railway logs | grep "auth"

# Ver credenciais sendo usadas
railway logs | grep "credenciais"

# Ver variáveis de ambiente
railway variables

# Testar endpoint (após rate limit)
curl -H "Authorization: Bearer SEU_TOKEN" \
  https://www.markthubcrm.com.br/api/integrations/mercadolivre/status
```

---

## 💡 Recomendação

**Ação imediata:**
1. ✅ Aguarde 10-15 minutos (rate limit)
2. ✅ Verifique credenciais no Railway Dashboard
3. ✅ Tente conectar novamente
4. ✅ Se funcionar, sincronize produtos

**Se continuar com erro:**
- Verifique logs: `railway logs | grep erro`
- Confirme credenciais do ML no DevCenter
- Verifique se redirect_uri está correto

---

**Data:** 15 de dezembro de 2025  
**Status:** 🔍 Diagnóstico Completo
