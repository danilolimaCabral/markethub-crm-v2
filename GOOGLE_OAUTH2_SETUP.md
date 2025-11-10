# Configuração Google OAuth2 - IA BRUNO CRM

## 📋 Pré-requisitos

1. Conta Google (Gmail)
2. Acesso ao Google Cloud Console

---

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Selecionar projeto"** → **"Novo projeto"**
3. Nome do projeto: **"IA BRUNO CRM"**
4. Clique em **"Criar"**

### 2. Ativar Google Identity Services

1. No menu lateral, vá em **"APIs e serviços"** → **"Biblioteca"**
2. Busque por **"Google Identity"**
3. Clique em **"Ativar"**

### 3. Configurar Tela de Consentimento OAuth

1. Vá em **"APIs e serviços"** → **"Tela de consentimento OAuth"**
2. Selecione **"Externo"** (para qualquer conta Google)
3. Clique em **"Criar"**

**Informações do app:**
- Nome do aplicativo: **IA BRUNO CRM**
- Email de suporte: seu-email@gmail.com
- Logo do aplicativo: (opcional)
- Domínio da página inicial: https://seu-dominio.com
- Domínio autorizado: seu-dominio.com

**Informações de contato do desenvolvedor:**
- Email: seu-email@gmail.com

4. Clique em **"Salvar e continuar"**

### 4. Adicionar Escopos (Scopes)

Na tela de **"Escopos"**, adicione:

- `email` - Ver seu endereço de e-mail
- `profile` - Ver suas informações pessoais básicas
- `openid` - Autenticar usando OpenID Connect

Clique em **"Salvar e continuar"**

### 5. Criar Credenciais OAuth 2.0

1. Vá em **"APIs e serviços"** → **"Credenciais"**
2. Clique em **"+ Criar credenciais"** → **"ID do cliente OAuth"**
3. Tipo de aplicativo: **"Aplicativo da Web"**
4. Nome: **"IA BRUNO CRM Web"**

**URIs de redirecionamento autorizados:**
```
http://localhost:3000
http://localhost:3000/callback
https://seu-dominio.com
https://seu-dominio.com/callback
```

5. Clique em **"Criar"**

### 6. Copiar Credenciais

Após criar, você verá:

- **Client ID:** `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-abc123def456`

**⚠️ IMPORTANTE:** Guarde essas credenciais em local seguro!

---

## 🔧 Configuração no CRM

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

**Nota:** Não é necessário adicionar Client Secret para aplicações client-side (JavaScript).

---

## 📝 Implementação no Código

### 1. Instalar Biblioteca

```bash
pnpm add @react-oauth/google
```

### 2. Configurar Provider

Em `App.tsx`:

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {/* Resto da aplicação */}
    </GoogleOAuthProvider>
  );
}
```

### 3. Adicionar Botão de Login

Em `Login.tsx`:

```tsx
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function Login() {
  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log('User:', decoded);
    
    // Salvar usuário no localStorage
    localStorage.setItem('ia_bruno_user', JSON.stringify({
      username: decoded.email,
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
      role: 'user'
    }));
    
    // Redirecionar para dashboard
    window.location.href = '/';
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => console.log('Login Failed')}
    />
  );
}
```

---

## 🔐 Dados Retornados pelo Google

Após login bem-sucedido, você recebe um JWT com:

```json
{
  "iss": "https://accounts.google.com",
  "sub": "1234567890",
  "email": "usuario@gmail.com",
  "email_verified": true,
  "name": "João Silva",
  "picture": "https://lh3.googleusercontent.com/...",
  "given_name": "João",
  "family_name": "Silva",
  "locale": "pt-BR"
}
```

---

## ✅ Checklist de Configuração

- [ ] Projeto criado no Google Cloud Console
- [ ] Google Identity Services ativado
- [ ] Tela de consentimento OAuth configurada
- [ ] Escopos adicionados (email, profile, openid)
- [ ] Credenciais OAuth 2.0 criadas
- [ ] URIs de redirecionamento configurados
- [ ] Client ID copiado
- [ ] Variável VITE_GOOGLE_CLIENT_ID adicionada ao .env
- [ ] Biblioteca @react-oauth/google instalada
- [ ] GoogleOAuthProvider configurado no App.tsx
- [ ] Botão GoogleLogin adicionado na tela de login
- [ ] Testado em localhost
- [ ] Testado em produção

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa:** URI de redirecionamento não está configurado no Google Cloud Console

**Solução:**
1. Vá em Google Cloud Console → Credenciais
2. Edite o OAuth Client ID
3. Adicione a URL exata em "URIs de redirecionamento autorizados"
4. Aguarde alguns minutos para propagar

### Erro: "idpiframe_initialization_failed"

**Causa:** Cookies de terceiros bloqueados ou extensões do navegador

**Solução:**
1. Desabilite extensões de bloqueio (AdBlock, Privacy Badger)
2. Habilite cookies de terceiros nas configurações do navegador
3. Teste em modo anônimo

### Erro: "popup_closed_by_user"

**Causa:** Usuário fechou popup antes de completar login

**Solução:**
- Adicionar mensagem explicativa antes de abrir popup
- Usar `ux_mode: 'redirect'` ao invés de popup

---

## 🔗 Links Úteis

- **Google Cloud Console:** https://console.cloud.google.com/
- **Documentação OAuth2:** https://developers.google.com/identity/protocols/oauth2
- **@react-oauth/google:** https://www.npmjs.com/package/@react-oauth/google
- **OAuth 2.0 Playground:** https://developers.google.com/oauthplayground/

---

**Data de Criação:** 07/11/2025
