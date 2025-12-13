# 🚀 Guia Rápido - Conectar Mercado Livre

## ✅ Status Atual

**Credenciais cadastradas no banco de dados:**
- App ID: `6702284202610735`
- Client Secret: `co8Zb40AZvmMIvnhLk0vfRwuxPCESNac`
- Tenant: TRUE IMPORTADOR BR
- Status: ✅ Ativo

---

## 📋 Passo a Passo

### **Passo 1: Configurar Redirect URI**

Acesse o painel de desenvolvedores do Mercado Livre:
👉 https://developers.mercadolivre.com.br/

Adicione esta URL de redirecionamento na sua aplicação:
```
https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback
```

### **Passo 2: Obter URL de Autorização**

Faça uma requisição GET para:
```
GET https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/url
Authorization: Bearer SEU_TOKEN_JWT
```

**Resposta:**
```json
{
  "authUrl": "https://auth.mercadolibre.com.br/authorization?response_type=code&client_id=...",
  "state": "eyJ0ZW5hbnRfaWQiOi...",
  "expiresIn": 600
}
```

### **Passo 3: Autorizar no Mercado Livre**

1. Copie a `authUrl` da resposta
2. Abra em um navegador
3. Faça login no Mercado Livre
4. Clique em "Autorizar"

### **Passo 4: Retorno Automático**

Após autorizar, o Mercado Livre redireciona para:
```
https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback?code=TG-...&state=...
```

O sistema automaticamente:
- ✅ Recebe o código
- ✅ Troca por Access Token
- ✅ Salva no banco de dados
- ✅ Redireciona para `/inteligencia-mercado?success=true`

---

## 🧪 Testar Conexão

Após conectar, teste com:

```bash
# Verificar status da integração
curl -X GET https://www.markthubcrm.com.br/api/integrations/mercadolivre/status \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# Sincronizar pedidos
curl -X POST https://www.markthubcrm.com.br/api/integrations/mercadolivre/sync/orders \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# Sincronizar produtos
curl -X POST https://www.markthubcrm.com.br/api/integrations/mercadolivre/sync/products \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

## 🔧 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/integrations/mercadolivre/auth/url` | Gera URL de autorização |
| GET | `/api/integrations/mercadolivre/auth/callback` | Callback OAuth2 |
| GET | `/api/integrations/mercadolivre/status` | Status da integração |
| POST | `/api/integrations/mercadolivre/sync/orders` | Sincronizar pedidos |
| POST | `/api/integrations/mercadolivre/sync/products` | Sincronizar produtos |
| POST | `/api/integrations/mercadolivre/webhook` | Receber notificações |

---

## 🚨 Solução de Problemas

### ❌ Erro: "Redirect URI inválido"
**Causa:** URL de callback não configurada no ML  
**Solução:** Adicione a URL no painel de desenvolvedores

### ❌ Erro: "Token expirado"
**Causa:** Access Token válido por 6 horas  
**Solução:** Sistema renova automaticamente com Refresh Token

### ❌ Erro: "Credenciais inválidas"
**Causa:** App ID ou Secret incorretos  
**Solução:** Verifique no banco de dados

---

## 📞 Suporte

- Email: contato@markthubcrm.com.br
- Docs: https://developers.mercadolivre.com.br/
