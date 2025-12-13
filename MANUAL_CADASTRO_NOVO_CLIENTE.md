# 🚀 Manual - Cadastro de Novo Cliente/Tenant

Este manual descreve o passo a passo completo para cadastrar um novo cliente (tenant) no sistema Markethub CRM, incluindo a criação do tenant, usuário admin e configuração inicial.

---

## 📋 Pré-requisitos

- **Acesso ao banco de dados PostgreSQL**
- **String de conexão** (host, porta, usuário, senha, banco)
- **Dados do novo cliente** (nome, CNPJ, email, etc.)

---

## 1. Conectar ao Banco de Dados

Use um cliente PostgreSQL (como `psql`, DBeaver, etc.) para conectar ao banco de dados do sistema.

**Exemplo com `psql`:**
```bash
PGPASSWORD=SUA_SENHA psql -h SEU_HOST -p SUA_PORTA -U SEU_USUARIO -d SEU_BANCO
```

---

## 2. Criar o Tenant

Execute o seguinte comando SQL para criar o novo tenant. Substitua os valores de exemplo pelos dados do seu cliente.

```sql
INSERT INTO tenants (name, cnpj, email, phone, plan, status) 
VALUES (
  'NOME DA EMPRESA',
  '00.000.000/0001-00',
  'email@empresa.com',
  '(11) 99999-9999',
  'Business', -- ou 'Free', 'Pro', etc.
  'Active'    -- ou 'Trial', 'Inactive'
) 
RETURNING id, name, cnpj;
```

**Exemplo:**
```sql
INSERT INTO tenants (name, cnpj, email, phone, plan, status) 
VALUES (
  'NOVA EMPRESA LTDA',
  '12.345.678/0001-99',
  'contato@novaempresa.com',
  '(21) 88888-8888',
  'Pro',
  'Active'
) 
RETURNING id, name, cnpj;
```

**✅ Anote o `id` do tenant retornado!** Você vai precisar dele no próximo passo.

---

## 3. Criar o Usuário Admin

Agora, crie o usuário administrador para o novo tenant. 

### 3.1 Gerar Hash da Senha

O sistema usa `bcryptjs` para senhas. Você pode gerar o hash com Node.js:

**Script `generate-hash.cjs`:**
```javascript
const bcrypt = require('bcryptjs');

const password = 'SENHA_DO_USUARIO';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log(hash);
```

**Executar:**
```bash
# Instalar dependência (se necessário)
npm install bcryptjs

# Executar script
node generate-hash.cjs
```

**✅ Anote o hash gerado!**

### 3.2 Inserir Usuário no Banco

Execute o seguinte comando SQL, substituindo os valores de exemplo:

```sql
INSERT INTO users (full_name, email, username, password_hash, role, tenant_id, is_active) 
VALUES (
  'NOME COMPLETO DO ADMIN',
  'email@admin.com',
  'username_admin',
  'SEU_HASH_BCRYPT_AQUI',
  'admin',
  'ID_DO_TENANT_CRIADO_NO_PASSO_2',
  true
) 
RETURNING id, full_name, email, username;
```

**Exemplo:**
```sql
INSERT INTO users (full_name, email, username, password_hash, role, tenant_id, is_active) 
VALUES (
  'Admin da Nova Empresa',
  'admin@novaempresa.com',
  'admin_nova',
  '$2a$10$abcdef1234567890abcdeABCDEF1234567890abcdeABCDEF123',
  'admin',
  'uuid-do-tenant-aqui',
  true
) 
RETURNING id, full_name, email, username;
```

---

## 4. Testar o Login

Agora o novo cliente pode fazer login no sistema com as credenciais criadas:

- **URL:** https://www.markthubcrm.com.br/login
- **Usuário:** `username_admin` (ou email)
- **Senha:** `SENHA_DO_USUARIO`

---

## 5. Configurar Integração Mercado Livre (Opcional)

Se o cliente for usar a integração com o Mercado Livre, siga estes passos:

### 5.1 Cadastrar Credenciais no Banco

```sql
INSERT INTO marketplace_integrations (marketplace, client_id, client_secret, tenant_id, is_active) 
VALUES (
  'mercadolivre',
  'APP_ID_DO_ML',
  'CLIENT_SECRET_DO_ML',
  'ID_DO_TENANT_CRIADO_NO_PASSO_2',
  true
) 
RETURNING id, marketplace, is_active;
```

### 5.2 Configurar Redirect URI no ML

No painel de desenvolvedores do Mercado Livre, adicione a URL:
```
https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback
```

### 5.3 Conectar no Sistema

1. Faça login no Markethub CRM com o novo usuário
2. Acesse o menu **Inteligência de Mercado** → **Mercado Livre**
3. Clique em **"Conectar Mercado Livre"**
4. Autorize na página do Mercado Livre

---

## 🚨 Solução de Problemas

### Erro: "Credenciais inválidas"
**Causa:** Hash da senha incorreto ou usuário/email errado.
**Solução:** Verifique o hash e os dados do usuário no banco.

### Erro: "Tenant não encontrado"
**Causa:** `tenant_id` incorreto no cadastro do usuário.
**Solução:** Verifique se o `tenant_id` do usuário corresponde ao `id` do tenant.

### Erro: "Redirect URI inválido"
**Causa:** URL de callback não configurada no Mercado Livre.
**Solução:** Adicione a URL no painel de desenvolvedores do ML.

---

## 📞 Suporte

- Email: contato@markthubcrm.com.br
- WhatsApp: (11) 99999-9999
