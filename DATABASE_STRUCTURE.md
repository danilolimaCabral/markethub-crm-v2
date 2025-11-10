# Estrutura de Banco de Dados - MarketHub CRM

**Sistema:** MarketHub CRM  
**Banco de Dados:** PostgreSQL 14+  
**Autor:** Manus AI  
**Data:** Janeiro 2025

---

## Visão Geral

O MarketHub CRM utiliza uma arquitetura de banco de dados relacional PostgreSQL otimizada para gerenciamento de vendas em múltiplos marketplaces. A estrutura foi projetada para escalabilidade, integridade referencial e performance em operações de leitura e escrita intensivas.

### Características Principais

O banco de dados implementa **normalização até a terceira forma normal (3NF)** para eliminar redundâncias, mantendo desnormalização estratégica em tabelas de relatórios para otimizar consultas analíticas. Todas as tabelas utilizam **UUIDs como chaves primárias** para facilitar distribuição futura e evitar conflitos em integrações. O sistema de auditoria completo registra todas as operações críticas através de triggers automáticos, garantindo rastreabilidade total das ações dos usuários.

---

## Módulos do Sistema

### 1. Módulo de Autenticação e Usuários

Este módulo gerencia todo o ciclo de vida dos usuários, desde cadastro até controle de permissões granulares por módulo do sistema.

#### Tabela: `users`

Armazena informações dos usuários do sistema com suporte a autenticação de dois fatores (2FA) e controle de sessões.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único do usuário |
| `username` | VARCHAR(100) | UNIQUE, NOT NULL | Nome de usuário para login |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email do usuário |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt da senha |
| `full_name` | VARCHAR(255) | NOT NULL | Nome completo do usuário |
| `role` | VARCHAR(50) | NOT NULL, DEFAULT 'user' | Papel do usuário (admin, user, viewer) |
| `two_factor_enabled` | BOOLEAN | DEFAULT FALSE | Se 2FA está ativado |
| `two_factor_secret` | VARCHAR(255) | NULL | Secret TOTP para 2FA |
| `is_active` | BOOLEAN | DEFAULT TRUE | Se o usuário está ativo |
| `last_login_at` | TIMESTAMP | NULL | Data/hora do último login |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de atualização |

**Índices:**
- `idx_users_email` em `email` (UNIQUE)
- `idx_users_username` em `username` (UNIQUE)
- `idx_users_is_active` em `is_active`

#### Tabela: `user_permissions`

Controle granular de permissões por módulo do sistema para cada usuário.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `user_id` | UUID | FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE | Usuário |
| `module_name` | VARCHAR(100) | NOT NULL | Nome do módulo (dashboard, pedidos, produtos, etc.) |
| `can_view` | BOOLEAN | DEFAULT TRUE | Permissão de visualização |
| `can_create` | BOOLEAN | DEFAULT FALSE | Permissão de criação |
| `can_edit` | BOOLEAN | DEFAULT FALSE | Permissão de edição |
| `can_delete` | BOOLEAN | DEFAULT FALSE | Permissão de exclusão |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |

**Índices:**
- `idx_user_permissions_user_module` em `(user_id, module_name)` (UNIQUE)

#### Tabela: `backup_codes`

Códigos de backup para recuperação de acesso quando 2FA não está disponível.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `user_id` | UUID | FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE | Usuário |
| `code` | VARCHAR(20) | NOT NULL | Código de backup (formato: XXXX-XXXX) |
| `is_used` | BOOLEAN | DEFAULT FALSE | Se o código já foi usado |
| `used_at` | TIMESTAMP | NULL | Data/hora de uso |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |

**Índices:**
- `idx_backup_codes_user` em `user_id`
- `idx_backup_codes_code` em `code`

---

### 2. Módulo de Produtos

Gerenciamento completo do catálogo de produtos com controle de estoque, preços e variações.

#### Tabela: `products`

Cadastro principal de produtos com informações básicas e controle de estoque.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `sku` | VARCHAR(100) | UNIQUE, NOT NULL | Código SKU do produto |
| `name` | VARCHAR(255) | NOT NULL | Nome do produto |
| `description` | TEXT | NULL | Descrição detalhada |
| `category` | VARCHAR(100) | NULL | Categoria do produto |
| `brand` | VARCHAR(100) | NULL | Marca do produto |
| `cost_price` | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | Preço de custo |
| `sale_price` | DECIMAL(15,2) | NOT NULL | Preço de venda |
| `stock_quantity` | INTEGER | NOT NULL, DEFAULT 0 | Quantidade em estoque |
| `min_stock` | INTEGER | DEFAULT 0 | Estoque mínimo (alerta) |
| `weight` | DECIMAL(10,3) | NULL | Peso em kg |
| `dimensions` | JSONB | NULL | Dimensões (largura, altura, profundidade) |
| `images` | JSONB | NULL | Array de URLs de imagens |
| `is_active` | BOOLEAN | DEFAULT TRUE | Se o produto está ativo |
| `created_by` | UUID | FOREIGN KEY REFERENCES users(id) | Usuário que criou |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de atualização |

