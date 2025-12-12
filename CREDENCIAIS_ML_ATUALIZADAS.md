# 🔑 Credenciais Mercado Livre - Atualizadas

**Data:** 12/12/2025  
**Aplicativo:** Markethub CRM (MKT02)

---

## 📋 Informações do Aplicativo

### **Configuração no Mercado Livre:**

| Campo | Valor |
|-------|-------|
| **Nome** | Markethub CRM |
| **Nome Curto** | MKT02 |
| **Descrição** | Integração com o sistema de gestão Markethub CRM |
| **ID do Aplicativo** | 6702284202610735 |
| **Chave Secreta** | co8Zb40AZvmMIvnhLk0vfRwuxPCESNac |

---

## 🔐 Credenciais para Railway

### **Variáveis de Ambiente:**

```env
ML_CLIENT_ID=6702284202610735
ML_CLIENT_SECRET=co8Zb40AZvmMIvnhLk0vfRwuxPCESNac
ML_REDIRECT_URI=https://markethub-crm-v2-production.up.railway.app/api/integrations/mercadolivre/auth/callback
```

---

## 🔄 URLs de Callback Configuradas

**IMPORTANTE:** Certifique-se de que estas URLs estão cadastradas no painel do Mercado Livre:

1. `https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback`
2. `https://markethub-crm-v2-production.up.railway.app/api/integrations/mercadolivre/auth/callback`
3. `http://localhost:5000/api/integrations/mercadolivre/auth/callback` (desenvolvimento)

---

## ✅ Como Atualizar no Railway

### **Passo 1: Acessar Railway**

1. Acesse: https://railway.app/
2. Faça login
3. Selecione o projeto: **markethub-crm-v2**

### **Passo 2: Atualizar Variáveis**

1. Clique no serviço (backend)
2. Vá na aba **"Variables"**
3. Encontre e edite:
   - `ML_CLIENT_ID` → `6702284202610735`
   - `ML_CLIENT_SECRET` → `co8Zb40AZvmMIvnhLk0vfRwuxPCESNac`

### **Passo 3: Redeploy**

1. Após salvar as variáveis, o Railway fará redeploy automático
2. Aguarde 2-3 minutos
3. Teste a conexão no dashboard

---

## 🧪 Como Testar

### **Teste 1: Verificar Configuração**

1. Acesse: https://www.markthubcrm.com.br
2. Login: `superadmin` / `SuperAdmin@2024!`
3. Menu → **Mercado Livre**

### **Teste 2: Conectar Conta**

1. Se for cliente: Clique em **"Conectar com Mercado Livre"**
2. Autorize o aplicativo MKT02
3. Verifique se retorna com sucesso

### **Teste 3: Dashboard Admin**

1. Como superadmin, veja o dashboard master
2. Verifique se as integrações aparecem
3. Confirme estatísticas

---

## 🔒 Segurança

**ATENÇÃO:**
- ⚠️ **NÃO compartilhe** a chave secreta publicamente
- ⚠️ **NÃO faça commit** deste arquivo no Git
- ✅ Mantenha as credenciais apenas no Railway
- ✅ Use variáveis de ambiente

---

## 📞 Suporte

Se tiver problemas:

1. **Erro "Invalid client_id"**
   - Verifique se o Client ID está correto no Railway
   - Confirme que o aplicativo está ativo no ML

2. **Erro "Invalid redirect_uri"**
   - Verifique se as 3 URLs de callback estão cadastradas
   - Confirme que não há espaços ou caracteres extras

3. **Erro "Unauthorized"**
   - Verifique se a chave secreta está correta
   - Tente gerar novas credenciais no painel do ML

---

## 📝 Histórico de Credenciais

### **Versão Anterior (Descontinuada):**
```
Client ID: 7719573488458
Client Secret: mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD
```

### **Versão Atual (Ativa):**
```
Client ID: 6702284202610735
Client Secret: co8Zb40AZvmMIvnhLk0vfRwuxPCESNac
```

---

**Status:** ✅ Credenciais atualizadas e documentadas
