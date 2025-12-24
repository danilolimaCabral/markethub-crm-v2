# Troubleshooting: Problemas de Deploy no Railway

## 🔍 Problema: Healthcheck Falhando

### Sintomas
```
====================
Starting Healthcheck
====================
Path: /api/health
Retry window: 1m40s

Attempt #1 failed with service unavailable
Attempt #2 failed with service unavailable
...
Attempt #7 failed with service unavailable

1/1 replicas never became healthy!
Healthcheck failed!
```

### Causa Raiz Identificada

O servidor estava tentando executar **migrações do banco de dados automaticamente** durante a inicialização. Se o banco de dados estivesse lento ou inacessível, o servidor travava e nunca iniciava completamente, causando falha no healthcheck.

**Logs de erro (quando executado localmente):**
```
❌ Erro ao conectar Sequelize: ConnectionRefusedError
❌ Erro ao executar migrações: Command failed: node scripts/migrate.js
⚠️  Servidor continuará sem as migrações...
```

---

## ✅ Solução Aplicada

### 1. Removida Execução Automática de Migrações

**Antes:**
```typescript
async function startServer() {
  // Executar migrations de forma não-bloqueante
  runMigrations().catch(err => {
    console.error("❌ Erro nas migrações (não-bloqueante):", err.message);
  });
  
  const app = express();
  // ... resto do código
}
```

**Depois:**
```typescript
async function startServer() {
  // Migrações devem ser executadas separadamente via Railway
  console.log("ℹ️  Migrações devem ser executadas manualmente");
  
  const app = express();
  // ... resto do código (inicia imediatamente)
}
```

### 2. Executar Migrações Manualmente

Agora as migrações devem ser executadas **separadamente** via Railway CLI:

```bash
railway run node scripts/migrate.js
```

Ou configure um job separado no Railway para executar migrações antes do deploy.

---

## 📊 Fluxo de Inicialização

### Antes (Problemático)
```
Início → Tentar conectar ao banco → Executar migrações → Servidor inicia
                ↑                          ↑
         Pode demorar muito          Pode falhar
         
Resultado: Healthcheck timeout ❌
```

### Depois (Corrigido)
```
Início → Servidor inicia → Healthcheck OK ✅
         
Migrações: Executadas separadamente quando necessário
```

---

## 🚀 Como Executar Migrações no Railway

### Opção 1: Via Railway CLI (Recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Linkar ao projeto
railway link

# Executar migrações
railway run node scripts/migrate.js
```

### Opção 2: Via Railway Dashboard

1. Acesse https://railway.app/
2. Selecione o projeto "markethub-crm-v2"
3. Vá em "Settings" → "Deploy"
4. Adicione um "Build Command" ou "Deploy Hook":
   ```bash
   node scripts/migrate.js && node dist/index.js
   ```

### Opção 3: Criar Job Separado

1. No Railway Dashboard
2. Adicione um novo serviço "Job" ou "Worker"
3. Configure para executar: `node scripts/migrate.js`
4. Execute manualmente quando necessário

---

## 🔧 Verificação de Saúde

### Testar Localmente

```bash
# Build
pnpm build

# Executar servidor
node dist/index.js

# Em outro terminal, testar healthcheck
curl http://localhost:3000/api/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-24T...",
  "database": "..."
}
```

### Testar no Railway

```bash
# Ver logs em tempo real
railway logs --tail 100

# Testar healthcheck
curl https://www.markthubcrm.com.br/api/health
```

---

## 📋 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] Código compilando sem erros (`pnpm build`)
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] `DATABASE_URL` configurado corretamente
- [ ] Porta configurada (padrão: 3000)
- [ ] Healthcheck endpoint `/api/health` acessível
- [ ] Migrações executadas separadamente (se necessário)

---

## ⚠️ Problemas Comuns

### 1. Servidor não inicia

**Sintoma:** Healthcheck falha, sem logs de erro

**Possíveis causas:**
- Erro de sintaxe no código TypeScript
- Dependência faltando
- Variável de ambiente crítica não configurada
- Porta já em uso

**Solução:**
```bash
# Testar localmente
node dist/index.js

# Ver erros completos
railway logs --tail 200
```

### 2. Banco de dados não conecta

**Sintoma:** Erros de conexão com PostgreSQL

**Possíveis causas:**
- `DATABASE_URL` não configurado
- Banco de dados não iniciado
- Credenciais incorretas

**Solução:**
```bash
# Verificar variável
railway variables

# Verificar se banco está rodando
railway status
```

### 3. Build falha

**Sintoma:** Erro durante `pnpm build`

**Possíveis causas:**
- `pnpm-lock.yaml` desatualizado
- Dependência incompatível
- Erro de TypeScript

**Solução:**
```bash
# Atualizar lockfile
pnpm install

# Commitar e fazer push
git add pnpm-lock.yaml
git commit -m "fix: Atualizar pnpm-lock.yaml"
git push origin main
```

---

## 📞 Suporte

Se o problema persistir:

1. **Verificar logs completos:**
   ```bash
   railway logs --tail 500 > logs.txt
   ```

2. **Testar localmente:**
   ```bash
   pnpm build && node dist/index.js
   ```

3. **Verificar status do Railway:**
   - https://railway.app/status
   - https://status.railway.app/

4. **Entrar em contato:**
   - Railway Discord: https://discord.gg/railway
   - Railway Support: https://help.railway.app/

---

## 📝 Histórico de Correções

### 24/12/2025 - Correção de Healthcheck

**Problema:** Healthcheck falhando após 1m40s  
**Causa:** Migrações automáticas travando inicialização  
**Solução:** Removida execução automática de migrações  
**Commit:** `5fae7e6` - "fix: Remover execução automática de migrações"  

**Resultado:**
- ✅ Servidor inicia em < 5s
- ✅ Healthcheck passa
- ✅ Deploy completa com sucesso

---

**Última atualização:** 24 de dezembro de 2025
