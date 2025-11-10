# 🚀 Guia Completo de Deploy - MarketHub CRM no Railway

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Passo 1: Criar Conta no Railway](#passo-1-criar-conta-no-railway)
3. [Passo 2: Criar Novo Projeto](#passo-2-criar-novo-projeto)
4. [Passo 3: Conectar GitHub](#passo-3-conectar-github)
5. [Passo 4: Adicionar PostgreSQL](#passo-4-adicionar-postgresql)
6. [Passo 5: Configurar Variáveis de Ambiente](#passo-5-configurar-variáveis-de-ambiente)
7. [Passo 6: Executar Migrations SQL](#passo-6-executar-migrations-sql)
8. [Passo 7: Deploy Automático](#passo-7-deploy-automático)
9. [Passo 8: Configurar Domínio Personalizado](#passo-8-configurar-domínio-personalizado)
10. [Verificação e Testes](#verificação-e-testes)
11. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Conta no GitHub
- ✅ Repositório `markethub-crm-v2` no GitHub
- ✅ Cartão de crédito (para trial de $5 grátis)
- ✅ Chave API do Google Gemini (para a Mia)
- ✅ 10 minutos de tempo

---

## Passo 1: Criar Conta no Railway

### 1.1 Acessar Railway

1. Acesse: **https://railway.app**
2. Clique em **"Start a New Project"** ou **"Login"**

### 1.2 Fazer Login com GitHub

1. Clique em **"Login with GitHub"**
2. Autorize o Railway a acessar sua conta GitHub
3. Confirme o email (se solicitado)

### 1.3 Adicionar Método de Pagamento

1. Vá em **Settings** (canto superior direito)
2. Clique em **"Billing"**
3. Adicione um cartão de crédito
4. **Você ganha $5 grátis** para testar (500 horas de execução)

> 💡 **Nota:** O Railway só cobra após usar os $5 grátis. O plano Hobby custa $5/mês.

---

## Passo 2: Criar Novo Projeto

### 2.1 Criar Projeto

1. No dashboard do Railway, clique em **"New Project"**
2. Escolha **"Deploy from GitHub repo"**

### 2.2 Autorizar Railway no GitHub (se necessário)

1. Clique em **"Configure GitHub App"**
2. Selecione **"All repositories"** ou apenas `markethub-crm-v2`
3. Clique em **"Install & Authorize"**

---

## Passo 3: Conectar GitHub

### 3.1 Selecionar Repositório

1. Na lista de repositórios, encontre **`markethub-crm-v2`**
2. Clique no repositório
3. Railway começará a detectar automaticamente o projeto

### 3.2 Configurar Build

Railway detectará automaticamente:
- ✅ Node.js 18+
- ✅ pnpm como package manager
- ✅ Script `build` do package.json
- ✅ Script `start` para produção

> 💡 **Nota:** Os arquivos `railway.json` e `nixpacks.toml` já estão configurados no repositório!

---

## Passo 4: Adicionar PostgreSQL

### 4.1 Adicionar Database

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"**
3. Escolha **"PostgreSQL"**
4. Clique em **"Add PostgreSQL"**

### 4.2 Aguardar Provisionamento

- Railway criará automaticamente um banco PostgreSQL
- Isso leva cerca de 30 segundos
- Você verá um novo card "PostgreSQL" no projeto

### 4.3 Obter Connection String

1. Clique no card **"PostgreSQL"**
2. Vá na aba **"Connect"**
3. Copie a **"Postgres Connection URL"**
4. Formato: `postgresql://usuario:senha@host:porta/database`

> 💡 **Nota:** Guarde essa URL, você vai precisar dela!

---

## Passo 5: Configurar Variáveis de Ambiente

### 5.1 Acessar Variáveis

1. Clique no card do seu **app** (markethub-crm-v2)
2. Vá na aba **"Variables"**
3. Clique em **"+ New Variable"**

### 5.2 Adicionar Variáveis Obrigatórias

Adicione as seguintes variáveis **uma por uma**:

#### Database (Obrigatório)

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

> ⚠️ **Importante:** Use a connection string que você copiou no Passo 4.3!

Ou configure separadamente:

```env
DB_HOST=seu-host.railway.app
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=sua-senha-gerada
```

#### Node.js (Obrigatório)

```env
NODE_ENV=production
PORT=3000
```

#### Google Gemini AI - Mia (Obrigatório)

```env
GEMINI_API_KEY=sua_chave_gemini_aqui
```

> 📝 **Como obter:** https://makersuite.google.com/app/apikey

#### Aplicação (Opcional)

```env
VITE_APP_TITLE=MarketHub CRM
VITE_APP_LOGO=/logo-final.png
```

#### Integrações (Opcional)

```env
# Asaas (Pagamentos)
VITE_ASAAS_API_URL=https://api.asaas.com/v3
VITE_ASAAS_API_KEY=sua_chave_asaas

# Mercado Livre
VITE_ML_CLIENT_ID=seu_client_id
VITE_ML_CLIENT_SECRET=seu_client_secret
VITE_ML_REDIRECT_URI=https://seu-dominio.railway.app/callback
```

### 5.3 Salvar Variáveis

- Clique em **"Add"** para cada variável
- Railway reiniciará o app automaticamente

---

## Passo 6: Executar Migrations SQL

### 6.1 Acessar PostgreSQL

1. Clique no card **"PostgreSQL"**
2. Vá na aba **"Data"**
3. Clique em **"Query"** ou use o Railway CLI

### 6.2 Executar Scripts SQL

Execute os scripts SQL **na ordem**:

#### Script 1: Clientes Master

```sql
-- Copie e cole o conteúdo de: database/07_clientes_master.sql
```

#### Script 2: Pedidos

```sql
-- Copie e cole o conteúdo de: database/08_pedidos.sql
```

#### Script 3: Produtos

```sql
-- Copie e cole o conteúdo de: database/09_produtos.sql
```

### 6.3 Verificar Tabelas

Execute para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Você deve ver:
- ✅ `clientes_master`
- ✅ `pedidos`
- ✅ `produtos`

### 6.4 Alternativa: Railway CLI

Se preferir usar o CLI:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Executar migrations
railway run psql $DATABASE_URL < database/07_clientes_master.sql
railway run psql $DATABASE_URL < database/08_pedidos.sql
railway run psql $DATABASE_URL < database/09_produtos.sql
```

---

## Passo 7: Deploy Automático

### 7.1 Trigger Deploy

1. Railway detecta automaticamente mudanças no GitHub
2. Ou clique em **"Deploy"** manualmente no card do app
3. Aguarde o build (2-3 minutos)

### 7.2 Acompanhar Build

1. Clique no card do app
2. Vá na aba **"Deployments"**
3. Clique no deployment ativo
4. Veja os logs em tempo real

### 7.3 Verificar Deploy

Quando o deploy terminar, você verá:
- ✅ Status: **"Active"**
- ✅ URL gerada automaticamente
- ✅ Logs mostrando "Server started on port 3000"

### 7.4 Acessar Aplicação

1. Clique no card do app
2. Vá na aba **"Settings"**
3. Copie a **"Public Domain"**
4. Formato: `markethub-crm-production.up.railway.app`
5. Abra no navegador!

---

## Passo 8: Configurar Domínio Personalizado

### 8.1 Adicionar Domínio

1. No card do app, vá em **"Settings"**
2. Role até **"Domains"**
3. Clique em **"+ Custom Domain"**
4. Digite: `markethubcrm.manus.space`
5. Clique em **"Add Domain"**

### 8.2 Configurar DNS

Railway mostrará os registros DNS necessários:

```
Tipo: CNAME
Nome: markethubcrm
Valor: markethub-crm-production.up.railway.app
```

### 8.3 Adicionar no Provedor DNS

1. Acesse o painel de DNS do domínio `manus.space`
2. Adicione um registro CNAME:
   - **Tipo:** CNAME
   - **Nome:** markethubcrm
   - **Valor:** markethub-crm-production.up.railway.app
   - **TTL:** 3600 (ou automático)
3. Salve as alterações

### 8.4 Aguardar Propagação

- DNS leva de 5 minutos a 48 horas para propagar
- Geralmente funciona em 10-30 minutos
- Railway configurará SSL automaticamente

### 8.5 Verificar SSL

1. Aguarde Railway mostrar **"Active"** no domínio
2. Acesse: `https://markethubcrm.manus.space`
3. Verifique o cadeado 🔒 (SSL ativo)

---

## Verificação e Testes

### ✅ Checklist de Verificação

Execute os seguintes testes:

#### 1. Landing Page

- [ ] Acesse a URL do Railway
- [ ] Landing page carrega corretamente
- [ ] Mia de Vendas aparece (botão flutuante roxo)
- [ ] Calculadora de taxas ML funciona
- [ ] Botões de cadastro funcionam

#### 2. Login

- [ ] Clique em "Área do Cliente"
- [ ] Faça login com: `admin` / `admin123`
- [ ] Dashboard carrega

#### 3. Dashboard CRM

- [ ] Métricas aparecem
- [ ] Gráficos carregam
- [ ] Menu lateral funciona
- [ ] Todos os módulos acessíveis

#### 4. Painel Master

- [ ] Acesse `/admin-master`
- [ ] Lista de clientes aparece
- [ ] Adicione um novo cliente
- [ ] Cliente salva no PostgreSQL
- [ ] Estatísticas atualizam

#### 5. Mia de Suporte

- [ ] Acesse "Assistente IA" no menu
- [ ] Chat carrega
- [ ] Faça uma pergunta
- [ ] Mia responde (Gemini AI)

#### 6. API REST

Teste os endpoints:

```bash
# Health check
curl https://seu-dominio.railway.app/api/health

# Listar clientes
curl https://seu-dominio.railway.app/api/clientes

# Listar pedidos
curl https://seu-dominio.railway.app/api/pedidos

# Listar produtos
curl https://seu-dominio.railway.app/api/produtos
```

#### 7. PostgreSQL

```bash
# Conectar ao banco
railway run psql $DATABASE_URL

# Verificar dados
SELECT COUNT(*) FROM clientes_master;
SELECT COUNT(*) FROM pedidos;
SELECT COUNT(*) FROM produtos;
```

---

## Troubleshooting

### ❌ Problema: Build Falhou

**Sintomas:**
- Deploy mostra status "Failed"
- Logs mostram erros de build

**Soluções:**

1. **Verificar logs:**
   ```
   Deployments > Clique no deploy > View Logs
   ```

2. **Erro de dependências:**
   ```bash
   # No repositório local
   pnpm install
   git add pnpm-lock.yaml
   git commit -m "fix: Update lockfile"
   git push
   ```

3. **Erro de build script:**
   - Verifique se `package.json` tem script `build`
   - Verifique se `railway.json` está correto

### ❌ Problema: App Não Inicia

**Sintomas:**
- Deploy bem-sucedido mas app não responde
- Logs mostram erro ao iniciar

**Soluções:**

1. **Verificar PORT:**
   ```env
   PORT=3000
   ```

2. **Verificar start script:**
   ```json
   "start": "NODE_ENV=production node server/index.js"
   ```

3. **Verificar logs:**
   ```
   Settings > Logs
   ```

### ❌ Problema: Erro de Conexão com PostgreSQL

**Sintomas:**
- App inicia mas não conecta ao banco
- Erro: "Connection refused" ou "ECONNREFUSED"

**Soluções:**

1. **Verificar DATABASE_URL:**
   ```bash
   # No Railway, vá em Variables
   # Verifique se DATABASE_URL está correta
   ```

2. **Usar variável do Railway:**
   ```env
   # Railway cria automaticamente
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

3. **Verificar se PostgreSQL está ativo:**
   ```
   PostgreSQL card > Status deve estar "Active"
   ```

### ❌ Problema: Mia Não Responde

**Sintomas:**
- Chat abre mas não responde
- Erro no console do navegador

**Soluções:**

1. **Verificar GEMINI_API_KEY:**
   ```env
   GEMINI_API_KEY=sua_chave_valida
   ```

2. **Obter nova chave:**
   - Acesse: https://makersuite.google.com/app/apikey
   - Crie nova API key
   - Adicione no Railway Variables

3. **Verificar logs:**
   ```
   Settings > Logs
   Procure por erros relacionados a Gemini
   ```

### ❌ Problema: Domínio Personalizado Não Funciona

**Sintomas:**
- DNS não resolve
- Erro: "This site can't be reached"

**Soluções:**

1. **Verificar DNS:**
   ```bash
   # No terminal
   nslookup markethubcrm.manus.space
   
   # Deve retornar o CNAME do Railway
   ```

2. **Aguardar propagação:**
   - DNS pode levar até 48h
   - Geralmente 10-30 minutos

3. **Verificar registro CNAME:**
   ```
   Tipo: CNAME
   Nome: markethubcrm
   Valor: markethub-crm-production.up.railway.app
   ```

4. **Limpar cache DNS:**
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   ```

### ❌ Problema: SSL Não Ativa

**Sintomas:**
- Domínio funciona mas sem HTTPS
- Aviso de "Not Secure"

**Soluções:**

1. **Aguardar Railway:**
   - SSL é configurado automaticamente
   - Pode levar 5-10 minutos

2. **Verificar status:**
   ```
   Settings > Domains
   Status deve mostrar "Active" com 🔒
   ```

3. **Forçar HTTPS:**
   - Railway força HTTPS automaticamente
   - Não precisa configurar nada

### ❌ Problema: App Muito Lento

**Sintomas:**
- Páginas demoram para carregar
- Timeout em requests

**Soluções:**

1. **Verificar plano:**
   - Free tier tem recursos limitados
   - Upgrade para Hobby ($5/mês)

2. **Otimizar queries:**
   - Adicione índices no PostgreSQL
   - Use cache quando possível

3. **Monitorar recursos:**
   ```
   Settings > Metrics
   Veja uso de CPU e memória
   ```

### ❌ Problema: Dados Não Persistem

**Sintomas:**
- Dados criados desaparecem
- Clientes adicionados somem

**Soluções:**

1. **Verificar se está usando PostgreSQL:**
   - Frontend deve chamar API
   - Não usar localStorage em produção

2. **Verificar migrations:**
   ```sql
   SELECT * FROM clientes_master LIMIT 5;
   ```

3. **Verificar logs de API:**
   ```
   Settings > Logs
   Procure por erros de INSERT/UPDATE
   ```

---

## 📊 Monitoramento

### Métricas do Railway

1. **CPU Usage:**
   - Normal: 5-20%
   - Alto: > 80%

2. **Memory Usage:**
   - Normal: 100-300 MB
   - Alto: > 500 MB

3. **Network:**
   - Inbound: Requests recebidos
   - Outbound: Responses enviados

### Logs em Tempo Real

```
Settings > Logs > Live Logs
```

Procure por:
- ✅ "Server started on port 3000"
- ✅ "Connected to PostgreSQL"
- ❌ Erros (em vermelho)
- ⚠️ Warnings (em amarelo)

### Alertas

Configure alertas no Railway:
1. Settings > Notifications
2. Adicione email ou webhook
3. Escolha eventos:
   - Deploy failed
   - App crashed
   - High resource usage

---

## 🎉 Conclusão

Parabéns! Seu **MarketHub CRM** está no ar! 🚀

### URLs Importantes

- **Aplicação:** https://markethubcrm.manus.space
- **API:** https://markethubcrm.manus.space/api
- **Dashboard Railway:** https://railway.app/dashboard

### Credenciais Padrão

- **Usuário:** admin
- **Senha:** admin123

> ⚠️ **Importante:** Altere a senha padrão em produção!

### Próximos Passos

1. ✅ Testar todas as funcionalidades
2. ✅ Adicionar usuários reais
3. ✅ Configurar integrações (Asaas, ML)
4. ✅ Monitorar performance
5. ✅ Configurar backups automáticos
6. ✅ Adicionar domínio de email personalizado
7. ✅ Implementar analytics

### Suporte

- **Documentação Railway:** https://docs.railway.app
- **Repositório GitHub:** https://github.com/danilolimaCabral/markethub-crm-v2
- **Issues:** https://github.com/danilolimaCabral/markethub-crm-v2/issues

---

**Feito com ❤️ para o MarketHub CRM**
