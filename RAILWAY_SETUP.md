# Configuração Railway - Markthub CRM V2

## 🚂 Deploy no Railway em 10 Minutos

Este guia mostra como fazer o deploy do Markthub CRM V2 no Railway de forma rápida e eficiente.

---

## 📋 Pré-requisitos

- Conta no Railway (https://railway.app)
- Repositório GitHub com o código
- Credenciais do Mercado Livre (Client ID e Secret)

---

## 🚀 Passo a Passo

### 1. Criar Novo Projeto

1. Acesse https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório `markethub-crm-v2`
5. Railway detectará automaticamente o Dockerfile

### 2. Adicionar PostgreSQL

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Aguarde o provisionamento (1-2 minutos)
4. O Railway criará automaticamente a variável `DATABASE_URL`

### 3. Configurar Variáveis de Ambiente

No Railway, vá em **Settings** → **Variables** e adicione:

#### Variáveis Essenciais

```env
# Aplicação
NODE_ENV=production
PORT=3000

# Banco de Dados (auto-gerado pelo Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secrets (GERAR NOVOS!)
JWT_SECRET=<GERAR_STRING_ALEATORIA_32_CHARS>
JWT_REFRESH_SECRET=<GERAR_STRING_ALEATORIA_32_CHARS>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Super Admin
SUPER_ADMIN_USER=admin
SUPER_ADMIN_PASS=<SENHA_FORTE_AQUI>

# Mercado Livre (obter no portal de desenvolvedores)
ML_CLIENT_ID=<seu_client_id>
ML_CLIENT_SECRET=<seu_client_secret>
ML_REDIRECT_URI=https://${{RAILWAY_PUBLIC_DOMAIN}}/api/integrations/mercadolivre/callback
ML_APP_URL=https://auth.mercadolivre.com.br/authorization

# Frontend URL (auto-gerado)
FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

#### Variáveis Opcionais

```env
# Stripe (se for usar pagamentos)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Gemini AI (para chatbot)
GOOGLE_GEMINI_API_KEY=<sua_api_key>

# Sentry (monitoramento de erros)
SENTRY_DSN=https://...@sentry.io/...

# Redis (cache - opcional)
REDIS_URL=redis://...
```

### 4. Gerar JWT Secrets

No seu terminal local, execute:

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie os valores gerados e cole nas variáveis de ambiente.

### 5. Configurar Domínio

#### Opção A: Usar Domínio do Railway (Automático)

O Railway gera automaticamente um domínio como:
```
markethub-crm-v2-production.up.railway.app
```

Este domínio já está configurado e pronto para usar.

#### Opção B: Usar Domínio Customizado

1. No Railway, vá em **Settings** → **Domains**
2. Clique em **"Custom Domain"**
3. Digite seu domínio (ex: `app.markethubcrm.com.br`)
4. Configure o DNS do seu domínio:
   - **Tipo:** CNAME
   - **Nome:** app (ou @)
   - **Valor:** `<seu-projeto>.up.railway.app`
5. Aguarde propagação DNS (5-30 minutos)

### 6. Deploy Automático

Após configurar as variáveis:

1. Railway iniciará o build automaticamente
2. Aguarde 3-5 minutos
3. Acompanhe os logs em **"Deployments"**
4. Quando aparecer "Deployment successful", está pronto!

### 7. Executar Migrações do Banco

O sistema executa migrações automaticamente na inicialização, mas você pode executar manualmente se necessário:

1. No Railway, vá em **"Shell"** (terminal)
2. Execute:
```bash
node scripts/migrate.js
```

---

## ✅ Verificação Pós-Deploy

### Testar Health Check

```bash
curl https://seu-dominio.railway.app/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T...",
  "database": "markethub_crm"
}
```

### Testar Landing Page

Acesse no navegador:
```
https://seu-dominio.railway.app
```

Você deve ver a landing page do Markthub CRM.

### Testar Login

1. Acesse: `https://seu-dominio.railway.app/login`
2. Use as credenciais do Super Admin configuradas

---

## 🔧 Configurações Avançadas

### Aumentar Recursos

Se o sistema ficar lento:

