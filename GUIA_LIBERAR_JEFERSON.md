# Guia: Liberar Usuário Jeferson

## 📋 Informações do Usuário

- **Email:** `correiodojeferson@gmail.com`
- **Status:** Tem tenant próprio
- **Ação:** Ativar usuário para permitir login

---

## 🚀 Passo a Passo

### Opção 1: Via Railway Dashboard (Recomendado)

#### 1. Acessar o Banco de Dados

1. Acesse https://railway.app/
2. Faça login
3. Selecione o projeto **"markethub-crm-v2"**
4. Clique no serviço **"Postgres"**
5. Vá na aba **"Data"** ou **"Query"**

#### 2. Verificar Status Atual

Execute a query:

```sql
SELECT 
    id,
    email,
    full_name,
    username,
    role,
    is_active,
    tenant_id,
    created_at,
    last_login_at
FROM users
WHERE email = 'correiodojeferson@gmail.com';
```

**Resultado esperado:**
- Se `is_active = false` → Usuário está **inativo** (precisa ativar)
- Se `is_active = true` → Usuário já está **ativo** (não precisa fazer nada)

#### 3. Ativar Usuário

Se o usuário estiver inativo, execute:

```sql
UPDATE users
SET 
    is_active = true,
    updated_at = NOW()
WHERE email = 'correiodojeferson@gmail.com';
```

#### 4. Confirmar Ativação

Execute novamente para confirmar:

```sql
SELECT 
    id,
    email,
    full_name,
    is_active,
    role,
    tenant_id
FROM users
WHERE email = 'correiodojeferson@gmail.com';
```

**Resultado esperado:**
- `is_active = true` ✅

#### 5. Verificar Tenant

Confirme que o tenant está ativo:

```sql
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.is_active as tenant_ativo,
    u.email as usuario_email,
    u.full_name as usuario_nome,
    u.is_active as usuario_ativo
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
WHERE u.email = 'correiodojeferson@gmail.com';
```

**Resultado esperado:**
- `tenant_ativo = true` ✅
- `usuario_ativo = true` ✅

---

### Opção 2: Via Railway CLI

Se você tiver o Railway CLI instalado:

```bash
# Conectar ao banco
railway connect postgres

# Executar queries SQL
# (Cole as queries acima uma por uma)
```

---

### Opção 3: Via Script SQL

Use o arquivo `liberar-jeferson.sql` que contém todas as queries necessárias:

1. Abra o arquivo `liberar-jeferson.sql`
2. Copie todo o conteúdo
3. Cole no Query Editor do Railway
4. Execute as queries uma por uma (ou todas de uma vez)

---

## ✅ Verificação Final

Após ativar o usuário, verifique:

### 1. Login Funcional

O usuário deve conseguir fazer login em:
- **URL:** https://www.markthubcrm.com.br/login
- **Email:** correiodojeferson@gmail.com
- **Senha:** [senha que ele cadastrou]

### 2. Se Esqueceu a Senha

Se o usuário não lembrar a senha, ele pode:

1. Ir em https://www.markthubcrm.com.br/reset-password
2. Digitar o email: correiodojeferson@gmail.com
3. Seguir instruções para resetar a senha

### 3. Verificar Permissões

Execute para ver as permissões do usuário:

```sql
SELECT 
    up.module_name,
    up.can_view,
    up.can_create,
    up.can_edit,
    up.can_delete
FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email = 'correiodojeferson@gmail.com'
ORDER BY up.module_name;
```

Se não tiver permissões, ele não conseguirá acessar os módulos do sistema.

---

## 🔧 Solução de Problemas

### Problema 1: Usuário não consegue fazer login

**Possíveis causas:**
- ❌ `is_active = false` → Execute o UPDATE para ativar
- ❌ Senha incorreta → Use reset de senha
- ❌ Tenant inativo → Ative o tenant também

**Solução:**
```sql
-- Ativar usuário
UPDATE users SET is_active = true WHERE email = 'correiodojeferson@gmail.com';

-- Ativar tenant (se necessário)
UPDATE tenants SET is_active = true WHERE id = (
    SELECT tenant_id FROM users WHERE email = 'correiodojeferson@gmail.com'
);
```

### Problema 2: Usuário faz login mas não vê nada

**Causa:** Falta de permissões

**Solução:** Adicionar permissões básicas

```sql
-- Adicionar permissões de pedidos
INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
    id,
    'pedidos',
    true,
    true,
    true,
    false
FROM users
WHERE email = 'correiodojeferson@gmail.com'
ON CONFLICT (user_id, module_name) DO NOTHING;

-- Adicionar permissões de produtos
INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
    id,
    'produtos',
    true,
    true,
    true,
    false
FROM users
WHERE email = 'correiodojeferson@gmail.com'
ON CONFLICT (user_id, module_name) DO NOTHING;

-- Adicionar permissões de clientes
INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
    id,
    'clientes',
    true,
    true,
    true,
    false
FROM users
WHERE email = 'correiodojeferson@gmail.com'
ON CONFLICT (user_id, module_name) DO NOTHING;
```

### Problema 3: Tenant não existe

**Causa:** Tenant foi deletado ou não foi criado

**Solução:** Criar novo tenant

```sql
-- Criar tenant
INSERT INTO tenants (name, is_active)
VALUES ('Jeferson Tenant', true)
RETURNING id;

-- Associar usuário ao tenant (substitua [TENANT_ID] pelo ID retornado acima)
UPDATE users
SET tenant_id = [TENANT_ID]
WHERE email = 'correiodojeferson@gmail.com';
```

---

## 📞 Suporte

Se precisar de ajuda adicional:

1. Verifique os logs do Railway:
   ```bash
   railway logs --tail 100
   ```

2. Verifique se há erros de autenticação nos logs

3. Entre em contato com a equipe de desenvolvimento

---

## ✅ Checklist Final

Antes de considerar concluído, verifique:

- [ ] Usuário existe no banco de dados
- [ ] `is_active = true`
- [ ] Tenant existe e está ativo
- [ ] Usuário tem permissões básicas
- [ ] Usuário consegue fazer login
- [ ] Usuário consegue acessar o dashboard
- [ ] Usuário consegue ver seus dados (pedidos, produtos, etc.)

---

**Última atualização:** 24 de dezembro de 2025
