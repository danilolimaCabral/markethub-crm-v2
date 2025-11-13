# 🔐 Credenciais Super Admin - Markethub CRM

## 🌐 Link de Acesso

### Desenvolvimento (Local)
```
http://localhost:5173/super-admin/login
```

### Produção
```
https://seu-dominio.com/super-admin/login
```

---

## 👤 Credenciais Padrão

### Super Administrador

```
Usuário: superadmin
Senha:   SuperAdmin@2024!
```

**Link Direto:**
- **Local:** http://localhost:5173/super-admin/login
- **Produção:** https://seu-dominio.com/super-admin/login

---

## 🔧 Configuração no .env

As credenciais estão configuradas nas variáveis de ambiente:

```bash
# .env
SUPER_ADMIN_USER=superadmin
SUPER_ADMIN_PASS=SuperAdmin@2024!
```

---

## 📋 Rotas do Super Admin

### Frontend

| Rota | Descrição |
|------|-----------|
| `/super-admin/login` | Página de login do super admin |
| `/super-admin/dashboard` | Dashboard principal |
| `/super-admin/tenants` | Gerenciamento de tenants |

### API Backend

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/superadmin/login` | POST | Login do super admin |
| `/api/superadmin/dashboard` | GET | Dados do dashboard |
| `/api/superadmin/tenants` | GET | Listar todos os tenants |
| `/api/superadmin/tenants/:id` | GET | Detalhes de um tenant |
| `/api/superadmin/tenants/:id/status` | PATCH | Ativar/desativar tenant |
| `/api/superadmin/logs` | GET | Visualizar logs do sistema |
| `/api/superadmin/metrics/system` | GET | Métricas do sistema |
| `/api/superadmin/verify` | GET | Verificar token |

---

## 🔄 Como Fazer Login

### 1. Via Interface Web

1. Acesse: http://localhost:5173/super-admin/login
2. Digite:
   - **Usuário:** `superadmin`
   - **Senha:** `SuperAdmin@2024!`
3. Clique em "Entrar"

### 2. Via API (cURL)

```bash
# Login
curl -X POST http://localhost:3000/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SuperAdmin@2024!"
  }'

# Resposta:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "superadmin",
    "role": "superadmin"
  }
}
```

### 3. Usar o Token

```bash
# Acessar dashboard com o token
curl http://localhost:3000/api/superadmin/dashboard \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🎯 Funcionalidades do Super Admin

### Dashboard
- Visão geral de todos os tenants
- Métricas do sistema
- Logs de atividades
- Estatísticas de uso

### Gerenciamento de Tenants
- ✅ Criar novos tenants
- ✅ Editar informações
- ✅ Ativar/desativar tenants
- ✅ Visualizar estatísticas por tenant
- ✅ Gerenciar planos e limites

### Monitoramento
- ✅ Logs do sistema
- ✅ Métricas de performance
- ✅ Uso de recursos
- ✅ Atividades dos usuários

---

## 🔒 Segurança

### Alterar Credenciais em Produção

**⚠️ IMPORTANTE:** Sempre altere as credenciais padrão em produção!

#### Método 1: Via Variáveis de Ambiente

```bash
# .env de produção
SUPER_ADMIN_USER=seu_usuario_seguro
SUPER_ADMIN_PASS=SuaSenhaForte@2024!
```

#### Método 2: Gerar Hash da Senha

```bash
# Instalar bcrypt
npm install -g bcrypt-cli

# Gerar hash
bcrypt-cli hash "SuaSenhaSuperSegura!" 10

# Resultado:
$2b$10$XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx

# Adicionar no .env
SUPERADMIN_PASSWORD_HASH=$2b$10$XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
```

### Boas Práticas de Segurança

1. ✅ **Senha Forte:** Mínimo 12 caracteres, letras, números e símbolos
2. ✅ **Trocar Regularmente:** Mudar senha a cada 90 dias
3. ✅ **Não Compartilhar:** Manter credenciais privadas
4. ✅ **Usar HTTPS:** Sempre em produção
5. ✅ **2FA:** Considerar adicionar autenticação de dois fatores
6. ✅ **Logs:** Monitorar acessos ao super admin

---

## 🧪 Testando o Acesso

### Verificar se está funcionando

```bash
# 1. Iniciar o servidor
pnpm dev

# 2. Em outro terminal, testar login
curl -X POST http://localhost:3000/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"SuperAdmin@2024!"}'

# 3. Se retornar um token, está funcionando!
```

### Acessar pelo navegador

1. Abrir: http://localhost:5173/super-admin/login
2. Fazer login com as credenciais
3. Você deve ser redirecionado para: http://localhost:5173/super-admin/dashboard

---

## 📱 Credenciais por Ambiente

### Desenvolvimento

```
URL:      http://localhost:5173/super-admin/login
Usuário:  superadmin
Senha:    SuperAdmin@2024!
```

### Staging

```
URL:      https://staging.markethub.com/super-admin/login
Usuário:  [definir em .env de staging]
Senha:    [definir em .env de staging]
```

### Produção

```
URL:      https://markethub.com/super-admin/login
Usuário:  [MUDAR - usar senha forte!]
Senha:    [MUDAR - usar senha forte!]
```

---

## ❓ Troubleshooting

### Erro: "Credenciais inválidas"

1. Verificar se o servidor está rodando
2. Confirmar usuário e senha no `.env`
3. Verificar logs do servidor

### Erro: "Token expirado"

1. Fazer login novamente
2. Token expira após o tempo configurado
3. Verificar `JWT_EXPIRES_IN` no `.env`

### Não consegue acessar a rota

1. Verificar se o servidor backend está rodando na porta 3000
2. Verificar se o frontend está rodando na porta 5173
3. Limpar cache do navegador
4. Verificar console do navegador para erros

---

## 📞 Suporte

Para problemas com acesso ao super admin:

1. Verificar logs em: `server/logs/`
2. Validar ambiente: `pnpm validate:env`
3. Consultar documentação: `DOCUMENTACAO_COMPLETA.md`
4. Verificar rotas: `server/routes/superadmin.ts`

---

## 🔗 Links Úteis

- **Dashboard Principal:** http://localhost:5173/
- **Super Admin Login:** http://localhost:5173/super-admin/login
- **API Docs:** http://localhost:3000/api/
- **Health Check:** http://localhost:3000/api/health

---

**Última atualização:** $(date +%Y-%m-%d)
**Versão:** v2.1
**Status:** ✅ Funcional
