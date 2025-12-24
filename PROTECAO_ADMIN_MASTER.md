# Proteção do Admin Master

## 📋 Visão Geral

Este documento descreve o sistema de proteção implementado para bloquear o acesso de usuários de teste aos dados e configurações do **admin master** do MarketHub CRM.

---

## 🔒 O Que Foi Protegido

### Usuários Protegidos

O seguinte email de admin master está **completamente protegido** e isolado:

- `admin@markethubcrm.com.br` (Admin Master)

### Proteções Implementadas

✅ **Bloqueio de Acesso Direto**
- Usuários comuns não podem visualizar dados do admin master
- Usuários comuns não podem editar informações do admin master
- Usuários comuns não podem excluir o admin master

✅ **Filtragem Automática**
- Admin master não aparece em listagens de usuários
- Admin master não aparece em buscas
- Admin master não aparece em relatórios

✅ **Isolamento de Dados**
- Cada usuário só vê seus próprios dados
- Tenant isolation garantido
- Queries automáticas filtram admin master

✅ **Exceções Controladas**
- Apenas superadmin pode acessar dados do admin master
- O próprio admin master pode acessar seus dados
- Nenhum outro usuário tem acesso

---

## 🛠️ Implementação Técnica

### 1. Middleware de Proteção

#### `protectMasterAdmin`

Bloqueia acesso a dados do admin master em rotas específicas.

```typescript
import { protectMasterAdmin } from '../middleware/auth';

// Aplicar em rotas de usuários
router.get('/users/:id', authenticateToken, protectMasterAdmin, getUserById);
router.put('/users/:id', authenticateToken, protectMasterAdmin, updateUser);
router.delete('/users/:id', authenticateToken, protectMasterAdmin, deleteUser);
```

**Funcionalidade:**
- Verifica se o usuário está tentando acessar dados do admin master
- Bloqueia acesso por ID ou email
- Retorna erro 403 com mensagem clara

#### `filterMasterAdminFromResults`

Remove automaticamente admin master de listagens.

```typescript
import { filterMasterAdminFromResults } from '../middleware/auth';

// Aplicar em rotas de listagem
router.get('/users', authenticateToken, filterMasterAdminFromResults, listUsers);
```

**Funcionalidade:**
- Intercepta resposta JSON
- Filtra arrays removendo admin master
- Transparente para o código da rota

### 2. Funções Auxiliares

#### `isProtectedAdmin(email: string): boolean`

Verifica se um email pertence a um admin master protegido.

```typescript
import { isProtectedAdmin } from '../middleware/auth';

if (isProtectedAdmin(email)) {
  // Email é de admin master protegido
}
```

#### `isProtectedAdminById(userId: string): Promise<boolean>`

Verifica se um ID pertence a um admin master protegido.

```typescript
import { isProtectedAdminById } from '../middleware/auth';

const isProtected = await isProtectedAdminById(userId);
if (isProtected) {
  // Usuário é admin master protegido
}
```

---

## 📍 Onde Aplicar

### Rotas que DEVEM ter proteção:

✅ **Rotas de Usuários**
```typescript
// /server/routes/users.ts (se existir)
router.get('/users', authenticateToken, filterMasterAdminFromResults, listUsers);
router.get('/users/:id', authenticateToken, protectMasterAdmin, getUserById);
router.put('/users/:id', authenticateToken, protectMasterAdmin, updateUser);
router.delete('/users/:id', authenticateToken, protectMasterAdmin, deleteUser);
```

✅ **Rotas de Configurações**
```typescript
// /server/routes/settings.ts
router.get('/settings/users', authenticateToken, filterMasterAdminFromResults, ...);
router.put('/settings/users/:id', authenticateToken, protectMasterAdmin, ...);
```

✅ **Rotas de Relatórios**
```typescript
// /server/routes/reports.ts
router.get('/reports/users', authenticateToken, filterMasterAdminFromResults, ...);
```

✅ **Rotas de Auditoria**
```typescript
// /server/routes/audit.ts
router.get('/audit/users', authenticateToken, filterMasterAdminFromResults, ...);
```

### Rotas que NÃO precisam de proteção:

❌ **Rotas públicas** (sem autenticação)
❌ **Rotas de autenticação** (login, register)
❌ **Rotas de webhook** (externas)
❌ **Rotas de health check**

---

## 🧪 Testes

### Teste 1: Bloqueio de Acesso Direto

```bash
# Como usuário comum, tentar acessar admin master
curl -X GET https://www.markthubcrm.com.br/api/users/[ID_ADMIN_MASTER] \
  -H "Authorization: Bearer [TOKEN_USUARIO_COMUM]"

# Resultado esperado: 403 Forbidden
{
  "error": "Acesso negado. Você não tem permissão para acessar dados do administrador master.",
  "code": "MASTER_ADMIN_PROTECTED"
}
```

