# 📧 Configuração de Email para Recuperação de Senha

## ✅ Funcionalidade Implementada

O sistema agora possui **recuperação de senha completa** com envio de email!

### O Que Foi Implementado

✅ **Rota de solicitação:** `POST /api/auth/forgot-password`  
✅ **Rota de reset:** `POST /api/auth/reset-password`  
✅ **Template de email profissional** com design responsivo  
✅ **Tokens seguros** com hash SHA256 e expiração de 1 hora  
✅ **Tabela no banco:** `password_reset_tokens`  
✅ **Limpeza automática** de tokens expirados  

---

## 🔧 Configuração Necessária

Para o envio de emails funcionar, você precisa configurar as variáveis de ambiente no Railway.

### Opção 1: Gmail (Recomendado para Testes)

1. **Acesse:** https://railway.app/
2. **Vá em:** Projeto → Variables
3. **Adicione as variáveis:**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM=MarketHub CRM <noreply@markethubcrm.com.br>
APP_URL=https://www.markthubcrm.com.br
```

#### Como Obter Senha de App do Gmail:

1. Acesse https://myaccount.google.com/security
2. Ative "Verificação em duas etapas"
3. Vá em "Senhas de app"
4. Gere uma senha para "Outro (nome personalizado)"
5. Use essa senha em `EMAIL_PASS`

### Opção 2: SendGrid (Recomendado para Produção)

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=sua-api-key-aqui
EMAIL_FROM=MarketHub CRM <noreply@markethubcrm.com.br>
APP_URL=https://www.markthubcrm.com.br
```

#### Como Obter API Key do SendGrid:

1. Crie conta em https://sendgrid.com/
2. Vá em Settings → API Keys
3. Crie nova API Key com permissão de envio
4. Copie a key (ela aparece apenas uma vez!)

### Opção 3: Mailgun

```env
EMAIL_PROVIDER=mailgun
MAILGUN_USER=postmaster@seu-dominio.mailgun.org
MAILGUN_PASSWORD=sua-senha-mailgun
EMAIL_FROM=MarketHub CRM <noreply@markethubcrm.com.br>
APP_URL=https://www.markthubcrm.com.br
```

### Opção 4: SMTP Personalizado

```env
SMTP_HOST=smtp.seuservidor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-usuario
SMTP_PASSWORD=sua-senha
EMAIL_FROM=MarketHub CRM <noreply@markethubcrm.com.br>
APP_URL=https://www.markthubcrm.com.br
```

---

## 🧪 Como Testar

### 1. Testar Solicitação de Reset

```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"correiodojeferson@gmail.com"}'
```

**Resposta esperada:**
```json
{
  "message": "Se o email existir, você receberá instruções para recuperar sua senha"
}
```

**O que acontece:**
1. ✅ Sistema gera token único
2. ✅ Salva token no banco (hash SHA256)
3. ✅ Envia email com link de reset
4. ✅ Token expira em 1 hora

### 2. Verificar Email Recebido

O usuário receberá um email com:
- ✅ Design profissional (gradiente roxo)
- ✅ Botão "Redefinir Senha"
- ✅ Link alternativo para copiar
- ✅ Aviso de expiração (1 hora)

### 3. Testar Reset de Senha

```bash
curl -X POST https://www.markthubcrm.com.br/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"TOKEN_DO_EMAIL_AQUI",
    "newPassword":"NovaSenha@123"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Senha alterada com sucesso! Você já pode fazer login com a nova senha"
}
```

---

## 🔒 Segurança

### Medidas Implementadas

✅ **Tokens únicos** - Gerados com crypto.randomBytes(32)  
✅ **Hash seguro** - SHA256 antes de salvar no banco  
✅ **Expiração** - Tokens válidos por apenas 1 hora  
✅ **Uso único** - Token deletado após uso  
✅ **Rate limiting** - Proteção contra spam  
✅ **Resposta genérica** - Não revela se email existe  
✅ **Senha forte** - Mínimo 8 caracteres  
✅ **Bcrypt** - Senha criptografada com bcrypt (10 rounds)  

---

## 📊 Estrutura do Banco

### Tabela: `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP
);
```

### Índices Criados

- `idx_password_reset_tokens_token_hash` - Busca rápida por token
- `idx_password_reset_tokens_user_id` - Busca por usuário
- `idx_password_reset_tokens_expires_at` - Limpeza de expirados

### Função de Limpeza

```sql
SELECT cleanup_expired_reset_tokens();
```

---

## 🎨 Template de Email

O email enviado possui:

- **Design responsivo** - Funciona em mobile e desktop
- **Gradiente moderno** - Roxo (#667eea) para (#764ba2)
- **Botão destacado** - Call-to-action claro
- **Link alternativo** - Para copiar manualmente
- **Aviso de segurança** - Expiração e instruções
- **Footer profissional** - Copyright e aviso automático

---

## 🚀 Fluxo Completo

```
1. Usuário clica "Esqueci minha senha"
         ↓
2. Digita email e envia
         ↓
3. Backend gera token único
         ↓
4. Salva hash do token no banco
         ↓
5. Envia email com link
         ↓
6. Usuário clica no link
         ↓
7. Frontend abre página de reset
         ↓
8. Usuário digita nova senha
         ↓
9. Backend valida token
         ↓
10. Atualiza senha (bcrypt)
         ↓
11. Deleta token usado
         ↓
12. Usuário faz login com nova senha ✅
```

---

## ⚠️ Troubleshooting

### Email não está sendo enviado

1. **Verifique variáveis de ambiente** no Railway
2. **Veja os logs:** `railway logs | grep email`
3. **Teste conexão SMTP** manualmente
4. **Verifique senha de app** do Gmail (não é a senha normal!)

### Token inválido ou expirado

1. **Verifique se passou 1 hora** desde o envio
2. **Não reutilize tokens** - cada um funciona apenas uma vez
3. **Solicite novo token** se necessário

### Email cai no spam

1. **Configure SPF/DKIM** no seu domínio
2. **Use SendGrid** ou Mailgun (melhor deliverability)
3. **Verifique remetente** (EMAIL_FROM)

---

## 📞 Próximos Passos

1. ✅ **Configure variáveis de ambiente** no Railway
2. ✅ **Teste com email real**
3. ✅ **Verifique se email chega**
4. ✅ **Teste reset de senha**
5. ✅ **Faça login com nova senha**

---

## 🎯 Resumo

**Status:** ✅ Implementado e funcionando  
**Tabela:** ✅ Criada no banco  
**Rotas:** ✅ Funcionando  
**Email:** ⏳ Aguardando configuração  
**Segurança:** ✅ Tokens seguros com expiração  

**Falta apenas:** Configurar variáveis de email no Railway!

---

**Após configurar, o sistema estará 100% funcional!** 🎉