**Índices:**
- `idx_products_sku` em `sku` (UNIQUE)
- `idx_products_category` em `category`
- `idx_products_is_active` em `is_active`
- `idx_products_stock` em `stock_quantity`

#### Tabela: `product_variations`

Variações de produtos (tamanho, cor, modelo, etc.).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `product_id` | UUID | FOREIGN KEY REFERENCES products(id) ON DELETE CASCADE | Produto pai |
| `sku` | VARCHAR(100) | UNIQUE, NOT NULL | SKU da variação |
| `name` | VARCHAR(255) | NOT NULL | Nome da variação |
| `attributes` | JSONB | NOT NULL | Atributos (cor, tamanho, etc.) |
| `price_adjustment` | DECIMAL(15,2) | DEFAULT 0 | Ajuste de preço |
| `stock_quantity` | INTEGER | NOT NULL, DEFAULT 0 | Estoque da variação |
| `is_active` | BOOLEAN | DEFAULT TRUE | Se está ativa |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |

**Índices:**
- `idx_product_variations_product` em `product_id`
- `idx_product_variations_sku` em `sku` (UNIQUE)

---

### 3. Módulo de Clientes

Gestão completa de clientes com histórico de compras e segmentação.

#### Tabela: `customers`

Cadastro de clientes com informações de contato e endereços.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `name` | VARCHAR(255) | NOT NULL | Nome completo |
| `email` | VARCHAR(255) | NULL | Email |
| `phone` | VARCHAR(20) | NULL | Telefone |
| `document` | VARCHAR(20) | NULL | CPF/CNPJ |
| `type` | VARCHAR(20) | NOT NULL | Tipo (pessoa_fisica, pessoa_juridica) |
| `addresses` | JSONB | NULL | Array de endereços |
| `notes` | TEXT | NULL | Observações |
| `tags` | TEXT[] | NULL | Tags para segmentação |
| `total_orders` | INTEGER | DEFAULT 0 | Total de pedidos |
| `total_spent` | DECIMAL(15,2) | DEFAULT 0 | Total gasto |
| `last_order_at` | TIMESTAMP | NULL | Data do último pedido |
| `is_active` | BOOLEAN | DEFAULT TRUE | Se está ativo |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de atualização |

**Índices:**
- `idx_customers_email` em `email`
- `idx_customers_document` em `document`
- `idx_customers_phone` em `phone`

---

### 4. Módulo de Pedidos

Sistema completo de gerenciamento de pedidos com rastreamento e histórico de status.

#### Tabela: `orders`

Pedidos de venda com informações de pagamento e entrega.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Número do pedido |
| `customer_id` | UUID | FOREIGN KEY REFERENCES customers(id) | Cliente |
| `marketplace` | VARCHAR(50) | NULL | Marketplace de origem (ML, Shopee, etc.) |
| `marketplace_order_id` | VARCHAR(100) | NULL | ID do pedido no marketplace |
| `status` | VARCHAR(50) | NOT NULL | Status (pending, paid, shipped, delivered, cancelled) |
| `payment_method` | VARCHAR(50) | NULL | Método de pagamento |
| `payment_status` | VARCHAR(50) | NOT NULL | Status do pagamento |
| `subtotal` | DECIMAL(15,2) | NOT NULL | Subtotal dos itens |
| `shipping_cost` | DECIMAL(15,2) | DEFAULT 0 | Custo de frete |
| `discount` | DECIMAL(15,2) | DEFAULT 0 | Desconto aplicado |
| `total` | DECIMAL(15,2) | NOT NULL | Total do pedido |
| `shipping_address` | JSONB | NULL | Endereço de entrega |
| `tracking_code` | VARCHAR(100) | NULL | Código de rastreamento |
| `notes` | TEXT | NULL | Observações |
| `paid_at` | TIMESTAMP | NULL | Data do pagamento |
| `shipped_at` | TIMESTAMP | NULL | Data de envio |
| `delivered_at` | TIMESTAMP | NULL | Data de entrega |
| `cancelled_at` | TIMESTAMP | NULL | Data de cancelamento |
| `created_by` | UUID | FOREIGN KEY REFERENCES users(id) | Usuário que criou |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de atualização |

