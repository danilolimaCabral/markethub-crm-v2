# Arquitetura Multi-Tenant - MarketHub CRM SaaS

## 📋 Visão Geral

O MarketHub CRM foi estruturado como um **sistema SaaS multi-tenant** (multi-inquilino), permitindo que múltiplos clientes (empresas) utilizem a mesma aplicação de forma completamente isolada e independente.

### Características Principais

- ✅ **Isolamento total de dados** entre clientes
- ✅ **Escalabilidade** para centenas de tenants
- ✅ **Planos de assinatura** flexíveis (Starter, Professional, Business, Enterprise)
- ✅ **Subdomínios personalizados** (cliente.markethub.com)
- ✅ **Limites por plano** (usuários, produtos, pedidos, marketplaces)
- ✅ **Métricas de uso** em tempo real
- ✅ **Painel administrativo** para gerenciar todos os clientes

---

## 🏗️ Arquitetura Escolhida

### Abordagem: **Tenant ID em Todas as Tabelas**

Optamos pela estratégia de adicionar uma coluna `tenant_id` em todas as tabelas do banco de dados. Esta é a abordagem mais equilibrada para SaaS, usada por empresas como Shopify, Slack e Salesforce.

**Vantagens:**
- ✅ Um único banco de dados PostgreSQL
- ✅ Fácil manutenção e backup
- ✅ Queries eficientes com índices
- ✅ Custo-benefício excelente
- ✅ Escalável para 1000+ tenants

**Comparação com outras abordagens:**

| Abordagem | Isolamento | Escalabilidade | Custo | Complexidade |
|-----------|------------|----------------|-------|--------------|
| **Tenant ID (escolhida)** | Médio | Alta | Baixo | Baixa |
| Schema por tenant | Alto | Média | Médio | Média |
| DB por tenant | Máximo | Baixa | Alto | Alta |

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais do Sistema Multi-Tenant

#### 1. `tenants` - Empresas/Clientes

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    nome_empresa VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email_contato VARCHAR(255) NOT NULL,
    
    -- Plano e Status
    plano VARCHAR(50) DEFAULT 'starter',
    status VARCHAR(20) DEFAULT 'trial',
    data_inicio TIMESTAMP,
    data_expiracao TIMESTAMP,
    
    -- Limites por Plano
    limite_usuarios INTEGER,
    limite_produtos INTEGER,
    limite_pedidos_mes INTEGER,
    limite_integracao_marketplaces INTEGER,
    
    -- Uso Atual
    usuarios_ativos INTEGER DEFAULT 0,
    produtos_cadastrados INTEGER DEFAULT 0,
    pedidos_mes_atual INTEGER DEFAULT 0,
    
    -- Personalização
    logo_url TEXT,
    cor_primaria VARCHAR(7),
    subdominio_personalizado VARCHAR(100) UNIQUE
);
```

**Campos importantes:**
- `slug`: Identificador único usado em URLs (ex: "empresa-abc")
- `plano`: starter | professional | business | enterprise
- `status`: trial | active | suspended | cancelled
- `subdominio_personalizado`: cliente.markethub.com

#### 2. `planos_assinatura` - Planos Disponíveis

```sql
CREATE TABLE planos_assinatura (
    id UUID PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL,
    preco_mensal DECIMAL(10,2),
    preco_anual DECIMAL(10,2),
    
    -- Limites
    limite_usuarios INTEGER,
    limite_produtos INTEGER,
    limite_pedidos_mes INTEGER,
    limite_marketplaces INTEGER,
    
    -- Funcionalidades
    tem_relatorios_avancados BOOLEAN,
    tem_api_acesso BOOLEAN,
    tem_suporte_prioritario BOOLEAN,
    tem_white_label BOOLEAN,
    tem_integracao_erp BOOLEAN,
    tem_ia_assistente BOOLEAN
);
```

**Planos padrão:**

| Plano | Preço/mês | Usuários | Produtos | Pedidos/mês | Marketplaces |
|-------|-----------|----------|----------|-------------|--------------|
| **Starter** | R$ 49 | 3 | 100 | 500 | 1 |
| **Professional** | R$ 99 | 10 | 500 | 2.000 | 3 |
| **Business** | R$ 199 | 25 | 2.000 | 10.000 | 5 |
| **Enterprise** | R$ 399 | Ilimitado | Ilimitado | Ilimitado | Ilimitado |

#### 3. `tenant_id` em Todas as Tabelas

Todas as tabelas de dados receberam a coluna `tenant_id`:

```sql
-- Exemplos
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE products ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE orders ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE customers ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE marketplace_integrations ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... e todas as outras tabelas
```

**Índices criados para performance:**
```sql
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
-- ... índices em todas as tabelas
```

---

## 🔒 Segurança e Isolamento

### 1. Funções de Segurança

#### Verificar Acesso ao Tenant
```sql
CREATE FUNCTION check_tenant_access(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND tenant_id = p_tenant_id
    );
