# 🧪 Guia de Testes e CI/CD - Markethub CRM

## 📋 Índice

1. [Testes Automatizados](#testes-automatizados)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Executando Testes](#executando-testes)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoramento](#monitoramento)
6. [Validação de Ambiente](#validação-de-ambiente)
7. [Cobertura de Testes](#cobertura-de-testes)
8. [Boas Práticas](#boas-práticas)

---

## 🧪 Testes Automatizados

### Tecnologias Utilizadas

- **Vitest**: Framework de testes rápido e moderno
- **Supertest**: Testes de API HTTP
- **Zod**: Validação de schemas
- **Coverage V8**: Cobertura de código

### Configuração

Arquivos de configuração criados:
- `vitest.config.ts` - Configuração principal
- `vitest.config.unit.ts` - Testes unitários
- `vitest.config.integration.ts` - Testes de integração
- `tests/setup.ts` - Setup global

---

## 📁 Estrutura de Testes

```
tests/
├── setup.ts                    # Setup global dos testes
├── mocks/                      # Mocks reutilizáveis
│   └── database.ts            # Mock do banco de dados
├── unit/                      # Testes unitários
│   ├── auth.test.ts          # Testes de autenticação
│   └── validation.test.ts    # Testes de validação
└── integration/               # Testes de integração
    ├── auth-api.test.ts      # API de autenticação
    └── produtos-api.test.ts  # API de produtos
```

---

## 🚀 Executando Testes

### Comandos Disponíveis

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch (desenvolvimento)
pnpm test:watch

# Executar apenas testes unitários
pnpm test:unit

# Executar apenas testes de integração
pnpm test:integration

# Gerar relatório de cobertura
pnpm test:coverage
```

### Exemplos de Uso

**Desenvolvimento (modo watch):**
```bash
pnpm test:watch
```

**CI/CD (execução única):**
```bash
pnpm test
```

**Verificar cobertura antes de commit:**
```bash
pnpm test:coverage
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Configurados

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)

Pipeline completo executado em:
- Push para `main`, `develop`, e branches `cursor/*`
- Pull requests para `main` e `develop`

**Jobs:**
1. **Lint & Type Check**: Validação de TypeScript
2. **Unit Tests**: Testes unitários
3. **Integration Tests**: Testes de integração com PostgreSQL
4. **Build**: Compilação da aplicação
5. **Security Audit**: Auditoria de segurança
6. **Deploy Staging**: Deploy automático para staging (main branch)

#### 2. **Test Pipeline** (`.github/workflows/test.yml`)

Pipeline focado em testes:
- Executa todos os testes
- Gera relatório de cobertura
- Publica resultados no Codecov
- Comenta resultados em Pull Requests

#### 3. **Production Deploy** (`.github/workflows/deploy-production.yml`)

Pipeline de deploy para produção:
- Trigger: Tags `v*` ou manual
- Executa testes antes do deploy
- Deploy para produção
- Smoke tests pós-deploy
- Rollback automático em caso de falha

### Configurando Secrets

No GitHub, vá em **Settings → Secrets → Actions** e adicione:

```bash
# Database
PRODUCTION_DATABASE_URL=postgresql://...

# Deployment
DEPLOY_KEY=your-deploy-key

# Codecov (opcional)
CODECOV_TOKEN=your-codecov-token

# Sentry (opcional)
SENTRY_DSN=https://...
```

---

## 📊 Monitoramento

### Sentry Integration

**Arquivo:** `server/utils/sentry.ts`

#### Configuração

1. **Criar conta no Sentry:**
   - Acesse https://sentry.io
   - Crie um novo projeto Node.js
   - Copie o DSN

2. **Configurar no .env:**
   ```bash
   SENTRY_DSN=https://your-key@sentry.io/project-id
   ```

3. **Integrar no servidor:**
   ```typescript
   import { initSentry, setupSentryRequestHandler, setupSentryErrorHandler } from './utils/sentry';

   // Inicializar Sentry
   initSentry();

   // Adicionar middlewares
   setupSentryRequestHandler(app);
   
   // ... suas rotas aqui ...
   
   // Adicionar error handler (DEVE ser depois das rotas)
   setupSentryErrorHandler(app);
   ```

#### Funcionalidades

- ✅ Captura automática de erros
- ✅ Performance monitoring
- ✅ Profiling
- ✅ Breadcrumbs para debugging
- ✅ Context de usuário
- ✅ Filtragem de dados sensíveis

#### Uso Manual

```typescript
import { captureException, captureMessage, addBreadcrumb } from './utils/sentry';

// Capturar exceção
try {
  // código...
} catch (error) {
  captureException(error, { userId: '123' });
}

// Capturar mensagem
captureMessage('Operação importante realizada', 'info');

// Adicionar breadcrumb
addBreadcrumb('User clicked button', { buttonId: 'submit' });
```

---

## 🔍 Validação de Ambiente

### Script de Validação

**Arquivo:** `scripts/validate-env.ts`

#### Executar Validação

```bash
pnpm validate:env
```

#### O que é Validado

✅ **Obrigatórios:**
- `DATABASE_URL`
- `JWT_SECRET` (min 32 caracteres)
- `JWT_REFRESH_SECRET` (min 32 caracteres)

⚠️ **Recomendados (avisos):**
- `ML_CLIENT_ID`
- `ML_CLIENT_SECRET`
- `SENTRY_DSN`
- `REDIS_URL`

🔐 **Verificações de Segurança:**
- Força dos JWT secrets
- Secrets não podem ser iguais
- Detecta placeholders comuns
- Valida formato do DATABASE_URL

#### Exemplo de Saída

```
═══════════════════════════════════════════════════
  🔍 Environment Variables Validation
═══════════════════════════════════════════════════

✅ .env file found

📋 Validating Required Variables
═══════════════════════════════════════════════════

✅ All required environment variables are valid

⚠️  Warnings
═══════════════════════════════════════════════════

⚠️  ML_CLIENT_ID is not set (optional but recommended for production)
⚠️  SENTRY_DSN is not set (optional but recommended for production)

🔐 Security Checks
═══════════════════════════════════════════════════

✅ JWT secrets are properly configured

📊 Validation Summary
═══════════════════════════════════════════════════

✅ All required environment variables are properly configured!
ℹ️  You can now start the application.
```

---

## 📈 Cobertura de Testes

### Meta de Cobertura

| Tipo | Meta Atual | Meta Futura |
|------|------------|-------------|
| **Unitários** | 60% | 80% |
| **Integração** | 40% | 60% |
| **Geral** | 50% | 70% |

### Áreas Cobertas

✅ **Autenticação (90%)**
- JWT token generation/verification
- Password hashing
- Login/Register flows
- Token refresh

✅ **Validação (95%)**
- Email validation
- UUID validation
- Schema validation (Zod)
- SQL injection prevention
- Pagination schemas
- Product schemas

⚠️ **API Routes (30%)**
- Auth endpoints (parcial)
- Products endpoints (básico)

⚠️ **Middlewares (20%)**
- Rate limiting (não testado)
- Cache (não testado)

### Visualizar Cobertura

```bash
# Gerar relatório
pnpm test:coverage

# Abrir relatório HTML
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

---

## 🎯 Boas Práticas

### 1. Escrever Testes PRIMEIRO

```typescript
// ❌ Ruim: Escrever código primeiro
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Bom: Escrever teste primeiro (TDD)
describe('calculateTotal', () => {
  it('should sum item prices', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
});
```

### 2. Testes Descritivos

```typescript
// ❌ Ruim: Descrição vaga
it('should work', () => { ... });

// ✅ Bom: Descrição clara
it('should return 401 when user is not authenticated', () => { ... });
```

### 3. Usar Mocks Apropriadamente

```typescript
// ✅ Bom: Mock de dependências externas
vi.mock('../../server/db', () => ({
  query: vi.fn().mockResolvedValue({ rows: [...] }),
}));

// ❌ Ruim: Mock de funções simples que podem ser testadas
// Não precisa mockar funções puras!
```

### 4. Organização Clara

```typescript
describe('User Authentication', () => {
  describe('Login', () => {
    it('should succeed with valid credentials', () => { ... });
    it('should fail with invalid password', () => { ... });
    it('should fail with non-existent user', () => { ... });
  });
  
  describe('Registration', () => {
    it('should create new user', () => { ... });
    it('should reject duplicate email', () => { ... });
  });
});
```

### 5. Cleanup After Tests

```typescript
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  // Setup
});

afterEach(() => {
  // Cleanup
  vi.clearAllMocks();
});
```

### 6. Testes Independentes

```typescript
// ❌ Ruim: Testes dependentes
it('should create user', () => { userId = createUser(); });
it('should find user', () => { findUser(userId); }); // Depende do anterior

// ✅ Bom: Testes independentes
it('should create user', () => {
  const user = createUser();
  expect(user).toBeDefined();
});

it('should find user', () => {
  const user = createUser(); // Cria próprio usuário
  const found = findUser(user.id);
  expect(found).toEqual(user);
});
```

---

## 📦 Checklist de Deploy

### Antes de Deploy para Produção

- [ ] Todos os testes passando
- [ ] Cobertura de testes ≥ 50%
- [ ] Variáveis de ambiente validadas
- [ ] Secrets configurados no GitHub
- [ ] Sentry configurado
- [ ] Database migrations executadas
- [ ] Smoke tests preparados
- [ ] Rollback strategy definida

### Após Deploy

- [ ] Smoke tests executados
- [ ] Monitoramento ativo (Sentry)
- [ ] Logs sendo coletados
- [ ] Performance baseline estabelecido
- [ ] Alertas configurados

---

## 🆘 Troubleshooting

### Testes Falhando Localmente

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules
pnpm install

# Limpar cache do Vitest
pnpm test --clearCache

# Verificar versão do Node
node --version  # Deve ser ≥ 20

# Verificar variáveis de ambiente
pnpm validate:env
```

### CI/CD Falhando

**Erro de dependências:**
```yaml
# Adicionar step de cache no workflow
- uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

**Erro de permissões:**
```bash
# Adicionar permissões no workflow
permissions:
  contents: read
  pull-requests: write
```

**Timeout:**
```yaml
# Aumentar timeout
- name: Run tests
  run: pnpm test
  timeout-minutes: 15
```

---

## 📚 Recursos Adicionais

### Documentação

- [Vitest](https://vitest.dev/)
- [Supertest](https://github.com/ladjs/supertest)
- [GitHub Actions](https://docs.github.com/actions)
- [Sentry Node.js](https://docs.sentry.io/platforms/node/)
- [Zod](https://zod.dev/)

### Exemplos

Veja os testes existentes em:
- `tests/unit/auth.test.ts` - Exemplo de testes unitários
- `tests/unit/validation.test.ts` - Exemplo de validação
- `tests/integration/auth-api.test.ts` - Exemplo de testes de API

---

## 🎓 Próximos Passos

1. ✅ **Aumentar cobertura de testes**
   - Meta: 70% geral
   - Focar em testes de integração

2. ⚠️ **Adicionar testes E2E**
   - Playwright ou Cypress
   - Testar fluxos completos

3. ⚠️ **Performance testing**
   - Load testing com k6
   - Stress testing

4. ⚠️ **Security testing**
   - OWASP ZAP
   - Dependency scanning

---

**Última atualização:** $(date +%Y-%m-%d)
**Versão:** v2.0
**Status:** ✅ Testes e CI/CD Configurados
