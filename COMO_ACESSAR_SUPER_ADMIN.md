# 🚀 Como Acessar o Super Admin - GUIA COMPLETO

## ⚡ ACESSO RÁPIDO

```
🌐 Link:    http://localhost:5173/super-admin/login
👤 Usuário: superadmin
🔑 Senha:   SuperAdmin@2024!
```

---

## 📋 PASSO A PASSO COMPLETO

### 1️⃣ Instalar Dependências (Se Necessário)

```bash
cd /workspace
pnpm install
```

### 2️⃣ Configurar o .env

Crie ou edite o arquivo `.env`:

```bash
# Super Admin
SUPER_ADMIN_USER=superadmin
SUPER_ADMIN_PASS=SuperAdmin@2024!

# JWT (necessário)
JWT_SECRET=seu-secret-key-aqui-mude-em-producao
JWT_REFRESH_SECRET=seu-refresh-secret-key-aqui

# Database (necessário)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/markethub_crm
```

### 3️⃣ Iniciar o Servidor

```bash
# Terminal 1 - Backend (porta 3000)
cd /workspace
pnpm dev
```

Aguarde até ver:
```
✅ Server running on http://localhost:3000
✅ Frontend: http://localhost:5173
```

### 4️⃣ Acessar o Sistema

1. **Abrir navegador:**
   ```
   http://localhost:5173/super-admin/login
   ```

2. **Fazer login:**
   - Usuário: `superadmin`
   - Senha: `SuperAdmin@2024!`

3. **Você será redirecionado para:**
   ```
   http://localhost:5173/super-admin/dashboard
   ```

---

## 🧪 TESTAR SE ESTÁ FUNCIONANDO

### Opção 1: Via cURL (Terminal)

```bash
# Testar o endpoint de login
curl -X POST http://localhost:3000/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SuperAdmin@2024!"
  }'
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "superadmin",
    "id": "superadmin",
    "email": "superadmin@markethubcrm.com.br",
    "role": "superadmin"
  }
}
```

### Opção 2: Via Navegador

1. Abra o **DevTools** (F12)
2. Vá para a aba **Network**
3. Faça login no sistema
4. Verifique se a requisição para `/api/superadmin/login` retorna status **200**

---

## ❌ PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: "node_modules missing"

**Solução:**
```bash
cd /workspace
pnpm install
```

### Problema 2: "Cannot connect to server"

**Solução:**
```bash
# Verificar se o servidor está rodando
ps aux | grep node

# Se não estiver, iniciar:
pnpm dev
```

### Problema 3: "Credenciais inválidas"

**Causas possíveis:**
1. Senha errada (verifique maiúsculas/minúsculas)
2. Variáveis de ambiente não configuradas

**Solução:**
```bash
# Verificar .env
cat .env | grep SUPER_ADMIN

# Deve mostrar:
# SUPER_ADMIN_USER=superadmin
# SUPER_ADMIN_PASS=SuperAdmin@2024!
```

### Problema 4: Página não carrega

**Solução:**
```bash
# Verificar portas em uso
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Limpar cache do navegador
# Ctrl+Shift+R (Chrome/Firefox)
```

### Problema 5: "Token inválido"

**Solução:**
1. Fazer logout
2. Limpar localStorage do navegador
3. Fazer login novamente

```javascript
// No console do navegador:
localStorage.clear();
location.reload();
```

---

## 🔐 ALTERAR SENHA (Produção)

### Método 1: Via Variáveis de Ambiente

```bash
# .env de produção
SUPER_ADMIN_USER=novo_usuario
SUPER_ADMIN_PASS=SenhaSuperSegura@2024!
```

### Método 2: Usar Hash Bcrypt

```bash
# Gerar hash da senha
npx bcrypt-cli hash "MinhaNovaSenh@Forte!" 10

# Resultado (exemplo):
# $2b$10$abcdefghijklmnopqrstuvwxyz123456789

# Adicionar no .env:
SUPERADMIN_PASSWORD_HASH=$2b$10$abcdefghijklmnopqrstuvwxyz123456789
```

---

## 📱 ROTAS DISPONÍVEIS

### Frontend (Interface Web)

