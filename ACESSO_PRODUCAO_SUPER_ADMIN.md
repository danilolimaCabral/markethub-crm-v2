# 🌐 Acesso Super Admin - markthubcrm.com.br (PRODUÇÃO)

## 🚀 ACESSO DIRETO - PRODUÇÃO

```
🌐 Link Completo: https://www.markthubcrm.com.br/super-admin/login
👤 Usuário:       superadmin
🔑 Senha:         SuperAdmin@2024!
```

---

## ⚡ LINKS IMPORTANTES

### Super Admin (Área Administrativa)
- **Login:** https://www.markthubcrm.com.br/super-admin/login
- **Dashboard:** https://www.markthubcrm.com.br/super-admin/dashboard
- **Tenants:** https://www.markthubcrm.com.br/super-admin/tenants

### Sistema Principal (Usuários)
- **Home:** https://www.markthubcrm.com.br/
- **Login:** https://www.markthubcrm.com.br/login
- **Dashboard:** https://www.markthubcrm.com.br/dashboard

### API Backend
- **Base URL:** https://www.markthubcrm.com.br/api/
- **Super Admin API:** https://www.markthubcrm.com.br/api/superadmin/
- **Health Check:** https://www.markthubcrm.com.br/api/health

---

## 📋 COMO ACESSAR (PASSO A PASSO)

### Método 1: Via Navegador (Recomendado)

1. **Abrir o navegador** (Chrome, Firefox, Edge, Safari)

2. **Acessar o link:**
   ```
   https://www.markthubcrm.com.br/super-admin/login
   ```

3. **Fazer login com as credenciais:**
   - **Usuário:** `superadmin`
   - **Senha:** `SuperAdmin@2024!`
   
4. **Clicar em "Entrar"**

5. **Você será redirecionado para:**
   ```
   https://www.markthubcrm.com.br/super-admin/dashboard
   ```

### Método 2: Via API (cURL)

```bash
# Login e obter token
curl -X POST https://www.markthubcrm.com.br/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SuperAdmin@2024!"
  }'

# Resposta esperada:
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

### Método 3: Via Postman/Insomnia

1. **Criar nova requisição POST**
2. **URL:** `https://www.markthubcrm.com.br/api/superadmin/login`
3. **Headers:**
   ```
   Content-Type: application/json
   ```
4. **Body (JSON):**
   ```json
   {
     "username": "superadmin",
     "password": "SuperAdmin@2024!"
   }
   ```
5. **Enviar**

---

## 🔐 CREDENCIAIS POR AMBIENTE

### Produção (www.markthubcrm.com.br)

```
🌐 URL:      https://www.markthubcrm.com.br/super-admin/login
👤 Usuário:  superadmin
🔑 Senha:    SuperAdmin@2024!
```

**⚠️ IMPORTANTE:** Se as credenciais não funcionarem, verifique as variáveis de ambiente no servidor de produção.

### Local (Desenvolvimento)

```
🌐 URL:      http://localhost:5173/super-admin/login
👤 Usuário:  superadmin
🔑 Senha:    SuperAdmin@2024!
```

---

## 📱 TESTE RÁPIDO

### Verificar se o site está no ar:

```bash
curl -I https://www.markthubcrm.com.br/
```

**Resposta esperada:**
```
HTTP/2 200
content-type: text/html
...
```

### Testar API de saúde:

```bash
curl https://www.markthubcrm.com.br/api/health
```

### Testar login do Super Admin:

```bash
curl -X POST https://www.markthubcrm.com.br/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"SuperAdmin@2024!"}'
```

---

## 🎯 O QUE VOCÊ PODE FAZER NO SUPER ADMIN

### Dashboard Principal
- ✅ Ver todos os tenants cadastrados
- ✅ Visualizar métricas globais do sistema
- ✅ Acompanhar logs de atividades
- ✅ Monitorar uso de recursos

### Gerenciamento de Tenants
- ✅ **Criar** novos tenants (empresas/clientes)
- ✅ **Editar** informações dos tenants
- ✅ **Ativar/Desativar** tenants
- ✅ **Visualizar** estatísticas de cada tenant
- ✅ **Configurar** limites e planos
- ✅ **Gerenciar** usuários de cada tenant

### Logs e Monitoramento
- ✅ Visualizar todos os logs do sistema
- ✅ Filtrar logs por tipo, data, tenant
- ✅ Ver métricas de performance
- ✅ Acompanhar atividades dos usuários
- ✅ Identificar problemas e erros

### Configurações Globais
- ✅ Configurar sistema
- ✅ Gerenciar integrações globais
- ✅ Configurar rate limiting
- ✅ Ajustar parâmetros de segurança

---

## 🛠️ PROBLEMAS COMUNS E SOLUÇÕES

### ❌ Erro: "Credenciais inválidas"

**Causas:**
1. Senha digitada errada (atenção a maiúsculas/minúsculas)
2. Usuário errado
3. Credenciais foram alteradas no servidor

**Soluções:**
1. Verifique a senha: `SuperAdmin@2024!` (com S maiúsculo, @ e !)
2. Verifique o usuário: `superadmin` (tudo minúsculo)
3. Consulte as variáveis de ambiente no servidor:
   ```bash
   # No servidor de produção
   echo $SUPER_ADMIN_USER
   echo $SUPER_ADMIN_PASS
   ```

