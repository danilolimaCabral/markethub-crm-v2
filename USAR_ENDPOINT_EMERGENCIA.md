# 🚨 Como Usar o Endpoint de Emergência

## ⚡ Solução Mais Rápida (Via API)

Após o deploy, você pode resetar a senha via API sem precisar acessar o banco de dados.

---

## 📡 Endpoint 1: Verificar Status do Usuário

**URL:** `https://www.markthubcrm.com.br/api/emergency/check-user/trueimportadosbr@icloud.com?secretKey=MARKTHUB_EMERGENCY_2024`

**Método:** GET

**Exemplo com curl:**

```bash
curl "https://www.markthubcrm.com.br/api/emergency/check-user/trueimportadosbr@icloud.com?secretKey=MARKTHUB_EMERGENCY_2024"
```

**Exemplo com navegador:**

Abra no navegador:
```
https://www.markthubcrm.com.br/api/emergency/check-user/trueimportadosbr@icloud.com?secretKey=MARKTHUB_EMERGENCY_2024
```

**Resposta esperada:**

```json
{
  "success": true,
  "user": {
    "id": 123,
    "username": "trueimportador",
    "email": "trueimportadosbr@icloud.com",
    "tenantId": 5,
    "tenantName": "TRUE IMPORTADOR BR COMERCIO LTDA",
    "role": "admin",
    "isActive": true,
    "passwordField": "password_hash",
    "createdAt": "2025-12-12T...",
    "updatedAt": "2025-12-12T..."
  }
}
```

**Interpretação:**
- `passwordField: "password_hash"` ✅ Correto
- `passwordField: "password"` ⚠️ Precisa migrar
- `passwordField: "none"` ❌ Sem senha!

---

## 🔧 Endpoint 2: Resetar Senha

**URL:** `https://www.markthubcrm.com.br/api/emergency/reset-password`

**Método:** POST

**Body (JSON):**

```json
{
  "email": "trueimportadosbr@icloud.com",
  "newPassword": "True@2024!",
  "secretKey": "MARKTHUB_EMERGENCY_2024"
}
```

### **Opção A: Via Postman/Insomnia**

1. Abra Postman ou Insomnia
2. Crie nova requisição POST
3. URL: `https://www.markthubcrm.com.br/api/emergency/reset-password`
4. Headers:
   ```
   Content-Type: application/json
   ```
5. Body (raw JSON):
   ```json
   {
     "email": "trueimportadosbr@icloud.com",
     "newPassword": "True@2024!",
     "secretKey": "MARKTHUB_EMERGENCY_2024"
   }
   ```
6. Enviar

### **Opção B: Via curl (Terminal)**

```bash
curl -X POST https://www.markthubcrm.com.br/api/emergency/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trueimportadosbr@icloud.com",
    "newPassword": "True@2024!",
    "secretKey": "MARKTHUB_EMERGENCY_2024"
  }'
```

### **Opção C: Via JavaScript (Console do Navegador)**

1. Abra `https://www.markthubcrm.com.br`
2. Pressione `F12` (DevTools)
3. Vá para aba **Console**
4. Cole e execute:

```javascript
fetch('https://www.markthubcrm.com.br/api/emergency/reset-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'trueimportadosbr@icloud.com',
    newPassword: 'True@2024!',
    secretKey: 'MARKTHUB_EMERGENCY_2024'
  })
})
.then(res => res.json())
.then(data => console.log('Resultado:', data))
.catch(err => console.error('Erro:', err));
```

**Resposta esperada:**

```json
{
  "success": true,
  "message": "Senha resetada com sucesso",
  "user": {
    "id": 123,
    "username": "trueimportador",
    "email": "trueimportadosbr@icloud.com",
    "isActive": true
  },
  "passwordHash": "$2b$10$..."
}
```

---

## ✅ Após Resetar a Senha

1. **Limpar cache:**
   - `Ctrl + Shift + Delete`
   - Marcar "Cookies" e "Cache"
   - Limpar

2. **Abrir aba anônima:**
   - `Ctrl + Shift + N` (Chrome/Edge)

3. **Fazer login:**
   ```
   URL: https://www.markthubcrm.com.br/login
   Email: trueimportadosbr@icloud.com
   Senha: True@2024!
   ```

4. **Deve funcionar!** ✅

---

## 🔒 Segurança

**Chave Secreta:** `MARKTHUB_EMERGENCY_2024`

Esta chave está hardcoded no código. Para produção, você pode:

1. **Alterar no arquivo:** `server/routes/emergency-reset.ts`
   ```typescript
   const EMERGENCY_SECRET = process.env.EMERGENCY_SECRET || 'SUA_CHAVE_AQUI';
   ```

2. **Definir variável de ambiente no Railway:**
   ```
   EMERGENCY_SECRET=sua_chave_super_secreta_aqui
   ```

3. **Remover endpoint após resolver:**
   - Comentar linha no `server/index.ts`:
   ```typescript
   // app.use("/api/emergency", emergencyResetRouter);
   ```

---

## 🐛 Possíveis Erros

### **Erro 403: Chave secreta inválida**

```json
{
  "success": false,
  "message": "Chave secreta inválida"
}
```

**Solução:** Verifique se `secretKey` está correto: `MARKTHUB_EMERGENCY_2024`

---

### **Erro 404: Usuário não encontrado**

```json
{
  "success": false,
  "message": "Usuário não encontrado"
}
```

**Solução:** Email está errado ou usuário não existe. Verifique no SQL:

```sql
SELECT email FROM users WHERE email LIKE '%true%';
```

---

### **Erro 500: Erro interno**

```json
{
  "success": false,
  "message": "Erro interno ao resetar senha",
  "error": "..."
}
```

**Solução:** Verificar logs do Railway:

```
Railway Dashboard
→ Deployments
→ Último deploy
→ View Logs
→ Procurar por "EMERGENCY RESET"
```

---

## 📊 Fluxo Completo

```
1. Deploy completou no Railway
   ↓
2. Verificar status do usuário (GET /check-user)
   ↓
3. Se passwordField != "password_hash":
   → Resetar senha (POST /reset-password)
   ↓
4. Limpar cache do navegador
   ↓
5. Fazer login em aba anônima
   ↓
6. ✅ SUCESSO!
```

---

## 🎯 Resumo

**Método mais rápido:**

1. Aguardar deploy completar (3-5 min)
2. Abrir console do navegador (F12)
3. Colar script JavaScript acima
4. Executar
5. Limpar cache
6. Fazer login

**Tempo total:** 5 minutos

---

**Data:** 12/12/2025  
**Status:** Endpoint criado e pronto para uso após deploy  
**Deploy:** Aguardando Railway processar commit 28e655a
