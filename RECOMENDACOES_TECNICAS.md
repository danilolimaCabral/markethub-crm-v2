# 🔧 Recomendações Técnicas - Markthub CRM

## 📋 Índice

1. [Testes Automatizados](#testes-automatizados)
2. [Monitoramento e Observabilidade](#monitoramento-e-observabilidade)
3. [Performance e Otimização](#performance-e-otimização)
4. [Segurança](#segurança)
5. [CI/CD](#cicd)
6. [Integrações](#integrações)

---

## 🧪 Testes Automatizados

### Situação Atual
- Testes básicos em `test-automation.html` (31 testes, 97% sucesso)
- Vitest instalado mas não configurado
- Sem testes unitários/integração/E2E

### Implementação Recomendada

#### 1. Configurar Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});
```

#### 2. Estrutura de Testes

```
test/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── lib/
├── integration/
│   ├── api/
│   └── database/
├── e2e/
│   └── flows/
└── setup.ts
```

#### 3. Exemplos de Testes

**Teste Unitário - Componente:**
```typescript
// test/unit/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';

describe('ProductCard', () => {
  it('should render product name', () => {
    const product = { id: '1', name: 'Produto Teste', price: 99.90 };
    render(<ProductCard product={product} />);
    expect(screen.getByText('Produto Teste')).toBeInTheDocument();
  });
});
```

**Teste de Integração - API:**
```typescript
// test/integration/api/products.test.ts
import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers';

describe('Products API', () => {
  it('should create a product', async () => {
    const server = createTestServer();
    const response = await server.post('/api/produtos', {
      name: 'Test Product',
      price: 99.90
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

**Teste E2E - Playwright:**
```typescript
// test/e2e/flows/login.test.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

#### 4. Scripts package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:all": "pnpm test && pnpm test:e2e"
  }
}
```

---

## 📊 Monitoramento e Observabilidade

### Situação Atual
- Apenas health check básico (`/api/health`)
- Sem logging estruturado
- Sem métricas/alertas

### Implementação Recomendada

#### 1. Logging Estruturado (Winston)

```typescript
// server/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'markethub-crm' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### 2. Métricas (Prometheus)

```typescript
// server/lib/metrics.ts
import client from 'prom-client';

export const register = new client.Registry();

// Métricas customizadas
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(databaseQueryDuration);
```

#### 3. Rastreamento de Erros (Sentry)

```typescript
// server/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Middleware de erro
app.use(Sentry.Handlers.errorHandler());
```

#### 4. Dashboard (Grafana)

Configurar dashboard com:
- Taxa de requisições por minuto
- Latência média/p95/p99
- Taxa de erro por endpoint
- Uso de CPU/memória
- Métricas de banco de dados

---

## ⚡ Performance e Otimização

### 1. Cache com Redis

```typescript
// server/lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  }
};
```

**Uso em rotas:**
```typescript
app.get('/api/produtos', async (req, res) => {
  const cacheKey = `products:${req.user.tenant_id}`;
  let products = await cache.get(cacheKey);
  
  if (!products) {
    products = await db.query('SELECT * FROM products WHERE tenant_id = $1', 
      [req.user.tenant_id]);
    await cache.set(cacheKey, products, 300); // 5 minutos
  }
  
  res.json(products);
});
```

### 2. CDN para Assets

```nginx
# nginx.conf
location /static/ {
    alias /var/www/markethub/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
```

### 3. Lazy Loading de Componentes

```typescript
// client/src/App.tsx
import { lazy, Suspense } from 'react';

const DashboardCRM = lazy(() => import('./pages/DashboardCRM'));
const Produtos = lazy(() => import('./pages/Produtos'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" component={DashboardCRM} />
        <Route path="/produtos" component={Produtos} />
      </Routes>
    </Suspense>
  );
}
```

### 4. Otimização de Queries SQL

```sql
-- Criar índices compostos para queries frequentes
CREATE INDEX idx_orders_tenant_status_date 
ON orders(tenant_id, status, created_at DESC);

-- Usar EXPLAIN ANALYZE para otimizar
EXPLAIN ANALYZE 
SELECT * FROM orders 
WHERE tenant_id = $1 
  AND status = 'pending' 
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## 🔐 Segurança

### 1. Rate Limiting Avançado

```typescript
// server/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: async (req) => {
    // Limites por plano
    const user = req.user;
    const tenant = await getTenant(user.tenant_id);
    return getPlanLimit(tenant.plano);
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 2. Validação de Inputs (Zod)

```typescript
// server/lib/validation.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  tenant_id: z.string().uuid(),
});

export const validateProduct = (data: unknown) => {
  return createProductSchema.parse(data);
};
```

### 3. Sanitização de Dados

```typescript
// server/middleware/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurify.sanitize(req.body[key]);
      }
    });
  }
  next();
};
```

### 4. Row Level Security (PostgreSQL)

```sql
-- Habilitar RLS em tabelas críticas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Definir tenant no contexto
SET app.current_tenant = 'tenant-uuid';
```

---

## 🚀 CI/CD

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
      - run: pnpm build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

### 2. Docker Multi-Stage Build

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 🔌 Integrações

### 1. Webhooks Engine

```typescript
// server/services/webhookService.ts
export class WebhookService {
  async sendWebhook(tenantId: string, event: string, data: any) {
    const webhooks = await db.query(
      'SELECT * FROM webhooks WHERE tenant_id = $1 AND event = $2',
      [tenantId, event]
    );
    
    for (const webhook of webhooks) {
      await this.retryWebhook(webhook.url, { event, data });
    }
  }
  
  private async retryWebhook(url: string, payload: any, attempt = 1) {
    const maxAttempts = 5;
    const delays = [0, 60000, 300000, 1800000, 3600000]; // 0, 1min, 5min, 30min, 1h
    
    try {
      await axios.post(url, payload, { timeout: 5000 });
    } catch (error) {
      if (attempt < maxAttempts) {
        await new Promise(resolve => 
          setTimeout(resolve, delays[attempt])
        );
        return this.retryWebhook(url, payload, attempt + 1);
      }
      // Log falha final
      await this.logWebhookFailure(url, payload, error);
    }
  }
}
```

### 2. Conector Bling

```typescript
// server/integrations/bling/BlingConnector.ts
export class BlingConnector extends BaseConnector {
  async syncProducts(): Promise<void> {
    const products = await this.blingAPI.getProducts();
    
    for (const product of products) {
      await db.query(`
        INSERT INTO products (tenant_id, sku, name, price, stock)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, sku) DO UPDATE
        SET name = $3, price = $4, stock = $5
      `, [this.tenantId, product.sku, product.name, product.price, product.stock]);
    }
  }
  
  async syncOrders(): Promise<void> {
    const orders = await this.blingAPI.getOrders();
    // Implementar sincronização
  }
}
```

---

## 📝 Checklist de Implementação

### Prioridade Alta
- [ ] Configurar Vitest e migrar testes
- [ ] Implementar logging estruturado (Winston)
- [ ] Adicionar rate limiting avançado
- [ ] Configurar CI/CD (GitHub Actions)

### Prioridade Média
- [ ] Implementar cache Redis
- [ ] Configurar monitoramento (Prometheus/Grafana)
- [ ] Adicionar rastreamento de erros (Sentry)
- [ ] Otimizar queries SQL

### Prioridade Baixa
- [ ] Configurar CDN
- [ ] Implementar lazy loading
- [ ] Adicionar Row Level Security
- [ ] Criar dashboard de métricas

---

**Última atualização:** Janeiro 2025