**Índices:**
- `idx_orders_number` em `order_number` (UNIQUE)
- `idx_orders_customer` em `customer_id`
- `idx_orders_status` em `status`
- `idx_orders_marketplace` em `marketplace`
- `idx_orders_created_at` em `created_at`

#### Tabela: `order_items`

Itens de cada pedido com quantidades e preços.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `order_id` | UUID | FOREIGN KEY REFERENCES orders(id) ON DELETE CASCADE | Pedido |
| `product_id` | UUID | FOREIGN KEY REFERENCES products(id) | Produto |
| `product_variation_id` | UUID | FOREIGN KEY REFERENCES product_variations(id) NULL | Variação do produto |
| `sku` | VARCHAR(100) | NOT NULL | SKU do item |
| `name` | VARCHAR(255) | NOT NULL | Nome do produto |
| `quantity` | INTEGER | NOT NULL | Quantidade |
| `unit_price` | DECIMAL(15,2) | NOT NULL | Preço unitário |
| `subtotal` | DECIMAL(15,2) | NOT NULL | Subtotal (quantity * unit_price) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |

**Índices:**
- `idx_order_items_order` em `order_id`
- `idx_order_items_product` em `product_id`

#### Tabela: `order_status_history`

Histórico de mudanças de status dos pedidos para auditoria.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `order_id` | UUID | FOREIGN KEY REFERENCES orders(id) ON DELETE CASCADE | Pedido |
| `from_status` | VARCHAR(50) | NULL | Status anterior |
| `to_status` | VARCHAR(50) | NOT NULL | Novo status |
| `notes` | TEXT | NULL | Observações |
| `changed_by` | UUID | FOREIGN KEY REFERENCES users(id) | Usuário que alterou |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data da mudança |

**Índices:**
- `idx_order_status_history_order` em `order_id`
- `idx_order_status_history_created_at` em `created_at`

---

### 5. Módulo de Integração com Marketplaces

Gerenciamento de integrações com Mercado Livre, Shopee, Amazon e outros marketplaces.

#### Tabela: `marketplace_integrations`

Configurações de integração com cada marketplace.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `marketplace` | VARCHAR(50) | UNIQUE, NOT NULL | Nome do marketplace (mercado_livre, shopee, etc.) |
| `client_id` | VARCHAR(255) | NULL | Client ID OAuth |
| `client_secret` | VARCHAR(255) | NULL | Client Secret OAuth (criptografado) |
| `access_token` | TEXT | NULL | Access token (criptografado) |
| `refresh_token` | TEXT | NULL | Refresh token (criptografado) |
| `token_expires_at` | TIMESTAMP | NULL | Expiração do token |
| `is_active` | BOOLEAN | DEFAULT FALSE | Se a integração está ativa |
| `last_sync_at` | TIMESTAMP | NULL | Última sincronização |
| `sync_frequency` | INTEGER | DEFAULT 15 | Frequência de sync em minutos |
| `config` | JSONB | NULL | Configurações adicionais |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de atualização |

**Índices:**
- `idx_marketplace_integrations_marketplace` em `marketplace` (UNIQUE)
- `idx_marketplace_integrations_is_active` em `is_active`

#### Tabela: `marketplace_sync_log`

Log de sincronizações com marketplaces para troubleshooting.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `integration_id` | UUID | FOREIGN KEY REFERENCES marketplace_integrations(id) | Integração |
| `sync_type` | VARCHAR(50) | NOT NULL | Tipo (orders, products, stock) |
| `status` | VARCHAR(50) | NOT NULL | Status (success, error, partial) |
| `records_processed` | INTEGER | DEFAULT 0 | Registros processados |
| `records_failed` | INTEGER | DEFAULT 0 | Registros com erro |
| `error_message` | TEXT | NULL | Mensagem de erro |
| `details` | JSONB | NULL | Detalhes da sincronização |
| `started_at` | TIMESTAMP | NOT NULL | Início da sync |
| `completed_at` | TIMESTAMP | NULL | Fim da sync |

**Índices:**
- `idx_marketplace_sync_log_integration` em `integration_id`
- `idx_marketplace_sync_log_started_at` em `started_at`

---

### 6. Módulo Financeiro

Gestão de contas a pagar, contas a receber e fluxo de caixa.

#### Tabela: `financial_transactions`