1. Vá em **Settings** → **Resources**
2. Aumente:
   - **Memory:** 2GB → 4GB
   - **CPU:** 2 vCPUs → 4 vCPUs

### Configurar Auto-scaling

1. Vá em **Settings** → **Autoscaling**
2. Configure:
   - **Min replicas:** 1
   - **Max replicas:** 3
   - **Target CPU:** 70%

### Configurar Backups Automáticos

1. No serviço PostgreSQL, vá em **Settings**
2. Ative **"Automated Backups"**
3. Configure frequência: Diária

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

1. No Railway, clique no serviço
2. Vá em **"Deployments"**
3. Clique no deployment ativo
4. Logs aparecem automaticamente

### Métricas

Railway fornece automaticamente:
- **CPU Usage**
- **Memory Usage**
- **Network Traffic**
- **Request Count**

Acesse em: **"Metrics"** no menu lateral

---

## 🆘 Troubleshooting

### Erro: "Application failed to respond"

**Causa:** Aplicação não iniciou corretamente

**Solução:**
1. Verifique logs: `railway logs`
2. Confirme que `PORT=3000` está nas variáveis
3. Verifique se `DATABASE_URL` está correto

### Erro: "Database connection failed"

**Causa:** PostgreSQL não está acessível

**Solução:**
1. Verifique se o serviço PostgreSQL está rodando
2. Confirme que `DATABASE_URL` está configurado
3. Teste conexão no Shell:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Erro: "Build failed"

**Causa:** Erro durante build do Docker

**Solução:**
1. Verifique logs de build
2. Confirme que `pnpm-lock.yaml` está commitado
3. Tente rebuild: **Settings** → **"Trigger Deploy"**

### Site lento

**Causa:** Recursos insuficientes

**Solução:**
1. Aumente memória/CPU em Settings
2. Ative Redis para cache
3. Configure CDN (Cloudflare)

---

## 🔄 Atualizações

### Deploy Automático

Railway faz deploy automático quando você:
1. Faz `git push` no branch configurado (main)
2. Cria uma nova tag/release

### Deploy Manual

1. No Railway, vá em **Settings**
2. Clique em **"Trigger Deploy"**
3. Selecione o commit desejado

### Rollback

Se algo der errado:
1. Vá em **"Deployments"**
2. Encontre o deployment anterior que funcionava
3. Clique em **"..."** → **"Redeploy"**

---

## 💰 Custos

### Plano Hobby (Gratuito)

- **$5 de crédito/mês** grátis
- Suficiente para desenvolvimento e testes
- Limitações:
  - 512MB RAM
  - 1 vCPU
  - 1GB storage

### Plano Pro ($20/mês)

- **$20 de crédito/mês**
- Recomendado para produção
- Recursos:
  - 8GB RAM
  - 8 vCPUs
  - 100GB storage
  - Backups automáticos
  - Suporte prioritário

### Estimativa para Markthub CRM

**Configuração Mínima (Produção):**
- App: 2GB RAM, 2 vCPU = ~$10/mês
- PostgreSQL: 1GB RAM = ~$5/mês
- **Total:** ~$15/mês

**Configuração Recomendada:**
- App: 4GB RAM, 4 vCPU = ~$20/mês
- PostgreSQL: 2GB RAM = ~$10/mês
- Redis: 512MB RAM = ~$5/mês
- **Total:** ~$35/mês

---

## 📞 Suporte

**Railway:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**Markthub CRM:**
- GitHub Issues: https://github.com/danilolimaCabral/markethub-crm-v2/issues
- Email: suporte@markethubcrm.com.br

---

## ✅ Checklist Final

Antes de considerar o deploy concluído:

- [ ] Variáveis de ambiente configuradas
- [ ] PostgreSQL provisionado e conectado
- [ ] Build concluído com sucesso
- [ ] Health check respondendo
- [ ] Landing page acessível
- [ ] Login funcionando
- [ ] Integração ML testada
- [ ] Backups automáticos ativados
- [ ] Domínio customizado configurado (se aplicável)
- [ ] Monitoramento configurado
- [ ] Documentação entregue ao time

---

**Tempo estimado:** 10-15 minutos  
**Dificuldade:** Fácil  
**Versão:** 1.0