### Teste 2: Filtragem em Listagens

```bash
# Como usuário comum, listar todos os usuários
curl -X GET https://www.markthubcrm.com.br/api/users \
  -H "Authorization: Bearer [TOKEN_USUARIO_COMUM]"

# Resultado esperado: Lista SEM admin master
[
  { "id": "user1", "email": "teste@teste.com" },
  { "id": "user2", "email": "outro@teste.com" }
  // Admin master NÃO aparece
]
```

### Teste 3: Acesso do Próprio Admin Master

```bash
# Como admin master, acessar próprios dados
curl -X GET https://www.markthubcrm.com.br/api/users/me \
  -H "Authorization: Bearer [TOKEN_ADMIN_MASTER]"

# Resultado esperado: 200 OK com dados completos
{
  "id": "admin_id",
  "email": "trueimportadorbr@icloud.com",
  "role": "admin"
}
```

### Teste 4: Acesso do Superadmin

```bash
# Como superadmin, acessar dados do admin master
curl -X GET https://www.markthubcrm.com.br/api/users/[ID_ADMIN_MASTER] \
  -H "Authorization: Bearer [TOKEN_SUPERADMIN]"

# Resultado esperado: 200 OK com dados completos
```

---

## 🔧 Queries no Banco de Dados

### Adicionar Filtro em Queries Existentes

Se você tiver queries diretas no código que buscam usuários, adicione filtro:

**Antes:**
```sql
SELECT * FROM users WHERE tenant_id = $1
```

**Depois:**
```sql
SELECT * FROM users 
WHERE tenant_id = $1 
  AND email NOT IN (
    'admin@markethubcrm.com.br'
  )
```

**Ou usando função:**
```typescript
const result = await query(
  'SELECT * FROM users WHERE tenant_id = $1',
  [tenant_id]
);

// Filtrar admin master manualmente
const filtered = result.rows.filter(user => !isProtectedAdmin(user.email));
```

---

## 📊 Diagrama de Fluxo

```
┌─────────────────────┐
│ Usuário faz request │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│ authenticateToken       │ ← Verifica JWT
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ protectMasterAdmin      │ ← Bloqueia acesso ao admin master
└──────────┬──────────────┘
           │
           ├─── É admin master? ──→ Bloqueia (403)
           │
           ├─── É superadmin? ───→ Permite
           │
           └─── É próprio user? ──→ Permite
                     │
                     ▼
           ┌─────────────────────────┐
           │ Rota processa request   │
           └──────────┬──────────────┘
                      │
                      ▼
           ┌─────────────────────────────┐
           │ filterMasterAdminFromResults│ ← Remove admin master da resposta
           └──────────┬────────────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │ Resposta ao usuário │
           └─────────────────────┘
```

---

## ⚠️ Avisos Importantes

### 1. Não Remover Proteções

**NUNCA** remova os middlewares de proteção das rotas. Isso pode expor dados sensíveis do admin master.

### 2. Adicionar Novos Admins

Para adicionar um novo email de admin master protegido, edite:

```typescript
// /server/middleware/auth.ts
const PROTECTED_ADMIN_EMAILS = [
  'admin@markethubcrm.com.br',
  'novo-admin@exemplo.com' // ← Adicionar aqui
];
```

### 3. Logs e Auditoria

Todas as tentativas de acesso bloqueadas são registradas automaticamente nos logs do servidor.

### 4. Testes Automatizados

Sempre que adicionar uma nova rota de usuários, adicione testes para garantir que a proteção está funcionando.

---

## 🚀 Próximos Passos

1. ✅ Middleware de proteção implementado
2. ✅ Funções auxiliares criadas
3. ✅ Documentação completa
4. ⏳ Aplicar em todas as rotas de usuários
5. ⏳ Adicionar testes automatizados
6. ⏳ Revisar queries existentes no código
7. ⏳ Testar em produção

---

## 📞 Suporte

Se você encontrar algum problema com a proteção do admin master ou tiver dúvidas sobre como aplicar os middlewares, entre em contato com a equipe de desenvolvimento.

---

## 📝 Changelog

### v1.0.0 (2025-12-24)
- ✅ Implementação inicial do sistema de proteção
- ✅ Middlewares `protectMasterAdmin` e `filterMasterAdminFromResults`
- ✅ Funções auxiliares `isProtectedAdmin` e `isProtectedAdminById`
- ✅ Documentação completa

---

**Última atualização:** 24 de dezembro de 2025
