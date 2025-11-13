# 🔧 CORREÇÕES URGENTES - Markethub CRM v2.1

**Data:** $(date +%Y-%m-%d)  
**Prioridade:** CRÍTICA  
**Tempo estimado:** 30-60 minutos  

---

## 🔴 BUG CRÍTICO #001 - Servidor não inicia sem Stripe

### Problema
O servidor lança exceção e não inicia se `STRIPE_SECRET_KEY` não estiver configurada no .env:
```
Error: Neither apiKey nor config.authenticator provided
```

### Impacto
- 🔴 **Crítico:** Sistema não funciona em ambiente de desenvolvimento/staging
- 🔴 **Bloqueante:** Impede testes e deploy

### Solução

#### 1. Modificar `server/config/stripe.ts`

**Arquivo atual (problemático):**
```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-18.acacia',
});
```

**Arquivo corrigido:**
```typescript
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeKey 
  ? new Stripe(stripeKey, { 
      apiVersion: '2025-02-18.acacia' 
    })
  : null;

export const isStripeConfigured = !!stripeKey;

// Log de aviso se não estiver configurado
if (!isStripeConfigured) {
  console.warn('⚠️  Stripe não configurado. Configure STRIPE_SECRET_KEY no .env para habilitar pagamentos.');
}
```

#### 2. Modificar `server/routes/payments.ts`

**Adicionar verificação no início de cada rota:**
```typescript
import { stripe, isStripeConfigured } from '../config/stripe';

// Middleware de verificação
function checkStripeConfig(req: Request, res: Response, next: NextFunction) {
  if (!isStripeConfigured) {
    return res.status(503).json({
      error: 'Payment processing is not configured',
      code: 'STRIPE_NOT_CONFIGURED',
      message: 'Stripe is not configured on the server. Please contact support.'
    });
  }
  next();
}

// Aplicar middleware em todas as rotas
router.use(checkStripeConfig);

// OU aplicar individualmente:
router.post('/create-payment-intent', checkStripeConfig, async (req, res) => {
  // ...
});
```

---

## 🟡 CONFIGURAÇÕES OPCIONAIS RECOMENDADAS

### 1. Criar `.env.example` completo

```bash
# ============================================
# MARKETHUB CRM - ENVIRONMENT VARIABLES
# ============================================

# ===================
# DATABASE
# ===================
DATABASE_URL=postgresql://user:password@localhost:5432/markethub
DB_NAME=markethub
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# ===================
# JWT & SECURITY
# ===================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ===================
# SERVER
# ===================
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# ===================
# MERCADO LIVRE (OBRIGATÓRIO para integração)
# ===================
ML_CLIENT_ID=your-ml-client-id
ML_CLIENT_SECRET=your-ml-client-secret
ML_REDIRECT_URI=http://localhost:3000/api/integrations/mercadolivre/callback

# ===================
# STRIPE (OPCIONAL - Pagamentos)
# ===================
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# ===================
# ASAAS (OPCIONAL - Pagamentos Brasil)
# ===================
# ASAAS_API_KEY=your-asaas-api-key

# ===================
# GOOGLE GEMINI AI (OPCIONAL)
# ===================
# GEMINI_API_KEY=your-gemini-api-key

# ===================
# SENTRY (OPCIONAL - Monitoring)
# ===================
# SENTRY_DSN=https://xxx@sentry.io/xxx
# SENTRY_ENVIRONMENT=development

# ===================
# REDIS (OPCIONAL - Cache)
# ===================
# REDIS_URL=redis://localhost:6379

# ===================
# AWS S3 (OPCIONAL - Storage)
# ===================
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your-bucket-name

# ===================
# SMTP (OPCIONAL - Emails)
# ===================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# ===================
# OUTROS MARKETPLACES (OPCIONAL)
# ===================
# AMAZON_SELLER_ID=
# AMAZON_SP_API_CLIENT_ID=
# AMAZON_SP_API_CLIENT_SECRET=
# AMAZON_SP_API_REFRESH_TOKEN=

# SHOPEE_PARTNER_ID=
# SHOPEE_PARTNER_KEY=
# SHOPEE_SHOP_ID=

# ===================
# ERPs (OPCIONAL)
# ===================
# BLING_API_KEY=
# OMIE_APP_KEY=
# OMIE_APP_SECRET=
# TINY_API_TOKEN=

# ===================
# SUPER ADMIN (PRÉ-CONFIGURADO)
# ===================
# SUPER_ADMIN_EMAIL=superadmin
# SUPER_ADMIN_PASSWORD=SuperAdmin@2024!
```