### ❌ Erro: "Site não carrega" / "Conexão recusada"

**Causas:**
1. Servidor está fora do ar
2. Problema de DNS
3. Certificado SSL expirado

**Soluções:**
1. Verificar se o servidor está rodando:
   ```bash
   curl -I https://www.markthubcrm.com.br/
   ```
2. Verificar DNS:
   ```bash
   nslookup markthubcrm.com.br
   ```
3. Contatar administrador do servidor

### ❌ Erro: "Token inválido" / "Sessão expirada"

**Solução:**
1. Fazer logout
2. Limpar cache/cookies do navegador
3. Fazer login novamente

### ❌ Página em branco após login

**Solução:**
1. Abrir DevTools (F12)
2. Ver console para erros
3. Atualizar página (Ctrl+F5)
4. Limpar cache

---

## 🔒 SEGURANÇA - MUITO IMPORTANTE!

### ⚠️ Em Produção, SEMPRE:

1. **Alterar senha padrão imediatamente**
   ```bash
   # No servidor, editar .env
   SUPER_ADMIN_USER=admin_producao_xyz
   SUPER_ADMIN_PASS=Senh@Sup3rF0rt3!2024$
   ```

2. **Usar senha forte:**
   - Mínimo 16 caracteres
   - Letras maiúsculas e minúsculas
   - Números
   - Símbolos especiais
   - Sem palavras do dicionário

3. **Habilitar 2FA (se disponível)**

4. **Nunca compartilhar credenciais**

5. **Acessar apenas por HTTPS**

6. **Monitorar logs de acesso**

7. **Trocar senha regularmente** (a cada 90 dias)

### Verificar Segurança do Site:

```bash
# Verificar SSL
curl -vI https://www.markthubcrm.com.br/ 2>&1 | grep SSL

# Verificar certificado
openssl s_client -connect markthubcrm.com.br:443 -servername markthubcrm.com.br < /dev/null
```

---

## 📊 ENDPOINTS DA API (Referência)

### Autenticação

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/superadmin/login` | POST | Login do super admin |
| `/api/superadmin/verify` | GET | Verificar token |

### Dashboard

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/superadmin/dashboard` | GET | Dados do dashboard |
| `/api/superadmin/metrics/system` | GET | Métricas do sistema |

### Tenants

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/superadmin/tenants` | GET | Listar todos os tenants |
| `/api/superadmin/tenants/:id` | GET | Detalhes de um tenant |
| `/api/superadmin/tenants/:id` | PUT | Atualizar tenant |
| `/api/superadmin/tenants/:id/status` | PATCH | Ativar/desativar |

### Logs

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/superadmin/logs` | GET | Visualizar logs |

---

## 💻 EXEMPLO DE USO COMPLETO

### 1. Login via cURL

```bash
# Fazer login e salvar token
TOKEN=$(curl -s -X POST https://www.markthubcrm.com.br/api/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"SuperAdmin@2024!"}' \
  | jq -r '.token')

echo "Token obtido: $TOKEN"
```

### 2. Acessar Dashboard

```bash
# Usar o token para acessar dashboard
curl -s https://www.markthubcrm.com.br/api/superadmin/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

### 3. Listar Tenants

```bash
# Listar todos os tenants
curl -s https://www.markthubcrm.com.br/api/superadmin/tenants \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

---

## 📞 SUPORTE

Se tiver problemas para acessar:

1. **Verificar servidor:**
   ```bash
   ping markthubcrm.com.br
   ```

2. **Verificar SSL:**
   ```bash
   curl -I https://www.markthubcrm.com.br/
   ```

3. **Consultar logs no servidor** (se tiver acesso SSH)

4. **Verificar variáveis de ambiente no servidor**

5. **Contatar administrador do sistema**

---

## ✅ CHECKLIST ANTES DE ACESSAR

- [ ] Site está no ar (https://www.markthubcrm.com.br/)
- [ ] Você tem as credenciais corretas
- [ ] Navegador atualizado
- [ ] Conexão estável com internet
- [ ] HTTPS está funcionando (cadeado verde)
- [ ] Link correto: `/super-admin/login` (não esquecer o hífen)

---

## 🎉 ACESSO BEM-SUCEDIDO

Após fazer login com sucesso, você verá:

```
╔═══════════════════════════════════════════════╗
║   Super Admin Dashboard - Markthub CRM        ║
║   www.markthubcrm.com.br                      ║
║                                               ║
║   📊 Tenants Ativos: 15                       ║
║   👥 Usuários Totais: 350                     ║
║   📦 Pedidos Hoje: 127                        ║
║   💰 Receita Mensal: R$ 45.280,00            ║
║                                               ║
║   Última atualização: Agora mesmo            ║
╚═══════════════════════════════════════════════╝
```

---

## 🚀 RESUMO RÁPIDO

```
═══════════════════════════════════════════════════════

🌐 LINK DE PRODUÇÃO:
   https://www.markthubcrm.com.br/super-admin/login

👤 CREDENCIAIS:
   Usuário: superadmin
   Senha:   SuperAdmin@2024!

⚠️  LEMBRETE:
   Altere a senha em produção por segurança!

═══════════════════════════════════════════════════════
```

---

**Site:** https://www.markthubcrm.com.br/
**Data:** $(date +%Y-%m-%d)
**Versão:** v2.1
**Status:** ✅ Em Produção
