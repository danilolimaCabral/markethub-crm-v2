# 🔐 GUIA COMPLETO DE AUTENTICAÇÃO - Markethub CRM

**Data:** 13/11/2025  
**Sistema:** Markethub CRM v2.1  
**Tipo:** JWT + 2FA  

---

## 🎯 COMO FAZER AUTENTICAÇÃO

### Opção 1: Via Interface Web (Mais Fácil) ⭐

#### 1.1 Login Usuário Normal

```
1. Acesse: https://www.markthubcrm.com.br/login

2. Digite:
   Email: seu-email@exemplo.com
   Senha: sua-senha

3. Clique em "Entrar"

4. Se tiver 2FA ativado:
   - Digite o código do Google Authenticator
   - Clique em "Verificar"

5. Pronto! Você está logado ✅
```

#### 1.2 Login Super Admin

```
1. Acesse: https://www.markthubcrm.com.br/super-admin

2. Digite:
   Usuário: superadmin
   Senha: SuperAdmin@2024!

3. Clique em "Entrar"

4. Pronto! Acesso total ao sistema ✅
```

---

## 🔧 Opção 2: Via API (Para Desenvolvedores)

### 2.1 Login Simples (Usuário/Senha)

#### Requisição:
```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "password": "sua-senha"
  }'
```

#### Resposta com Sucesso:
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": "uuid-do-usuario",
    "email": "seu-email@exemplo.com",
    "full_name": "Seu Nome",
    "username": "seu-usuario",
    "role": "user",
    "tenant_id": "uuid-do-tenant"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m"
}
```

#### Usar o Token:
```bash
# Salvar o token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Usar em requisições
curl -X GET https://www.markthubcrm.com.br/api/produtos \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2.2 Login com 2FA (Autenticação em Dois Fatores)

Se o usuário tem 2FA ativado:

#### Passo 1: Login Inicial
```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

#### Resposta (Requer 2FA):
```json
{
  "requires_2fa": true,
  "temp_token": "token-temporario-aqui",
  "message": "Por favor, insira o código do seu aplicativo autenticador"
}
```

#### Passo 2: Verificar Código 2FA
```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token-temporario-aqui" \
  -d '{
    "code": "123456"
  }'
```

#### Resposta Final:
```json
{
  "message": "Autenticação completa",
  "user": { ... },
  "accessToken": "token-completo-aqui",
  "refreshToken": "refresh-token-aqui",
  "expiresIn": "15m"
}
```

---

## 📝 Opção 3: Criar Nova Conta (Cadastro)

### Via Interface Web:
```
1. Acesse: https://www.markthubcrm.com.br/cadastro

2. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 8 caracteres)
   - Confirmar senha

3. Clique em "Criar Conta"

4. Você será logado automaticamente ✅
```

### Via API:
```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo-usuario@exemplo.com",
    "password": "SenhaForte@123",
    "full_name": "Nome Completo",
    "username": "nome-usuario"
  }'
```

#### Resposta:
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "novo-uuid",
    "email": "novo-usuario@exemplo.com",
    "full_name": "Nome Completo",
    "username": "nome-usuario",
    "role": "user",
    "tenant_id": "uuid-tenant",
    "created_at": "2025-11-13T20:15:00Z"
  },
  "accessToken": "token-aqui",
  "refreshToken": "refresh-token-aqui",
  "expiresIn": "15m"
}
```

---

## 🔄 Renovar Token (Refresh)

Tokens expiram em 15 minutos. Para renovar sem fazer login novamente:

```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "seu-refresh-token-aqui"
  }'
```

#### Resposta:
```json
{
  "accessToken": "novo-token-aqui",
  "expiresIn": "15m"
}
```

---

## 👤 Obter Dados do Usuário Logado

```bash
curl -X GET https://www.markthubcrm.com.br/api/auth/me \
  -H "Authorization: Bearer seu-token-aqui"
```

#### Resposta:
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "full_name": "Nome do Usuário",
    "username": "usuario",
    "role": "user",
    "tenant_id": "uuid-tenant",
    "is_active": true,
    "two_factor_enabled": false,
    "created_at": "2025-01-01T00:00:00Z",
    "last_login_at": "2025-11-13T20:00:00Z"
  }
}
```

---

## 🚪 Fazer Logout

```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/logout \
  -H "Authorization: Bearer seu-token-aqui"
