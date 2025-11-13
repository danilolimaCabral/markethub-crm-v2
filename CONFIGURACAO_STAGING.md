# 🧪 CONFIGURAÇÃO DE AMBIENTE DE STAGING

**Data:** 13/11/2025  
**Objetivo:** Criar ambiente de testes antes do deploy em produção  
**Tempo Estimado:** 2-4 horas  

---

## 🎯 OBJETIVO DO STAGING

O ambiente de staging é uma **cópia exata do ambiente de produção** usada para:
- ✅ Testar novas features antes de ir para produção
- ✅ Validar migrations de banco de dados
- ✅ Testes de integração com APIs reais
- ✅ Validação de QA e stakeholders
- ✅ Testes de performance e carga
- ✅ Aprovação final antes do deploy

---

## 📋 ARQUITETURA STAGING

```
┌─────────────────────────────────────────────────────────────┐
│                     PIPELINE CI/CD                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  GitHub Actions  │
                  │   - Lint         │
                  │   - Type Check   │
                  │   - Tests        │
                  │   - Build        │
                  └──────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    ┌──────────────────┐       ┌──────────────────┐
    │    STAGING       │       │   PRODUCTION     │
    │                  │       │                  │
    │  staging.mark... │       │  www.markethub...│
    │                  │       │                  │
    │  - Auto Deploy   │       │  - Manual/Tag    │
    │  - DB Staging    │       │  - DB Production │
    │  - Redis Staging │       │  - Redis Prod    │
    │  - Testes OK     │       │  - Alta Disponib │
    └──────────────────┘       └──────────────────┘
```

---

## 🚀 PASSO A PASSO - RAILWAY

### 1. Criar Projeto Staging no Railway

#### Via Dashboard (Recomendado)

1. Acesse https://railway.app/dashboard
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha `danilolimaCabral/markethub-crm-v2`
5. Nome do projeto: `markethub-staging`
6. Branch: `develop` ou `main` (escolher qual usar para staging)

#### Via CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar novo projeto
railway init --name markethub-staging

# Linkar com repositório
railway link

# Configurar environment
railway environment staging
```

### 2. Configurar Banco de Dados Staging

#### Opção A: PostgreSQL no Railway (Recomendado)

```bash
# Adicionar PostgreSQL ao projeto staging
railway add

# Selecionar: PostgreSQL
# Nome: markethub-staging-db
```

**Configurações Automáticas:**
- Versão: PostgreSQL 15
- Storage: 10GB (expansível)
- Backup: Automático diário
- Variável: `DATABASE_URL` (criada automaticamente)

#### Opção B: PostgreSQL Externo

Se você já tem um banco PostgreSQL:

```bash
# Adicionar variável manual
railway variables set DATABASE_URL="postgresql://user:pass@host:5432/markethub_staging"
```

### 3. Configurar Variáveis de Ambiente

```bash
# Via CLI
railway variables set NODE_ENV=staging
railway variables set JWT_SECRET="seu-secret-staging-diferente-de-prod"
railway variables set JWT_REFRESH_SECRET="seu-refresh-secret-staging"
railway variables set FRONTEND_URL="https://staging.markthubcrm.com.br"

# Mercado Livre (usar conta de testes)
railway variables set ML_CLIENT_ID="seu-ml-test-id"
railway variables set ML_CLIENT_SECRET="seu-ml-test-secret"
railway variables set ML_REDIRECT_URI="https://staging.markthubcrm.com.br/api/integrations/mercadolivre/callback"

# Stripe (usar test keys)
railway variables set STRIPE_SECRET_KEY="sk_test_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Gemini IA
railway variables set GEMINI_API_KEY="sua-key"

# Sentry (opcional - ambiente staging)
railway variables set SENTRY_DSN="https://...@sentry.io/..."
railway variables set SENTRY_ENVIRONMENT="staging"
```

#### Via Dashboard

1. Acesse o projeto no Railway
2. Vá em "Variables"
3. Clique em "+ New Variable"
4. Adicione cada variável

### 4. Configurar Domínio Staging

#### Via Railway Dashboard

1. Acesse o projeto staging
2. Vá em "Settings" → "Domains"
3. Clique em "Generate Domain"
4. Railway gera: `markethub-staging-production.up.railway.app`

#### Domínio Customizado (Opcional)

```bash
# Adicionar domínio próprio
# 1. Acessar Railway Dashboard → Domains
# 2. Adicionar: staging.markthubcrm.com.br
# 3. Criar registro CNAME no seu DNS:
#    staging.markthubcrm.com.br → markethub-staging-production.up.railway.app
```

**Registro DNS:**
```
Type: CNAME
Name: staging
Value: markethub-staging-production.up.railway.app
TTL: 3600
```

### 5. Executar Migrations Iniciais

```bash
# Via Railway CLI
railway run pnpm run migrate