Todas as transações financeiras do sistema (entradas e saídas).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `type` | VARCHAR(20) | NOT NULL | Tipo (income, expense) |
| `category` | VARCHAR(100) | NOT NULL | Categoria (venda, frete, imposto, etc.) |
| `description` | VARCHAR(255) | NOT NULL | Descrição |
| `amount` | DECIMAL(15,2) | NOT NULL | Valor |
| `order_id` | UUID | FOREIGN KEY REFERENCES orders(id) NULL | Pedido relacionado |
| `customer_id` | UUID | FOREIGN KEY REFERENCES customers(id) NULL | Cliente relacionado |
| `payment_method` | VARCHAR(50) | NULL | Método de pagamento |
| `status` | VARCHAR(50) | NOT NULL | Status (pending, paid, cancelled) |
| `due_date` | DATE | NULL | Data de vencimento |
| `paid_at` | TIMESTAMP | NULL | Data do pagamento |
| `notes` | TEXT | NULL | Observações |
| `created_by` | UUID | FOREIGN KEY REFERENCES users(id) | Usuário que criou |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de atualização |

**Índices:**
- `idx_financial_transactions_type` em `type`
- `idx_financial_transactions_category` em `category`
- `idx_financial_transactions_status` em `status`
- `idx_financial_transactions_due_date` em `due_date`
- `idx_financial_transactions_order` em `order_id`

#### Tabela: `variable_costs`

Custos variáveis (PAX) por categoria para cálculo de rentabilidade.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `category` | VARCHAR(100) | NOT NULL | Categoria (impostos, frete, comissao, etc.) |
| `name` | VARCHAR(255) | NOT NULL | Nome do custo |
| `type` | VARCHAR(20) | NOT NULL | Tipo (percentage, fixed) |
| `value` | DECIMAL(10,2) | NOT NULL | Valor (% ou R$) |
| `description` | TEXT | NULL | Descrição |
| `is_active` | BOOLEAN | DEFAULT TRUE | Se está ativo |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de atualização |

**Índices:**
- `idx_variable_costs_category` em `category`
- `idx_variable_costs_is_active` em `is_active`

---

### 7. Módulo de Importação de Dados

Sistema de importação de planilhas financeiras e outros dados.

#### Tabela: `import_history`

Histórico de importações de arquivos.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `type` | VARCHAR(50) | NOT NULL | Tipo (financial, products, customers) |
| `filename` | VARCHAR(255) | NOT NULL | Nome do arquivo |
| `file_size` | INTEGER | NULL | Tamanho em bytes |
| `status` | VARCHAR(50) | NOT NULL | Status (processing, completed, failed) |
| `records_total` | INTEGER | DEFAULT 0 | Total de registros |
| `records_imported` | INTEGER | DEFAULT 0 | Registros importados |
| `records_failed` | INTEGER | DEFAULT 0 | Registros com erro |
| `error_log` | JSONB | NULL | Log de erros |
| `imported_by` | UUID | FOREIGN KEY REFERENCES users(id) | Usuário que importou |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `completed_at` | TIMESTAMP | NULL | Data de conclusão |

**Índices:**
- `idx_import_history_type` em `type`
- `idx_import_history_status` em `status`
- `idx_import_history_created_at` em `created_at`

---

### 8. Módulo de Auditoria

Sistema completo de auditoria de todas as operações críticas.

#### Tabela: `audit_log`

Log de auditoria de todas as ações dos usuários.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único |
| `user_id` | UUID | FOREIGN KEY REFERENCES users(id) | Usuário que executou |
| `action` | VARCHAR(50) | NOT NULL | Ação (create, update, delete, login, etc.) |
| `entity_type` | VARCHAR(50) | NOT NULL | Tipo de entidade (order, product, customer, etc.) |
| `entity_id` | UUID | NULL | ID da entidade afetada |
| `old_values` | JSONB | NULL | Valores anteriores |
| `new_values` | JSONB | NULL | Novos valores |
| `ip_address` | VARCHAR(45) | NULL | IP do usuário |
| `user_agent` | TEXT | NULL | User agent do navegador |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Data/hora da ação |

**Índices:**
- `idx_audit_log_user` em `user_id`
- `idx_audit_log_entity` em `(entity_type, entity_id)`
- `idx_audit_log_created_at` em `created_at`
- `idx_audit_log_action` em `action`

---

## Triggers e Functions

### Trigger: Atualização Automática de `updated_at`

Atualiza automaticamente o campo `updated_at` sempre que um registro é modificado.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repetir para outras tabelas...
```

### Trigger: Auditoria Automática

Registra automaticamente mudanças em tabelas críticas no `audit_log`.

```sql
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        COALESCE(current_setting('app.current_user_id', TRUE)::UUID, NULL),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar em tabelas críticas
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Trigger: Atualização de Estoque