```

#### Resposta:
```json
{
  "message": "Logout realizado com sucesso"
}
```

**Importante:** Após logout, descarte o token no cliente!

---

## 🔐 Configurar 2FA (Autenticação em Dois Fatores)

### Passo 1: Gerar QR Code

```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/2fa/setup \
  -H "Authorization: Bearer seu-token-aqui"
```

#### Resposta:
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauth_url": "otpauth://totp/Markethub:usuario@exemplo.com?secret=JBSWY..."
}
```

### Passo 2: Escanear QR Code
- Abra Google Authenticator ou similar
- Escaneie o QR Code
- O app gerará códigos de 6 dígitos

### Passo 3: Ativar 2FA

```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/2fa/enable \
  -H "Authorization: Bearer seu-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

#### Resposta:
```json
{
  "message": "2FA ativado com sucesso",
  "two_factor_enabled": true
}
```

---

## 🔑 Alterar Senha

```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/change-password \
  -H "Authorization: Bearer seu-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "senha-atual",
    "newPassword": "nova-senha-forte@123"
  }'
```

#### Resposta:
```json
{
  "message": "Senha alterada com sucesso"
}
```

---

## 🆘 Recuperar Senha (Esqueci Minha Senha)

### Passo 1: Solicitar Recuperação

```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com"
  }'
```

#### Resposta:
```json
{
  "message": "Se o email existir, você receberá instruções para recuperar sua senha"
}
```

**Nota:** Email com link de recuperação será enviado (se SMTP estiver configurado)

---

## 🎭 Exemplos Práticos

### Exemplo 1: Login e Buscar Produtos

```bash
#!/bin/bash

# 1. Fazer login
RESPONSE=$(curl -s -X POST https://www.markthubcrm.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@markethub.com",
    "password": "senha123"
  }')

# 2. Extrair token
TOKEN=$(echo $RESPONSE | jq -r '.accessToken')

echo "Token obtido: $TOKEN"

# 3. Buscar produtos
curl -X GET https://www.markthubcrm.com.br/api/produtos \
  -H "Authorization: Bearer $TOKEN"
```

### Exemplo 2: Login com JavaScript (Frontend)

```javascript
// Login
async function login(email, password) {
  const response = await fetch('https://www.markthubcrm.com.br/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (response.ok) {
    // Salvar tokens no localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    console.log('Login realizado com sucesso!');
    return data;
  } else {
    throw new Error(data.error || 'Erro ao fazer login');
  }
}