| Rota | Descrição |
|------|-----------|
| `/super-admin/login` | Login do super admin |
| `/super-admin/dashboard` | Dashboard principal |
| `/super-admin/tenants` | Gerenciar tenants |

### Backend (API)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/superadmin/login` | POST | Login |
| `/api/superadmin/dashboard` | GET | Dados do dashboard |
| `/api/superadmin/tenants` | GET | Listar tenants |
| `/api/superadmin/tenants/:id` | GET | Detalhes do tenant |
| `/api/superadmin/tenants/:id/status` | PATCH | Ativar/desativar |
| `/api/superadmin/logs` | GET | Logs do sistema |
| `/api/superadmin/metrics/system` | GET | Métricas |

---

## 🎯 FUNCIONALIDADES DO SUPER ADMIN

Após fazer login, você terá acesso a:

### Dashboard
- 📊 Visão geral de todos os tenants
- 📈 Métricas do sistema
- 📝 Logs recentes
- 💰 Estatísticas de uso

### Gerenciamento de Tenants
- ➕ Criar novos tenants
- ✏️ Editar informações
- 🔄 Ativar/desativar
- 📊 Ver estatísticas por tenant
- 🎛️ Configurar limites e planos

### Logs e Monitoramento
- 📝 Visualizar logs do sistema
- 🔍 Filtrar por tipo/data
- 📊 Métricas de performance
- 👥 Atividades dos usuários

---

## 💻 EXEMPLO COMPLETO DE USO

### Terminal 1: Backend

```bash
cd /workspace

# Instalar dependências (primeira vez)
pnpm install

# Iniciar servidor
pnpm dev

# Aguarde ver:
# ✨ ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.x.x:5173/
```

### Navegador

1. **Abrir:** http://localhost:5173/super-admin/login

2. **Fazer login:**
   ```
   Usuário: superadmin
   Senha:   SuperAdmin@2024!
   ```

3. **Pronto!** Você está no dashboard do super admin

---

## 🔧 CONFIGURAÇÃO AVANÇADA

### Múltiplos Ambientes

**Desenvolvimento (.env.development):**
```bash
SUPER_ADMIN_USER=superadmin
SUPER_ADMIN_PASS=SuperAdmin@2024!
```

**Staging (.env.staging):**
```bash
SUPER_ADMIN_USER=staging_admin
SUPER_ADMIN_PASS=Staging@Senha2024!
```

**Produção (.env.production):**
```bash
SUPER_ADMIN_USER=prod_admin_xyz
SUPER_ADMIN_PASS=Pr0d@S3nh4F0rt3!2024
```

### Logs de Acesso

Os acessos do super admin são registrados em:
```
server/logs/superadmin.log
```

---

## 📞 SUPORTE

Se nada funcionar:

1. **Verificar logs do servidor:**
   ```bash
   tail -f server/logs/error.log
   ```

2. **Verificar console do navegador:**
   - F12 → Console
   - Procurar por erros em vermelho

3. **Testar endpoint diretamente:**
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Reiniciar tudo:**
   ```bash
   # Matar processos
   pkill -f "node.*vite"
   pkill -f "node.*index"
   
   # Reiniciar
   pnpm dev
   ```

---

## ✅ CHECKLIST RÁPIDO

Antes de tentar acessar, verifique:

- [ ] Dependências instaladas (`pnpm install`)
- [ ] Arquivo `.env` existe e está configurado
- [ ] Servidor backend rodando (porta 3000)
- [ ] Frontend rodando (porta 5173)
- [ ] Usuário: `superadmin`
- [ ] Senha: `SuperAdmin@2024!`
- [ ] Link: http://localhost:5173/super-admin/login

---

## 🎉 SUCESSO!

Se você conseguiu acessar, verá:

```
╔══════════════════════════════════════╗
║   Super Admin Dashboard              ║
║                                      ║
║   Tenants: 5                         ║
║   Usuários: 120                      ║
║   Pedidos Hoje: 45                   ║
║   Receita: R$ 12.450,00             ║
╚══════════════════════════════════════╝
```

---

**Data:** $(date +%Y-%m-%d)
**Versão:** v2.1
**Status:** ✅ Funcional