### 2. Adicionar validação flexível em `scripts/validate-env.ts`

```typescript
// Modificar para separar variáveis obrigatórias e opcionais
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const OPTIONAL_VARS = {
  'STRIPE_SECRET_KEY': 'Pagamentos via Stripe',
  'ML_CLIENT_ID': 'Integração Mercado Livre',
  'REDIS_URL': 'Cache Redis',
  'SMTP_HOST': 'Envio de emails',
  'GEMINI_API_KEY': 'Assistente IA',
};

// Logar warnings para opcionais não configurados
Object.entries(OPTIONAL_VARS).forEach(([key, description]) => {
  if (!process.env[key]) {
    console.warn(`⚠️  ${key} não configurado - ${description} desabilitado`);
  }
});
```

---

## 📋 CHECKLIST DE CORREÇÕES

### Imediatas (30 minutos)
- [ ] Modificar `server/config/stripe.ts` com verificação null
- [ ] Adicionar middleware `checkStripeConfig` em `server/routes/payments.ts`
- [ ] Testar servidor iniciando sem `STRIPE_SECRET_KEY`
- [ ] Testar rotas de pagamento retornando 503

### Curto Prazo (2 horas)
- [ ] Criar `.env.example` completo
- [ ] Atualizar `scripts/validate-env.ts` com separação obrigatório/opcional
- [ ] Documentar em README as variáveis obrigatórias vs opcionais
- [ ] Adicionar seção de troubleshooting em GUIA_INSTALACAO.md

### Médio Prazo (1 semana)
- [ ] Aplicar mesmo padrão para SMTP (não quebrar sem configuração)
- [ ] Aplicar mesmo padrão para S3 (não quebrar sem configuração)
- [ ] Criar página de configuração no Super Admin mostrando integrações ativas
- [ ] Adicionar health check mostrando quais integrações estão configuradas

---

## 🧪 TESTES DE VALIDAÇÃO

Após aplicar as correções, executar:

### 1. Teste sem Stripe
```bash
# Remover STRIPE_SECRET_KEY do .env
unset STRIPE_SECRET_KEY
# ou comentar no .env

# Iniciar servidor
pnpm build && pnpm start

# Deve iniciar sem erros, apenas warning
# Esperado: "⚠️  Stripe não configurado..."
```

### 2. Teste de rota de pagamento sem Stripe
```bash
curl -X POST http://localhost:3000/api/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"amount": 1000}'

# Esperado: Status 503
# {
#   "error": "Payment processing is not configured",
#   "code": "STRIPE_NOT_CONFIGURED"
# }
```

### 3. Teste com Stripe configurado
```bash
# Adicionar STRIPE_SECRET_KEY no .env
export STRIPE_SECRET_KEY=sk_test_xxx

# Reiniciar servidor
pnpm build && pnpm start

# Testar rota de pagamento novamente
# Deve funcionar normalmente
```

---

## 📊 IMPACTO DAS CORREÇÕES

### Antes
- ❌ Servidor não inicia sem Stripe
- ❌ Impossível testar outros módulos
- ❌ Bloqueio total de desenvolvimento

### Depois
- ✅ Servidor inicia normalmente
- ✅ Módulos core funcionam independentemente
- ✅ Integrações opcionais são tratadas gracefully
- ✅ Mensagens claras sobre o que está/não está configurado

---

## 💡 BOAS PRÁTICAS APLICADAS

1. **Fail Gracefully:** Sistema não quebra por funcionalidades opcionais
2. **Clear Feedback:** Logs informativos sobre configurações faltantes
3. **User-Friendly Errors:** APIs retornam erros claros (503 + mensagem)
4. **Environment Flexibility:** Sistema adaptável a diferentes ambientes
5. **Progressive Enhancement:** Core funciona, features adicionais são opt-in

---

**Status:** PRONTO PARA APLICAÇÃO  
**Risco:** BAIXO  
**Impacto:** ALTO  
**Recomendação:** APLICAR IMEDIATAMENTE  

---