END;
$$ LANGUAGE plpgsql;
```

#### Obter Tenant do Usuário
```sql
CREATE FUNCTION get_user_tenant(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM users WHERE id = p_user_id;
    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. Middleware de Segurança (Backend)

**Todas as queries DEVEM incluir filtro por tenant_id:**

```typescript
// ❌ ERRADO - Não filtra por tenant
const products = await db.select().from(products);

// ✅ CORRETO - Sempre filtra por tenant
const products = await db.select()
  .from(products)
  .where(eq(products.tenant_id, req.user.tenant_id));
```

### 3. Row Level Security (RLS) - Opcional

Para segurança adicional, pode-se ativar RLS no PostgreSQL:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON products
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

---

## 🔐 Autenticação Multi-Tenant

### Fluxo de Login

1. **Usuário acessa:** `https://cliente-abc.markethub.com/login`
2. **Sistema identifica tenant** pelo subdomínio ou slug
3. **Usuário faz login** com email e senha
4. **JWT gerado** contém `user_id` + `tenant_id`
5. **Todas as requisições** incluem `tenant_id` do JWT

### Estrutura do JWT

```json
{
  "user_id": "uuid-do-usuario",
  "tenant_id": "uuid-do-tenant",
  "tenant_slug": "cliente-abc",
  "role": "admin",
  "exp": 1234567890
}
```

### Middleware de Autenticação

```typescript
// Extrai tenant_id do JWT e valida
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, SECRET);
  
  // Valida se usuário pertence ao tenant
  const isValid = await checkTenantAccess(
    decoded.user_id, 
    decoded.tenant_id
  );
  
  if (!isValid) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  req.user = decoded;
  next();
}
```

---

## 📊 Métricas e Monitoramento

### Atualização Automática de Métricas

Triggers atualizam automaticamente as métricas do tenant:

```sql
CREATE TRIGGER trg_users_metricas 
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_metricas();
```

**Métricas rastreadas:**
- Usuários ativos
- Produtos cadastrados
- Pedidos do mês atual
- Requisições de API
- Storage utilizado

### View de Resumo de Tenants

```sql
CREATE VIEW vw_tenants_resumo AS
SELECT 
    t.nome_empresa,
    t.plano,
    t.status,
    t.usuarios_ativos,
    t.produtos_cadastrados,
    t.pedidos_mes_atual,
    p.preco_mensal,
    CASE 
        WHEN t.data_expiracao < CURRENT_DATE THEN 'Expirado'
        WHEN t.data_expiracao < CURRENT_DATE + INTERVAL '7 days' THEN 'Expira em breve'
        ELSE 'Ativo'
    END as alerta_expiracao
FROM tenants t
LEFT JOIN planos_assinatura p ON t.plano = p.nome;
```

---

## 🎨 Personalização por Tenant

Cada tenant pode personalizar:

1. **Logo** - Upload de logo personalizado
2. **Cor Primária** - Tema da interface (hex color)
3. **Subdomínio** - URL personalizada
4. **Configurações** - JSONB com preferências

```typescript
// Exemplo de configurações personalizadas
{
  "timezone": "America/Sao_Paulo",
  "currency": "BRL",
  "language": "pt-BR",
  "email_notifications": true,
  "webhook_url": "https://cliente.com/webhook"
}
```

---

## 🚀 Cadastro de Novos Tenants

### Fluxo de Onboarding

1. **Formulário de Cadastro**
   - Nome da empresa
   - CNPJ
   - Email de contato
   - Plano escolhido

2. **Criação Automática**
   ```sql
   INSERT INTO tenants (
       nome_empresa, slug, email_contato, plano, status
   ) VALUES (
       'Empresa ABC', 'empresa-abc', 'contato@empresa.com', 'professional', 'trial'
   );
   ```

3. **Usuário Admin Criado**
   ```sql
   INSERT INTO users (
       tenant_id, email, nome, role
   ) VALUES (
       tenant_id, 'admin@empresa.com', 'Admin', 'admin'
   );
   ```

4. **Email de Boas-Vindas** enviado com credenciais

5. **Trial de 14 dias** ativado automaticamente

---

## 📈 Escalabilidade

### Capacidade Estimada

Com a arquitetura atual (tenant_id em todas as tabelas):

| Métrica | Capacidade |
|---------|------------|
| **Tenants simultâneos** | 1.000+ |
| **Usuários totais** | 50.000+ |
| **Produtos totais** | 1.000.000+ |
| **Pedidos/mês** | 10.000.000+ |

### Otimizações Implementadas

1. **Índices em tenant_id** - Todas as tabelas
2. **Particionamento** - Possível por tenant_id se necessário
3. **Caching** - Redis por tenant
4. **CDN** - Arquivos estáticos por tenant

---

## 🛠️ Painel Administrativo

### Funcionalidades do Admin

1. **Gerenciar Tenants**
   - Listar todos os clientes
   - Ver métricas de uso
   - Suspender/reativar contas
   - Alterar planos

2. **Monitoramento**
   - Uso de recursos por tenant
   - Alertas de limite excedido
   - Tenants próximos da expiração

3. **Financeiro**
   - Receita por plano
   - Churn rate
   - MRR (Monthly Recurring Revenue)

4. **Suporte**
   - Acessar conta do cliente (impersonation)
   - Ver logs de auditoria
   - Resolver problemas

---

## 🔄 Migração de Dados Existentes

Se já existem dados no sistema, migrar para multi-tenant:

```sql
-- 1. Criar tenant padrão
INSERT INTO tenants (nome_empresa, slug, plano, status)
VALUES ('Cliente Inicial', 'cliente-inicial', 'professional', 'active')
RETURNING id;

-- 2. Atualizar todas as tabelas com tenant_id
UPDATE users SET tenant_id = 'uuid-do-tenant-criado';
UPDATE products SET tenant_id = 'uuid-do-tenant-criado';
UPDATE orders SET tenant_id = 'uuid-do-tenant-criado';
-- ... todas as tabelas
```

---

## 📝 Checklist de Implementação

### Backend

- [x] Criar tabela `tenants`
- [x] Criar tabela `planos_assinatura`
- [x] Adicionar `tenant_id` em todas as tabelas
- [x] Criar índices em `tenant_id`
- [x] Implementar funções de segurança
- [x] Criar triggers de métricas
- [ ] Implementar middleware de autenticação
- [ ] Implementar filtros automáticos por tenant
- [ ] Criar endpoints de admin

### Frontend

- [ ] Tela de cadastro de tenant
- [ ] Painel administrativo SaaS
- [ ] Seletor de planos
- [ ] Página de configurações do tenant
- [ ] Personalização de tema por tenant

### Infraestrutura

- [ ] Configurar subdomínios wildcard (*.markethub.com)
- [ ] Implementar rate limiting por tenant
- [ ] Configurar backup por tenant
- [ ] Monitoramento de uso por tenant

---

## 🎯 Próximos Passos

1. **Implementar autenticação multi-tenant** no backend
2. **Criar painel admin** para gerenciar tenants
3. **Desenvolver fluxo de onboarding** para novos clientes
4. **Integrar gateway de pagamento** (Stripe/Asaas)
5. **Implementar sistema de billing** automático
6. **Criar dashboard de métricas** para cada tenant

---

## 📚 Referências

- [Multi-Tenancy Best Practices](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SaaS Metrics That Matter](https://www.forentrepreneurs.com/saas-metrics-2/)

---

**Autor:** Danilo  
**Data:** 08 de Novembro de 2025  
**Versão:** 1.0
