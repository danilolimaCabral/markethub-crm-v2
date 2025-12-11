# Variáveis de Ambiente para Railway

## 🔧 Como Configurar:

1. Acesse seu projeto no Railway
2. Clique no serviço (app)
3. Vá em **Variables**
4. Adicione cada variável abaixo

---

## 📋 Variáveis Obrigatórias:

### **PostgreSQL (Banco de Dados)**
```
DATABASE_URL=postgresql://postgres:zyvEETScsIdamSKUQmbgCiglBPiayqlh@postgres.railway.internal:5432/railway
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=zyvEETScsIdamSKUQmbgCiglBPiayqlh
```

### **Aplicação**
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://seu-dominio.railway.app
```

### **JWT (Autenticação)**
```
JWT_SECRET=sua_chave_secreta_super_segura_aqui_min_32_caracteres
JWT_REFRESH_SECRET=outra_chave_secreta_diferente_para_refresh_token
```

### **Session**
```
SESSION_SECRET=chave_secreta_para_sessoes_min_32_caracteres
```

---

## 📋 Variáveis Opcionais (mas Recomendadas):

### **Mercado Livre (Integração)**
```
ML_CLIENT_ID=seu_app_id_do_mercado_livre
ML_CLIENT_SECRET=seu_client_secret_do_mercado_livre
ML_REDIRECT_URI=https://seu-dominio.railway.app/api/mercadolivre/callback
```

### **Stripe (Pagamentos)**
```
STRIPE_SECRET_KEY=sk_live_sua_chave_secreta_stripe
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_webhook
```

### **Redis (Cache - Opcional)**
```
REDIS_URL=redis://seu_redis_url
```

### **Sentry (Monitoramento - Opcional)**
```
SENTRY_DSN=https://sua_chave@sentry.io/projeto
```

---

## 🚀 Após Configurar:

1. **Salve todas as variáveis**
2. **Faça um redeploy** (Railway detecta automaticamente)
3. **Aguarde 3-5 minutos** para o deploy completar
4. **Teste o healthcheck**: `https://seu-dominio.railway.app/api/health`

---

## ⚠️ Importante:

- **Use a URL interna** (`postgres.railway.internal`) para melhor performance
- **JWT_SECRET** deve ter no mínimo 32 caracteres
- **Nunca commite** essas chaves no Git
- **Gere chaves seguras** para produção

---

## 🔐 Como Gerar Chaves Seguras:

Você pode gerar chaves aleatórias seguras com:

```bash
# No terminal (Linux/Mac)
openssl rand -base64 32

# Ou use um gerador online confiável
# https://randomkeygen.com/
```

---

## ✅ Checklist:

- [ ] PostgreSQL configurado (DATABASE_URL, DB_HOST, etc.)
- [ ] JWT_SECRET e JWT_REFRESH_SECRET configurados
- [ ] SESSION_SECRET configurado
- [ ] NODE_ENV=production
- [ ] PORT=5000
- [ ] FRONTEND_URL configurado
- [ ] (Opcional) Mercado Livre configurado
- [ ] (Opcional) Stripe configurado
- [ ] Redeploy feito
- [ ] Healthcheck testado

---

## 🆘 Troubleshooting:

### Se o deploy falhar:

1. **Verifique os logs** no Railway
2. **Confirme que DATABASE_URL está correto**
3. **Teste a conexão** com o banco
4. **Verifique se PORT=5000** está configurado

### Se o healthcheck falhar:

1. Acesse: `https://seu-dominio.railway.app/api/health`
2. Se retornar 404, verifique se o servidor iniciou
3. Veja os logs do Railway para erros

---

## 📞 Suporte:

Se precisar de ajuda, verifique:
- Logs do Railway
- Documentação do Railway: https://docs.railway.app
- Documentação do projeto: `/DOCUMENTACAO_COMPLETA.md`
