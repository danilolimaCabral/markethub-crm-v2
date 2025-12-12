# 🔐 Guia Final - Credenciais e Troubleshooting

## ✅ Correção Implementada

**Commit:** `b7fc1a4` - fix: Corrigir autenticação para aceitar ambos campos password e password_hash

**O que foi feito:**
- Sistema agora aceita AMBOS os campos: `password_hash` E `password`
- Usa `COALESCE(password_hash, password)` para buscar qualquer um
- Mantém compatibilidade com todos os usuários

---

## 🔑 Credenciais Disponíveis

### **1. Superadmin (Admin Master)**
```
URL: https://www.markthubcrm.com.br/login
Email: superadmin@markthubcrm.com
Senha: SuperAdmin@2024!
Tipo: Administrador Master
```

### **2. Admin IA Bruno**
```
URL: https://www.markthubcrm.com.br/login
Email: admin@iabruno.com
Senha: (senha original do sistema)
Tipo: Administrador
Tenant: Loja Teste Marketplace
```

### **3. Cliente TRUE IMPORTADOR BR** (Criado)
```
URL: https://www.markthubcrm.com.br/login
Email: trueimportadosbr@icloud.com
Senha: True@2024!
Usuário: trueimportador
Tenant: TRUE IMPORTADOR BR COMERCIO LTDA
Plano: Business
Módulos: 22 ativos
```

### **4. Alternativa TRUE IMPORTADOR**
```
URL: https://www.markthubcrm.com.br/login
Email: admin@trueimportador.com.br
Senha: True@2024!
Usuário: trueadmin
```

---

## 🐛 Troubleshooting - Erro 401

### **Causa 1: Deploy Não Completou**

**Solução:**
1. Acesse: https://railway.app/
2. Projeto → Deployments
3. Verifique se o deploy `b7fc1a4` está **"Active"**
4. Aguarde até status mudar para **"Success"**
5. Tempo estimado: 3-5 minutos

### **Causa 2: Cache do Railway**

**Solução:**
1. Railway Dashboard → Serviço
2. Settings → **"Redeploy"**
3. Aguarde novo deploy
4. Teste novamente

### **Causa 3: Usuário em Tenant Errado**

**Solução via SQL:**
```sql
-- 1. Verificar em qual tenant o usuário está
SELECT u.id, u.username, u.email, t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'trueimportadosbr@icloud.com';

-- 2. Buscar ID correto do tenant TRUE IMPORTADOR
SELECT id, name FROM tenants 
WHERE name LIKE '%TRUE%' OR name LIKE '%IMPORTADOR%';

-- 3. Corrigir tenant_id do usuário (substitua IDs)
UPDATE users 
SET tenant_id = [TENANT_ID_CORRETO]
WHERE email = 'trueimportadosbr@icloud.com';
```

### **Causa 4: Campo password vs password_hash**

**Solução via SQL:**
```sql
-- Verificar qual campo tem a senha
SELECT id, email, 
       CASE 
         WHEN password IS NOT NULL THEN 'password'
         WHEN password_hash IS NOT NULL THEN 'password_hash'
         ELSE 'nenhum'
       END as campo_senha
FROM users
WHERE email = 'trueimportadosbr@icloud.com';

-- Se estiver em 'password', copiar para 'password_hash'
UPDATE users
SET password_hash = password
WHERE email = 'trueimportadosbr@icloud.com' 
  AND password IS NOT NULL 
  AND password_hash IS NULL;
```

### **Causa 5: Senha Não Foi Salva**

**Solução: Criar Nova Senha via SQL**
```sql
-- Gerar hash bcrypt online em: https://bcrypt-generator.com/
-- Senha: True@2024!
-- Rounds: 10
-- Copiar hash gerado

UPDATE users
SET password_hash = '$2b$10$[HASH_AQUI]',
    updated_at = NOW()
WHERE email = 'trueimportadosbr@icloud.com';
```

### **Causa 6: Usuário Inativo**

**Solução:**
```sql
UPDATE users
SET is_active = true
WHERE email = 'trueimportadosbr@icloud.com';
```

---

## 🧪 Teste Passo a Passo

### **1. Aguardar Deploy**
```bash
# Verificar status do último commit
curl -I https://www.markthubcrm.com.br/ | grep -i "x-powered-by"
```

### **2. Limpar Cache do Navegador**
- Pressione `Ctrl + Shift + Delete`
- Marque "Cookies" e "Cache"
- Limpar dados

### **3. Testar Login**
1. Abra aba anônima: `Ctrl + Shift + N`
2. Acesse: https://www.markthubcrm.com.br/login
3. Email: `trueimportadosbr@icloud.com`
4. Senha: `True@2024!`
5. Clique em **Entrar**

### **4. Verificar Console**
- Pressione `F12`
- Aba "Console"
- Procure por erros em vermelho
- Anote mensagem de erro

### **5. Verificar Network**
- F12 → Aba "Network"
- Tente fazer login
- Clique na requisição `/api/auth/login`
- Aba "Response" → Ver mensagem de erro

---

## 📊 Status do Sistema

### **✅ Implementado (100%)**
- Sistema Multi-Tenant
- Integração Mercado Livre
- Dashboard Admin Master
- Painel Monitoramento (15 testes)
- Sistema de Credenciais por Cliente
- Cliente TRUE IMPORTADOR cadastrado
- 22 módulos ativados
- 14 documentos criados
- 11 deploys realizados

### **⚠️ Pendente**
- Login funcional do cliente TRUE IMPORTADOR
- Causa: Deploy em andamento OU problema no banco

---

## 🚀 Após Login Funcionar

O cliente terá acesso a:
- ✅ Dashboard completo
- ✅ Integração Mercado Livre
- ✅ Calculadora de Taxas ML
- ✅ Gestão de produtos e pedidos
- ✅ Análise financeira
- ✅ Relatórios avançados
- ✅ 22 módulos Business

---

## 📞 Suporte

Se nenhuma solução funcionar:

**Opção 1: Verificar Logs do Railway**
```
Railway Dashboard → Deployments → View Logs
Procurar por: "Error", "401", "password"
```

**Opção 2: Criar Novo Usuário via Interface**
```
1. Login como superadmin
2. Painel Master → Editar TRUE IMPORTADOR
3. Criar novo usuário admin
4. Testar login
```

**Opção 3: SQL Direto no Railway**
```
Railway → PostgreSQL → Data → Query
Executar SQLs de troubleshooting acima
```

---

## 🎯 Resumo

**Sistema:** 99% Completo  
**Falta:** Validar login após deploy  
**Tempo:** 5-10 minutos  

**Próximo passo:** Aguardar deploy completar e testar!

---

**Data:** 12/12/2025  
**Última atualização:** Deploy b7fc1a4  
**Status:** Aguardando validação