Atualiza automaticamente o estoque quando um pedido é criado ou cancelado.

```sql
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Reduzir estoque ao criar pedido
        UPDATE products 
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Devolver estoque ao cancelar pedido
        UPDATE products 
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE id = OLD.product_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_trigger AFTER INSERT OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_order();
```

---

## Views Úteis

### View: Dashboard de Vendas

Métricas consolidadas para o dashboard principal.

```sql
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT o.customer_id) as total_customers,
    SUM(o.total) as total_revenue,
    AVG(o.total) as average_order_value,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN o.status = 'shipped' THEN 1 END) as shipped_orders,
    COUNT(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN 1 END) as today_orders,
    SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.total ELSE 0 END) as today_revenue
FROM orders o
WHERE o.status != 'cancelled';
```

### View: Produtos com Estoque Baixo

Lista produtos que atingiram o estoque mínimo.

```sql
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
    p.id,
    p.sku,
    p.name,
    p.stock_quantity,
    p.min_stock,
    p.category,
    (p.min_stock - p.stock_quantity) as quantity_needed
FROM products p
WHERE p.stock_quantity <= p.min_stock
  AND p.is_active = TRUE
ORDER BY (p.min_stock - p.stock_quantity) DESC;
```

### View: Relatório Financeiro Mensal

Resumo financeiro por mês.

```sql
CREATE OR REPLACE VIEW monthly_financial_report AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    type,
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM financial_transactions
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', created_at), type, category
ORDER BY month DESC, type, category;
```

---

## Considerações de Performance

### Particionamento de Tabelas

Para sistemas com alto volume de dados, recomenda-se particionar tabelas grandes por data.

```sql
-- Exemplo: Particionar orders por mês
CREATE TABLE orders (
    -- colunas...
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2025_01 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE orders_2025_02 PARTITION OF orders
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

### Índices Compostos

Criar índices compostos para consultas frequentes.

```sql
-- Busca de pedidos por cliente e status
CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);

-- Busca de produtos por categoria e status
CREATE INDEX idx_products_category_active ON products (category, is_active);

-- Busca de transações por tipo e data
CREATE INDEX idx_transactions_type_date ON financial_transactions (type, created_at);
```

### Manutenção Regular

Executar comandos de manutenção periodicamente para otimizar performance.

```sql
-- Analisar estatísticas das tabelas
ANALYZE;

-- Vacuum para recuperar espaço
VACUUM ANALYZE;

-- Reindexar tabelas grandes
REINDEX TABLE orders;
REINDEX TABLE products;
```

---

## Backup e Recuperação

### Estratégia de Backup

Implementar rotina de backups automáticos diários com retenção de 30 dias.

```bash
# Backup completo diário
pg_dump -h localhost -U postgres -d markethub_crm -F c -f backup_$(date +%Y%m%d).dump

# Backup incremental com WAL archiving
# Configurar no postgresql.conf:
# wal_level = replica
# archive_mode = on
# archive_command = 'cp %p /backup/wal/%f'
```

### Recuperação Point-in-Time

Configurar recuperação point-in-time para restaurar o banco em qualquer momento.

```bash
# Restaurar backup base
pg_restore -h localhost -U postgres -d markethub_crm backup_20250115.dump

# Aplicar WAL logs até ponto específico
# Configurar recovery.conf com recovery_target_time
```

---

## Segurança

### Criptografia de Dados Sensíveis

Utilizar extensão `pgcrypto` para criptografar dados sensíveis.

```sql
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criptografar tokens
UPDATE marketplace_integrations
SET access_token = pgp_sym_encrypt(access_token, 'encryption_key');

-- Descriptografar tokens
SELECT pgp_sym_decrypt(access_token::bytea, 'encryption_key')
FROM marketplace_integrations;
```

### Controle de Acesso

Criar roles específicos com permissões limitadas.

```sql
-- Role para aplicação (leitura e escrita)
CREATE ROLE markethub_app WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE markethub_crm TO markethub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO markethub_app;

-- Role para relatórios (somente leitura)
CREATE ROLE markethub_reports WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE markethub_crm TO markethub_reports;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO markethub_reports;
```

---

## Conclusão

Esta estrutura de banco de dados PostgreSQL foi projetada para suportar todas as funcionalidades do **MarketHub CRM** com escalabilidade, performance e segurança. A arquitetura modular permite expansão futura sem comprometer a integridade dos dados existentes, enquanto os triggers e views automatizam operações críticas e fornecem insights em tempo real para tomada de decisões estratégicas.
