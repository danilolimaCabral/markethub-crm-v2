# 🔍 Status da Conexão Mercado Livre

**Data:** 12/12/2025  
**Hora:** 14:52 GMT-3

---

## 🎯 Objetivo

Conectar o sistema com o Mercado Livre usando as credenciais:
- **Client ID:** 6702284202610735
- **Client Secret:** co8Zb40AZvmMIvnhLk0vfRwuxPCESNac

---

## ✅ O Que Está Funcionando

1. ✅ Sistema online e acessível
2. ✅ Página de integração ML carrega
3. ✅ Abas "Configuração" e "Monitoramento API" aparecem
4. ✅ Botão "Conectar com Mercado Livre" visível
5. ✅ Usuário logado como superadmin

---

## ❌ Problema Encontrado

**Erro 403 (Forbidden)** ao clicar em "Conectar com Mercado Livre"

**Console log:**
```
Failed to load resource: the server responded with a status of 403 ()
Erro ao conectar: y
```

---

## 🔍 Possíveis Causas

### **1. Problema de Autenticação**
- Token JWT expirado ou inválido
- Permissões insuficientes do usuário
- Middleware de autenticação bloqueando

### **2. Problema de CORS**
- Frontend e backend em domínios diferentes
- Headers CORS não configurados

### **3. Problema de Rota**
- Endpoint OAuth não existe ou mudou
- Rota não está registrada no servidor

### **4. Problema de Credenciais**
- Client ID/Secret incorretos
- Redirect URI não cadastrado no ML

---

## 🔧 Soluções a Tentar

### **Solução 1: Verificar Logs do Backend**

Acessar logs do Railway para ver erro detalhado:
```
Railway Dashboard → Deployments → View Logs
```

### **Solução 2: Testar Endpoint Diretamente**

```bash
# Obter URL de autorização
curl https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/url \
  -H "Authorization: Bearer {TOKEN}"
```

### **Solução 3: Verificar Rota no Código**

Verificar se a rota existe em:
- `server/routes/mercadolivre.ts`
- `server/index.ts`

### **Solução 4: Usar Credenciais Globais**

Como as credenciais já estão em `ML_CLIENT_ID` e `ML_CLIENT_SECRET` nas variáveis de ambiente, o sistema deveria usar essas.

---

## 📝 Próximos Passos

1. **Verificar logs do Railway** para ver erro exato
2. **Testar endpoint via curl** para isolar problema
3. **Verificar se rota OAuth está registrada**
4. **Confirmar que credenciais ML estão corretas no Railway**

---

## 🎯 Alternativa: Conexão Manual

Se o botão não funcionar, podemos:

1. Construir URL OAuth manualmente:
```
https://auth.mercadolivre.com.br/authorization?
  response_type=code&
  client_id=6702284202610735&
  redirect_uri=https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback
```

2. Acessar URL no navegador
3. Autorizar aplicativo
4. Capturar código de retorno
5. Trocar código por token via API

---

**Status:** Investigando erro 403  
**Ação necessária:** Verificar logs do backend
