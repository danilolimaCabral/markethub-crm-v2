# 🔐 Sistema de Credenciais por Cliente

**Data:** 12/12/2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e Funcional

---

## 📋 Visão Geral

O sistema permite que o **admin master cadastre credenciais OAuth específicas** para cada cliente em cada marketplace. Quando o cliente conecta sua conta, o sistema usa automaticamente as credenciais cadastradas pelo admin.

### **Fluxo Completo:**

```
1. Admin Master → Cadastra credenciais do cliente no painel
2. Cliente → Clica em "Conectar Mercado Livre"
3. Sistema → Busca credenciais específicas do cliente
4. Sistema → Usa credenciais do cliente no OAuth
5. Cliente → Autoriza aplicativo
6. Sistema → Salva tokens vinculados ao cliente
```

---

## 🎯 Benefícios

### **Para o Admin:**
- ✅ Gerencia credenciais de TODOS os clientes em um só lugar
- ✅ Cadastra credenciais antes do cliente usar
- ✅ Suporta múltiplos marketplaces
- ✅ Credenciais criptografadas com segurança

### **Para o Cliente:**
- ✅ Não precisa configurar nada técnico
- ✅ Apenas clica em "Conectar" e autoriza
- ✅ Usa suas próprias credenciais OAuth
- ✅ Dados isolados de outros clientes

---

## 🗄️ Estrutura do Banco

### **Tabela: `marketplace_credentials`**

```sql
CREATE TABLE marketplace_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,              -- Cliente dono das credenciais
  tenant_id INTEGER NOT NULL,
  marketplace VARCHAR(50) NOT NULL,       -- 'mercado_livre', 'amazon', etc
  
  client_id VARCHAR(255) NOT NULL,        -- Client ID do OAuth
  client_secret TEXT NOT NULL,            -- Client Secret CRIPTOGRAFADO
  
  config JSONB DEFAULT '{}',              -- redirect_uri, scopes, etc
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER,                     -- Admin que cadastrou
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, marketplace)            -- Um cliente = uma credencial por marketplace
);
```

### **Criptografia:**
- Client Secret é criptografado com **AES-256-CBC**
- Chave de criptografia: `ENCRYPTION_KEY` do .env
- Formato: `IV:ENCRYPTED_DATA`

---

## 🔌 API Endpoints

### **Admin Endpoints**