# Ou via Dashboard:
# Settings → Deploy → "Run Command"
# Comando: pnpm run migrate
```

### 6. Testar Deploy Inicial

```bash
# Via CLI
railway up

# Aguardar build e deploy
# Ver logs
railway logs

# Testar
curl https://staging.markthubcrm.com.br/api/health
```

---

## ⚙️ CONFIGURAR AUTO-DEPLOY DO GITHUB

### Método 1: Railway GitHub Integration (Recomendado)

1. **No Railway Dashboard:**
   - Acesse projeto staging
   - Vá em "Settings" → "Source"
   - Configure:
     - Repository: `danilolimaCabral/markethub-crm-v2`
     - Branch: `develop` (ou `main`)
     - Root Directory: `/`
     - Watch Paths: `server/**`, `client/**`, `package.json`

2. **Deploy Triggers:**
   - ✅ Push to branch
   - ✅ PR approved (opcional)
   - ❌ Manual only (desabilitar)

### Método 2: GitHub Actions

#### `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop
      - cursor/*
  workflow_dispatch:

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.markthubcrm.com.br
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test
        env:
          NODE_ENV: test

      - name: Build application
        run: pnpm build

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway Staging
        run: |
          railway link ${{ secrets.RAILWAY_STAGING_PROJECT_ID }}
          railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Wait for deployment
        run: sleep 30

      - name: Run smoke tests
        run: |
          curl -f https://staging.markthubcrm.com.br/api/health || exit 1
          echo "✅ Staging deployment successful!"

      - name: Notify on Slack/Discord
        if: success()
        run: |
          # Adicionar notificação aqui
          echo "🚀 Staging deployed: ${{ github.sha }}"
```

#### Secrets Necessários

Adicionar no GitHub:
- `RAILWAY_TOKEN` - Token do Railway
- `RAILWAY_STAGING_PROJECT_ID` - ID do projeto staging
- `STAGING_DATABASE_URL` - URL do banco staging

---

## 🔧 DIFERENÇAS STAGING vs PRODUÇÃO

| Aspecto | Staging | Produção |
|---------|---------|----------|
| **URL** | staging.markthubcrm.com.br | www.markthubcrm.com.br |
| **Branch** | develop / cursor/* | main / tags |
| **Deploy** | Automático (push) | Manual / Tag |
| **Database** | PostgreSQL Staging | PostgreSQL Prod |
| **ML API** | Conta de teste | Conta real |
| **Stripe** | Test keys | Live keys |
| **Tamanho** | Menor (2GB RAM) | Maior (4GB+ RAM) |
| **Backups** | Diário | Múltiplos/hora |
| **Monitoring** | Básico | Completo |
| **SSL** | Sim (Railway) | Sim (Railway) |
| **Cache** | Redis opcional | Redis obrigatório |

---

## 📝 CHECKLIST DE CONFIGURAÇÃO STAGING

### Infraestrutura
- [ ] Projeto Railway staging criado
- [ ] Banco de dados PostgreSQL configurado
- [ ] Redis configurado (opcional)
- [ ] Domínio staging configurado

### Variáveis de Ambiente
- [ ] NODE_ENV=staging
- [ ] DATABASE_URL
- [ ] JWT_SECRET (diferente de prod!)
- [ ] JWT_REFRESH_SECRET (diferente de prod!)
- [ ] ML_CLIENT_ID (conta teste)
- [ ] ML_CLIENT_SECRET (conta teste)
- [ ] STRIPE_SECRET_KEY (test key)
- [ ] GEMINI_API_KEY

### Deploy
- [ ] GitHub integration configurada
- [ ] Auto-deploy ativado
- [ ] Workflow GitHub Actions criado
- [ ] Secrets configurados no GitHub

### Testes
- [ ] Deploy inicial funcionou
- [ ] Health check responde
- [ ] Login funciona
- [ ] Integração ML funciona (test)
- [ ] Banco de dados acessível

### Documentação
- [ ] Credenciais staging documentadas
- [ ] Processo de deploy documentado
- [ ] Diferenças staging/prod documentadas

---

## 🧪 PROCESSO DE VALIDAÇÃO EM STAGING

### Quando Usar Staging?

✅ **SEMPRE testar em staging antes de produção:**
1. Novas features
2. Mudanças de banco de dados (migrations)
3. Alterações em integrações (ML, Stripe, etc)
4. Atualizações de dependências
5. Mudanças de configuração

### Fluxo de Validação

```
1. Desenvolvedor → Push para branch develop
                     ↓
2. GitHub Actions → Roda testes automatizados
                     ↓
3. Railway        → Deploy automático em staging
                     ↓
4. QA/Tester      → Testa funcionalidades
                     ↓
5. Stakeholder    → Aprova mudanças
                     ↓
6. DevOps         → Merge para main → Deploy produção
```

### Checklist de Validação

```markdown
## Validação em Staging

### Funcional
- [ ] Login funciona
- [ ] CRUD de produtos funciona
- [ ] CRUD de pedidos funciona
- [ ] Integração ML funciona
- [ ] Relatórios geram corretamente

### Performance
- [ ] Páginas carregam em < 3s
- [ ] API responde em < 500ms
- [ ] Sem memory leaks
- [ ] Queries otimizadas

### Segurança
- [ ] JWT funciona
- [ ] 2FA funciona
- [ ] Permissões corretas
- [ ] Rate limiting ativo

### Integrações
- [ ] Mercado Livre OK
- [ ] Stripe (test) OK
- [ ] Emails enviando
- [ ] Webhooks processando

### Database
- [ ] Migrations rodaram
- [ ] Dados consistentes
- [ ] Indexes criados
- [ ] Backup configurado

### Aprovação Final
- [ ] QA aprovou
- [ ] Stakeholder aprovou
- [ ] Sem bugs críticos
- [ ] Pronto para produção
```

---

## 🚨 TROUBLESHOOTING STAGING

### Deploy Falhou

```bash
# Ver logs
railway logs

# Re-deploy
railway up --detach

# Ver status
railway status
```

### Banco de Dados Não Conecta

```bash
# Verificar variável
railway variables

# Testar conexão
railway run -- psql $DATABASE_URL

# Rodar migrations
railway run -- pnpm run migrate
```

### Domínio Não Resolve

```bash
# Verificar DNS
dig staging.markthubcrm.com.br

# Verificar configuração Railway
railway domains

# Esperar propagação DNS (pode levar até 24h)
```

---

## 💰 CUSTOS ESTIMADOS

### Railway Staging

**Plano Hobby (Grátis):**
- $5 de crédito/mês grátis
- 500 horas de execução/mês
- 1GB RAM
- 1GB Disco
- ✅ Suficiente para staging

**Plano Developer ($5-20/mês):**
- 100 horas de execução incluídas
- RAM configurável (até 8GB)
- Disco configurável (até 100GB)
- ✅ Recomendado se staging for muito usado

**Estimativa Real:**
```
Staging (uso médio):
- App: $5-10/mês
- PostgreSQL: $5-10/mês
- Redis: $0-5/mês (opcional)
- TOTAL: $10-25/mês
```

---

## ✅ STAGING CONFIGURADO - PRÓXIMOS PASSOS

1. **Testar Deploy Completo**
   ```bash
   # Fazer mudança no código
   git checkout develop
   git commit -m "test: Validar staging deploy"
   git push origin develop
   
   # Aguardar deploy automático
   # Verificar em: https://staging.markthubcrm.com.br
   ```

2. **Configurar Monitoramento**
   - Sentry para staging
   - Logs centralizados
   - Alertas de erro

3. **Documentar Processo**
   - Atualizar README
   - Criar guia para QA
   - Documentar diferenças staging/prod

4. **Próximo:** Deploy gradual em produção!

---

**Status:** ✅ GUIA COMPLETO  
**Tempo de Implementação:** 2-4 horas  
**Próximo Documento:** DEPLOY_GRADUAL_PRODUCAO.md  

