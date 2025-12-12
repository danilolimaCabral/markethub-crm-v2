# 🚀 Guia de Configuração das Variáveis de Ambiente no Railway

**Data:** 12 de Dezembro de 2025  
**Projeto:** Markethub CRM V2  
**URL:** https://markethub-crm-v2-production.up.railway.app

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Passo a Passo](#passo-a-passo)
3. [Variáveis Obrigatórias](#variáveis-obrigatórias)
4. [Variáveis Opcionais](#variáveis-opcionais)
5. [Verificação e Testes](#verificação-e-testes)
6. [Solução de Problemas](#solução-de-problemas)

---

## 🎯 Visão Geral

Este guia contém todas as instruções para configurar as variáveis de ambiente do **Markethub CRM V2** no Railway. As chaves JWT foram geradas automaticamente com alta segurança (64 caracteres).

### ✅ O que já está pronto:
- ✅ Projeto deployado no Railway
- ✅ Banco de dados PostgreSQL configurado
- ✅ Chaves JWT geradas com segurança máxima
- ✅ Credenciais do Mercado Livre obtidas
- ✅ Dockerfile e configurações de build

### 🔧 O que precisa ser feito:
- ⚠️ Adicionar variáveis de ambiente no Railway Dashboard
- ⚠️ Aguardar redeploy automático
- ⚠️ Testar endpoints e integrações

---

## 📝 Passo a Passo

### **Passo 1: Acessar o Projeto no Railway**

1. Acesse: https://railway.app/project/1e0fbe42-f6f5-4e92-a3f7-b2f1f5c7f3d5
2. Faça login se necessário
3. Você verá o projeto **markethub-crm-v2** com dois serviços:
   - `markethub-crm-v2` (aplicação)
   - `Postgres` (banco de dados)

### **Passo 2: Abrir Configurações de Variáveis**

1. Clique no serviço **markethub-crm-v2** (não no Postgres)
2. Clique na aba **"Variables"** no menu superior
3. Você verá a lista de variáveis existentes (se houver)

### **Passo 3: Adicionar Variáveis (Método 1 - Individual)**

Para cada variável abaixo, clique em **"New Variable"** e adicione:

#### **NODE_ENV**
```
production
```

#### **PORT**
```
5000
```

#### **DATABASE_URL**
```
postgresql://postgres:mYTbmqwLdcYxPOvfMgzPjXQWZYWxfNfk@mainline.proxy.rlwy.net:27779/railway
```

#### **JWT_SECRET**
```
8cFyy.c<^nk[<R[k6d0CG-r|?RrRhtL*nfUs(=uDt3ulwQZCF{;k{r}JCZwF=hL[
```

#### **JWT_REFRESH_SECRET**
```
1;R?-8oF?eM6Ri[p=Vd7yYhAajP#|&Rc(v9iE#5fXIVM.G*rzqoGjibb-M]6w{2S
```

#### **JWT_EXPIRES_IN**
```
7d
```

#### **JWT_REFRESH_EXPIRES_IN**
```
30d
```

#### **ENCRYPTION_KEY**
```
A)2UGo90I5<W!cS3-jjH=7wPeFSe{N7t
```

#### **ML_CLIENT_ID**
```
7719573488458
```

#### **ML_CLIENT_SECRET**
```
mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD
```

#### **ML_REDIRECT_URI**
```
https://markethub-crm-v2-production.up.railway.app/api/mercadolivre/callback
```

#### **CORS_ORIGIN**
```
https://markethub-crm-v2-production.up.railway.app
```

#### **EMAIL_FROM**
```
noreply@markethub.com
```

### **Passo 3 (Alternativo): Adicionar Variáveis em Bulk**

Se o Railway permitir adicionar múltiplas variáveis de uma vez:

1. Procure por opção "Raw Editor" ou "Bulk Edit"
2. Cole todo o conteúdo abaixo:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:mYTbmqwLdcYxPOvfMgzPjXQWZYWxfNfk@mainline.proxy.rlwy.net:27779/railway
JWT_SECRET=8cFyy.c<^nk[<R[k6d0CG-r|?RrRhtL*nfUs(=uDt3ulwQZCF{;k{r}JCZwF=hL[
JWT_REFRESH_SECRET=1;R?-8oF?eM6Ri[p=Vd7yYhAajP#|&Rc(v9iE#5fXIVM.G*rzqoGjibb-M]6w{2S
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ENCRYPTION_KEY=A)2UGo90I5<W!cS3-jjH=7wPeFSe{N7t
ML_CLIENT_ID=7719573488458
ML_CLIENT_SECRET=mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD
ML_REDIRECT_URI=https://markethub-crm-v2-production.up.railway.app/api/mercadolivre/callback
CORS_ORIGIN=https://markethub-crm-v2-production.up.railway.app
EMAIL_FROM=noreply@markethub.com
```

3. Salve as alterações

### **Passo 4: Aguardar Redeploy**

1. Após salvar as variáveis, o Railway iniciará um **redeploy automático**
2. Você verá o status na aba "Deployments"
3. Aguarde 2-5 minutos até o deploy completar
4. O status deve mudar para **"Success"** com indicador verde ✅

---

## 🔐 Variáveis Obrigatórias

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Ambiente de execução |
| `PORT` | `5000` | Porta do servidor |
| `DATABASE_URL` | `postgresql://postgres:...` | Conexão PostgreSQL Railway |
| `JWT_SECRET` | `8cFyy.c<^nk...` | Chave para tokens JWT (64 chars) |
| `JWT_REFRESH_SECRET` | `1;R?-8oF?e...` | Chave para refresh tokens (64 chars) |
| `JWT_EXPIRES_IN` | `7d` | Tempo de expiração do token |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Tempo de expiração do refresh token |
| `ENCRYPTION_KEY` | `A)2UGo90I5...` | Chave de criptografia (32 chars) |
| `ML_CLIENT_ID` | `7719573488458` | Client ID do Mercado Livre |
| `ML_CLIENT_SECRET` | `mxaqy7Emv46...` | Secret do Mercado Livre |
| `ML_REDIRECT_URI` | `https://markethub...` | URI de callback do ML |
| `CORS_ORIGIN` | `https://markethub...` | Origem permitida para CORS |
| `EMAIL_FROM` | `noreply@markethub.com` | Email remetente padrão |

---

## 🔧 Variáveis Opcionais

Estas variáveis podem ser configuradas posteriormente conforme necessário:

### **Redis (Cache)**
```env
REDIS_URL=redis://...
```

### **Stripe (Pagamentos)**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **Sentry (Monitoramento de Erros)**
```env
SENTRY_DSN=https://...@sentry.io/...
```

### **SMTP (Envio de Emails)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

---

## ✅ Verificação e Testes

### **1. Verificar Health Check**

Após o deploy completar, teste:

```bash
curl https://markethub-crm-v2-production.up.railway.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T...",
  "uptime": 123,
  "database": "connected"
}
```

### **2. Acessar Dashboard de Status**

Abra no navegador:
```
https://markethub-crm-v2-production.up.railway.app/system-status
```

**Você deve ver:**
- ✅ **Server Status**: Online (verde)
- ✅ **Database Connection**: Connected (verde)
- ✅ **Mercado Livre Integration**: Configured (amarelo/verde)

### **3. Testar Endpoint de Sistema**

```bash
curl https://markethub-crm-v2-production.up.railway.app/api/system/status
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-12T...",
  "uptime": 123,
  "database": {
    "status": "connected",
    "responseTime": "44ms"
  },
  "integrations": {
    "mercadolivre": {
      "status": "configured",
      "configured": true
    }
  }
}
```

### **4. Verificar Logs**

No Railway Dashboard:
1. Vá na aba **"Deployments"**
2. Clique no deployment mais recente
3. Vá em **"View Logs"**
4. Procure por mensagens de erro (linhas em vermelho)

**Logs esperados (sucesso):**
```
✓ Database connected successfully
✓ Server listening on port 5000
✓ Environment: production
✓ CORS enabled for: https://markethub-crm-v2-production.up.railway.app
```

---

## 🔍 Solução de Problemas

### **Problema: Deploy falhou**

**Causa:** Variável mal formatada ou faltando

**Solução:**
1. Verifique se todas as 13 variáveis obrigatórias foram adicionadas
2. Verifique se não há espaços extras antes/depois dos valores
3. Verifique se o `DATABASE_URL` está correto
4. Faça redeploy manual: Deployments → ... → Redeploy

### **Problema: Database connection error**

**Causa:** `DATABASE_URL` incorreto

**Solução:**
1. Verifique se o valor é exatamente:
   ```
   postgresql://postgres:mYTbmqwLdcYxPOvfMgzPjXQWZYWxfNfk@mainline.proxy.rlwy.net:27779/railway
   ```
2. Certifique-se que o serviço Postgres está rodando
3. Verifique na aba "Variables" do serviço Postgres se a senha está correta

### **Problema: JWT errors / Authentication failed**

**Causa:** `JWT_SECRET` ou `JWT_REFRESH_SECRET` incorretos

**Solução:**
1. Verifique se copiou as chaves completas (64 caracteres)
2. Não deve haver quebras de linha no meio das chaves
3. Copie novamente do arquivo `RAILWAY_JWT_KEYS.txt`

### **Problema: CORS error no frontend**

**Causa:** `CORS_ORIGIN` incorreto

**Solução:**
1. Verifique se o valor é exatamente a URL do Railway:
   ```
   https://markethub-crm-v2-production.up.railway.app
   ```
2. Sem barra `/` no final
3. Deve ser HTTPS, não HTTP

### **Problema: Mercado Livre callback error**

**Causa:** `ML_REDIRECT_URI` não corresponde ao configurado no ML

**Solução:**
1. Acesse o painel de desenvolvedores do Mercado Livre
2. Verifique se a Redirect URI cadastrada é:
   ```
   https://markethub-crm-v2-production.up.railway.app/api/mercadolivre/callback
   ```
3. Deve ser exatamente igual (case-sensitive)

---

## 📊 Checklist Final

Antes de considerar a configuração completa, verifique:

- [ ] Todas as 13 variáveis obrigatórias foram adicionadas
- [ ] Deploy completou com sucesso (status verde)
- [ ] Health check retorna `{"status": "ok"}`
- [ ] Dashboard de status mostra indicadores verdes
- [ ] Logs não mostram erros críticos
- [ ] Banco de dados está conectado (response time < 100ms)
- [ ] Mercado Livre está configurado
- [ ] CORS está funcionando (sem erros no console do navegador)

---

## 🎉 Próximos Passos

Após configurar tudo com sucesso:

1. **Testar autenticação:**
   - Criar usuário admin
   - Fazer login
   - Verificar tokens JWT

2. **Configurar Mercado Livre:**
   - Autorizar aplicação
   - Testar sincronização de produtos
   - Verificar webhooks

3. **Configurar integrações opcionais:**
   - Redis para cache
   - Stripe para pagamentos
   - Sentry para monitoramento
   - SMTP para emails

4. **Documentação adicional:**
   - Ler `GUIA_COMERCIALIZACAO.md`
   - Ler `RAILWAY_SETUP.md`
   - Ler documentação da API

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no Railway Dashboard
2. Teste os endpoints de health check
3. Consulte a documentação do Railway: https://docs.railway.app
4. Verifique o status do banco de dados

---

## 🔒 Segurança

**⚠️ IMPORTANTE:**

- ✅ **NUNCA** compartilhe as chaves JWT com ninguém
- ✅ **NUNCA** faça commit dos arquivos `.env*` no Git
- ✅ **SEMPRE** use HTTPS em produção
- ✅ Guarde as chaves em local seguro (gerenciador de senhas)
- ✅ Faça backup das chaves em local offline
- ✅ Rotacione as chaves periodicamente (a cada 6 meses)

**Arquivos com informações sensíveis:**
- `RAILWAY_JWT_KEYS.txt` - Chaves JWT originais
- `RAILWAY_ENV_VARIABLES.txt` - Todas as variáveis formatadas
- `.env.railway` - Arquivo .env completo

---

**Última atualização:** 12 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