// Usar token em requisições
async function buscarProdutos() {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('https://www.markthubcrm.com.br/api/produtos', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

// Renovar token automaticamente
async function renovarToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('https://www.markthubcrm.com.br/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  }
}

// Interceptor para renovar token automaticamente
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expirado, tentar renovar
      try {
        const newToken = await renovarToken();
        // Repetir requisição com novo token
        error.config.headers['Authorization'] = `Bearer ${newToken}`;
        return axios.request(error.config);
      } catch (e) {
        // Refresh token também expirou, fazer logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Usar
login('admin@markethub.com', 'senha123')
  .then(data => {
    console.log('Usuário logado:', data.user);
    return buscarProdutos();
  })
  .then(produtos => {
    console.log('Produtos:', produtos);
  })
  .catch(error => {
    console.error('Erro:', error);
  });
```

### Exemplo 3: Login com Python

```python
import requests
import json

# Configuração
BASE_URL = "https://www.markthubcrm.com.br/api"

class MarkethubAuth:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user = None
    
    def login(self, email, password):
        """Fazer login e salvar tokens"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": email,
                "password": password
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data['accessToken']
            self.refresh_token = data['refreshToken']
            self.user = data['user']
            print(f"Login realizado! Bem-vindo, {self.user['full_name']}")
            return True
        else:
            print(f"Erro no login: {response.json()}")
            return False
    
    def get_headers(self):
        """Retorna headers com token"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def buscar_produtos(self):
        """Buscar produtos (exemplo de uso)"""
        response = requests.get(
            f"{BASE_URL}/produtos",
            headers=self.get_headers()
        )
        return response.json()
    
    def renovar_token(self):
        """Renovar access token"""
        response = requests.post(
            f"{BASE_URL}/auth/refresh",
            json={"refreshToken": self.refresh_token}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data['accessToken']
            return True
        return False

# Usar
auth = MarkethubAuth()

# Login
if auth.login("admin@markethub.com", "senha123"):
    # Buscar produtos
    produtos = auth.buscar_produtos()
    print(f"Total de produtos: {len(produtos)}")
    
    # Renovar token (se necessário)
    auth.renovar_token()
```

---

## 🔒 Segurança e Boas Práticas

### ✅ O QUE FAZER:

1. **SEMPRE usar HTTPS**
   ```
   ✅ https://www.markthubcrm.com.br
   ❌ http://www.markthubcrm.com.br
   ```

2. **Salvar tokens de forma segura**
   - Browser: `localStorage` ou `sessionStorage`
   - Mobile: Keychain/Keystore
   - Backend: Variáveis de ambiente

3. **Verificar expiração do token**
   ```javascript
   // Decodificar JWT e verificar exp
   const tokenData = jwt_decode(token);
   const isExpired = tokenData.exp < Date.now() / 1000;
   ```

4. **Renovar token antes de expirar**
   ```javascript
   // Renovar 2 minutos antes de expirar
   setTimeout(renovarToken, 13 * 60 * 1000);
   ```

5. **Limpar tokens no logout**
   ```javascript
   localStorage.removeItem('accessToken');
   localStorage.removeItem('refreshToken');
   localStorage.removeItem('user');
   ```

### ❌ O QUE NÃO FAZER:

1. **Nunca expor tokens em URLs**
   ```
   ❌ https://site.com/api?token=xyz
   ✅ Authorization: Bearer xyz
   ```

2. **Não salvar senhas**
   ```javascript
   ❌ localStorage.setItem('password', senha)
   ✅ Apenas tokens
   ```

3. **Não compartilhar tokens**
   - Cada usuário tem seu próprio token
   - Tokens são pessoais e intransferíveis

4. **Não usar token após logout**
   - Tokens devem ser descartados
   - Fazer novo login se necessário

---

## 🚨 Tratamento de Erros

### Erros Comuns:

#### 401 Unauthorized
```json
{
  "error": "Email ou senha incorretos",
  "code": "INVALID_CREDENTIALS"
}
```
**Solução:** Verificar email e senha

#### 403 Forbidden
```json
{
  "error": "Usuário inativo",
  "code": "USER_INACTIVE"
}
```
**Solução:** Contatar administrador

#### 429 Too Many Requests
```json
{
  "error": "Muitas tentativas de login",
  "code": "RATE_LIMIT_EXCEEDED"
}
```
**Solução:** Aguardar alguns minutos

#### Token Expirado
```json
{
  "error": "Token expirado",
  "code": "TOKEN_EXPIRED"
}
```
**Solução:** Usar refresh token ou fazer login novamente

---

## 📚 Credenciais de Teste

### Super Admin (Acesso Total)
```
URL: https://www.markthubcrm.com.br/super-admin
Usuário: superadmin
Senha: SuperAdmin@2024!
```

### Usuário de Teste (Se configurado)
```
URL: https://www.markthubcrm.com.br/login
Email: teste@markethub.com.br
Senha: Teste@123
```

---

## 🎯 Fluxograma de Autenticação

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  1. Usuário acessa /login                      │
│     ↓                                           │
│  2. Envia email + senha                        │
│     ↓                                           │
│  3. Sistema valida credenciais                 │
│     ├─ ❌ Inválido → Erro 401                  │
│     └─ ✅ Válido                               │
│         ↓                                       │
│  4. Tem 2FA ativado?                           │
│     ├─ SIM → Solicita código 2FA               │
│     │   ↓                                       │
│     │   Valida código → Token completo         │
│     │                                           │
│     └─ NÃO → Retorna token diretamente         │
│         ↓                                       │
│  5. Cliente salva accessToken + refreshToken   │
│     ↓                                           │
│  6. Usa token em todas as requisições          │
│     ↓                                           │
│  7. Token expira após 15 min                   │
│     ↓                                           │
│  8. Renova com refreshToken                    │
│     ou faz novo login                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Frontend
- [ ] Tela de login funcionando
- [ ] Salvar tokens no localStorage
- [ ] Interceptor para adicionar token nas requisições
- [ ] Renovação automática de token
- [ ] Redirecionamento após login
- [ ] Logout limpa tokens
- [ ] Tratamento de erros

### Backend/API
- [ ] Endpoint de login funcional
- [ ] Geração de JWT
- [ ] Validação de tokens
- [ ] Refresh token funcionando
- [ ] Rate limiting configurado
- [ ] 2FA implementado
- [ ] Logs de autenticação

---

**Pronto! Agora você sabe como fazer autenticação no Markethub CRM!** 🎉