#### **GET /api/admin/marketplace-credentials**
Lista todas as credenciais cadastradas.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "credentials": [
    {
      "id": 1,
      "user": {
        "id": 5,
        "username": "joao",
        "email": "joao@loja.com",
        "name": "João Silva"
      },
      "tenant": {
        "id": 1,
        "name": "Loja ABC"
      },
      "marketplace": "mercado_livre",
      "client_id": "6702284202610735",
      "is_active": true,
      "created_at": "2025-12-12T10:00:00Z",
      "created_by": "superadmin"
    }
  ]
}
```

#### **POST /api/admin/marketplace-credentials**
Cadastra novas credenciais para um cliente.

**Body:**
```json
{
  "user_id": 5,
  "marketplace": "mercado_livre",
  "client_id": "6702284202610735",
  "client_secret": "co8Zb40AZvmMIvnhLk0vfRwuxPCESNac",
  "config": {
    "redirect_uri": "https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credenciais cadastradas com sucesso",
  "credential_id": 1
}
```

#### **PUT /api/admin/marketplace-credentials/:id**
Atualiza credenciais existentes.

#### **DELETE /api/admin/marketplace-credentials/:id**
Remove credenciais.

#### **GET /api/admin/marketplace-credentials/user/:userId**
Lista credenciais de um usuário específico.

---

## 🎨 Interface Admin

### **Componente: MarketplaceCredentialsManager**

**Localização:** `client/src/components/MarketplaceCredentialsManager.tsx`

**Funcionalidades:**
- ✅ Listar todas as credenciais cadastradas
- ✅ Cadastrar novas credenciais via modal
- ✅ Selecionar cliente da lista de usuários
- ✅ Selecionar marketplace (ML, Amazon, Shopee, etc)
- ✅ Input de Client ID e Client Secret
- ✅ Mostrar/ocultar Client Secret
- ✅ Remover credenciais
- ✅ Estatísticas (total, ativas, inativas)
- ✅ Tabela com informações completas

**Acesso:** Apenas superadmin e admin

---

## 🔄 Fluxo OAuth Modificado

### **Antes (Credenciais Globais):**

```
Cliente → Conectar ML
       → Sistema usa ML_CLIENT_ID global
       → Todos os clientes usam mesma credencial
```

### **Depois (Credenciais por Cliente):**

```
Cliente → Conectar ML
       → Sistema busca credenciais do cliente no banco
       → Se encontrar: usa credenciais específicas
       → Se não encontrar: usa credenciais globais (fallback)
       → OAuth com credenciais corretas
```

### **Código:**

```typescript
// Buscar credenciais do cliente
const credentials = await getClientCredentials(user_id, 'mercado_livre');

// Gerar URL de autorização com credenciais do cliente
const authUrl = MercadoLivreOAuthService.getAuthorizationUrl(
  state,
  credentials.client_id,
  credentials.redirect_uri
);

// Trocar código por tokens com credenciais do cliente
const tokenData = await MercadoLivreOAuthService.exchangeCodeForToken(
  code,
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uri
);
```

---

## 📊 Marketplaces Suportados

O sistema está preparado para:

| Marketplace | Status | Configuração |
|-------------|--------|--------------|
| **Mercado Livre** | ✅ Implementado | Client ID + Secret |
| **Amazon** | 🔄 Preparado | Client ID + Secret |
| **Shopee** | 🔄 Preparado | Client ID + Secret |
| **Magazine Luiza** | 🔄 Preparado | Client ID + Secret |
| **Americanas** | 🔄 Preparado | Client ID + Secret |
| **Via Varejo** | 🔄 Preparado | Client ID + Secret |

---

## 🧪 Como Usar

### **Passo 1: Admin Cadastra Credenciais**

1. Login como superadmin
2. Acesse: **Menu → Credenciais de Marketplace** (nova página)
3. Clique em **"Nova Credencial"**
4. Preencha o formulário:
   - **Cliente:** Selecione o usuário
   - **Marketplace:** Mercado Livre
   - **Client ID:** `6702284202610735`
   - **Client Secret:** `co8Zb40AZvmMIvnhLk0vfRwuxPCESNac`
   - **Redirect URI:** (opcional) URL de callback customizada
5. Clique em **"Salvar Credenciais"**

### **Passo 2: Cliente Conecta Conta**

1. Cliente faz login
2. Acessa: **Menu → Mercado Livre**
3. Clica em **"Conectar com Mercado Livre"**
4. É redirecionado para autorização do ML
5. Autoriza o aplicativo
6. Retorna conectado!

### **Passo 3: Verificar Conexão**

1. Admin pode ver no dashboard master
2. Cliente vê sua integração ativa
3. Sincronização de produtos e pedidos funciona

---

## 🔒 Segurança

### **Criptografia:**
```typescript
// Criptografar ao salvar
const encrypted = encryptSecret(client_secret);
// Formato: "IV_HEX:ENCRYPTED_HEX"

// Descriptografar ao usar
const decrypted = decryptSecret(encrypted);
```

### **Permissões:**
- ✅ Apenas admin pode cadastrar/editar/remover credenciais
- ✅ Cliente NÃO vê as credenciais
- ✅ API NÃO retorna client_secret nas listagens
- ✅ Endpoint `/decrypt/:id` apenas para admin (uso interno)

### **Validações:**
- ✅ user_id obrigatório
- ✅ marketplace obrigatório
- ✅ client_id obrigatório
- ✅ client_secret obrigatório
- ✅ UNIQUE constraint (user_id + marketplace)

---

## 🚀 Deploy e Configuração

### **Variáveis de Ambiente:**

```env
# Chave de criptografia (32 caracteres)
ENCRYPTION_KEY=A)2UGo90I5<W!cS3-jjH=7wPeFSe{N7t

# Credenciais globais (fallback)
ML_CLIENT_ID=6702284202610735
ML_CLIENT_SECRET=co8Zb40AZvmMIvnhLk0vfRwuxPCESNac
ML_REDIRECT_URI=https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback
```

### **Migration:**

```bash
# Executar migration para criar tabela
psql $DATABASE_URL < db/migrations/002_marketplace_credentials.sql
```

Ou o sistema executa automaticamente no startup.

---

## 📈 Casos de Uso

### **Caso 1: Admin Cadastra Antes**

```
1. Admin cadastra credenciais do João
2. João faz login
3. João clica em "Conectar ML"
4. Sistema usa credenciais cadastradas pelo admin
5. João autoriza
6. Conectado! ✅
```

### **Caso 2: Cliente Sem Credenciais**

```
1. Maria não tem credenciais cadastradas
2. Maria clica em "Conectar ML"
3. Sistema usa credenciais globais (fallback)
4. Maria autoriza
5. Conectado com credenciais globais ✅
```

### **Caso 3: Admin Atualiza Credenciais**

```
1. Admin edita credenciais do João
2. João desconecta e reconecta
3. Sistema usa novas credenciais
4. Conectado com credenciais atualizadas ✅
```

---

## 🔮 Próximos Passos

### **Melhorias Futuras:**

1. **Interface no Dashboard Cliente**
   - Cliente vê se tem credenciais cadastradas
   - Indicador visual "Configurado pelo admin"

2. **Notificações**
   - Alertar admin quando credenciais expirarem
   - Notificar cliente para reconectar

3. **Logs de Auditoria**
   - Registrar quem cadastrou/editou credenciais
   - Histórico de mudanças

4. **Validação de Credenciais**
   - Testar credenciais antes de salvar
   - Verificar se Client ID/Secret são válidos

5. **Múltiplas Credenciais**
   - Permitir cliente ter várias contas ML
   - Seletor de conta ativa

---

## 📚 Arquivos Criados

### **Backend:**
- `db/migrations/002_marketplace_credentials.sql` - Migration
- `server/routes/marketplace-credentials.ts` - Rotas CRUD
- `server/utils/getClientCredentials.ts` - Helper de busca
- Modificado: `server/services/MercadoLivreOAuthService.ts`
- Modificado: `server/routes/mercadolivre.ts`

### **Frontend:**
- `client/src/components/MarketplaceCredentialsManager.tsx` - Componente
- `client/src/pages/MarketplaceCredentials.tsx` - Página

### **Documentação:**
- `SISTEMA_CREDENCIAIS_CLIENTES.md` - Este documento

---

## ✅ Checklist de Implementação

- [x] Estrutura do banco de dados
- [x] Migration
- [x] Rotas CRUD backend
- [x] Criptografia de credenciais
- [x] Helper getClientCredentials
- [x] Modificar serviço OAuth
- [x] Modificar rotas de integração
- [x] Componente MarketplaceCredentialsManager
- [x] Página de gerenciamento
- [x] Suporte a múltiplos marketplaces
- [x] Fallback para credenciais globais
- [x] Documentação completa
- [x] Deploy em produção

---

## 🎉 Status Final

**✅ Sistema 100% Funcional!**

O admin master agora pode cadastrar credenciais OAuth específicas para cada cliente em cada marketplace. O sistema usa automaticamente as credenciais corretas durante o fluxo de autorização.

**Pronto para uso em produção!** 🚀
