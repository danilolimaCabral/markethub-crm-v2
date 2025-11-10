-- ============================================================================
-- MarketHub CRM - Database Creation Script
-- Database: PostgreSQL 14+
-- Author: Manus AI
-- Date: Janeiro 2025
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. MÓDULO DE AUTENTICAÇÃO E USUÁRIOS
-- ============================================================================

-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Comentários
COMMENT ON TABLE users IS 'Usuários do sistema com autenticação 2FA';
COMMENT ON COLUMN users.role IS 'Papel: admin, user, viewer';
COMMENT ON COLUMN users.two_factor_secret IS 'Secret TOTP para autenticação de 2 fatores';

-- Tabela de permissões de usuários
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_name)
);

-- Índices para user_permissions
CREATE INDEX idx_user_permissions_user_module ON user_permissions(user_id, module_name);

COMMENT ON TABLE user_permissions IS 'Permissões granulares por módulo do sistema';

-- Tabela de códigos de backup 2FA
CREATE TABLE backup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para backup_codes
CREATE INDEX idx_backup_codes_user ON backup_codes(user_id);
CREATE INDEX idx_backup_codes_code ON backup_codes(code);

COMMENT ON TABLE backup_codes IS 'Códigos de backup para recuperação de acesso 2FA';

-- ============================================================================
-- 2. MÓDULO DE PRODUTOS
-- ============================================================================

-- Tabela de produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    brand VARCHAR(100) NULL,
    cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(15,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    weight DECIMAL(10,3) NULL,
    dimensions JSONB NULL,
    images JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock_quantity);

COMMENT ON TABLE products IS 'Catálogo de produtos com controle de estoque';
COMMENT ON COLUMN products.dimensions IS 'JSON: {width, height, depth} em cm';
COMMENT ON COLUMN products.images IS 'Array JSON de URLs de imagens';

-- Tabela de variações de produtos
CREATE TABLE product_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL,
    price_adjustment DECIMAL(15,2) DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para product_variations
CREATE INDEX idx_product_variations_product ON product_variations(product_id);
CREATE INDEX idx_product_variations_sku ON product_variations(sku);

COMMENT ON TABLE product_variations IS 'Variações de produtos (tamanho, cor, etc.)';
COMMENT ON COLUMN product_variations.attributes IS 'JSON: {color, size, model, etc.}';

-- ============================================================================
-- 3. MÓDULO DE CLIENTES
-- ============================================================================

-- Tabela de clientes
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    document VARCHAR(20) NULL,
    type VARCHAR(20) NOT NULL,
    addresses JSONB NULL,
    notes TEXT NULL,
    tags TEXT[] NULL,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    last_order_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_document ON customers(document);
CREATE INDEX idx_customers_phone ON customers(phone);

COMMENT ON TABLE customers IS 'Cadastro de clientes';
COMMENT ON COLUMN customers.type IS 'pessoa_fisica ou pessoa_juridica';
COMMENT ON COLUMN customers.addresses IS 'Array JSON de endereços';
COMMENT ON COLUMN customers.tags IS 'Tags para segmentação';

-- ============================================================================
-- 4. MÓDULO DE PEDIDOS
-- ============================================================================

-- Tabela de pedidos
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    marketplace VARCHAR(50) NULL,
    marketplace_order_id VARCHAR(100) NULL,
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NULL,
    payment_status VARCHAR(50) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    shipping_address JSONB NULL,
    tracking_code VARCHAR(100) NULL,
    notes TEXT NULL,
    paid_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para orders
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_marketplace ON orders(marketplace);
CREATE INDEX idx_orders_created_at ON orders(created_at);

COMMENT ON TABLE orders IS 'Pedidos de venda';
COMMENT ON COLUMN orders.status IS 'pending, paid, shipped, delivered, cancelled';
COMMENT ON COLUMN orders.marketplace IS 'mercado_livre, shopee, amazon, etc.';

-- Tabela de itens do pedido
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_variation_id UUID REFERENCES product_variations(id) NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para order_items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

COMMENT ON TABLE order_items IS 'Itens de cada pedido';

-- Tabela de histórico de status do pedido
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NULL,
    to_status VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para order_status_history
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at);

COMMENT ON TABLE order_status_history IS 'Histórico de mudanças de status dos pedidos';

-- ============================================================================
-- 5. MÓDULO DE INTEGRAÇÃO COM MARKETPLACES
-- ============================================================================

-- Tabela de integrações com marketplaces
CREATE TABLE marketplace_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marketplace VARCHAR(50) UNIQUE NOT NULL,
    client_id VARCHAR(255) NULL,
    client_secret VARCHAR(255) NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMP NULL,
    sync_frequency INTEGER DEFAULT 15,
    config JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para marketplace_integrations
CREATE INDEX idx_marketplace_integrations_marketplace ON marketplace_integrations(marketplace);
CREATE INDEX idx_marketplace_integrations_is_active ON marketplace_integrations(is_active);

COMMENT ON TABLE marketplace_integrations IS 'Configurações de integração OAuth2 com marketplaces';
COMMENT ON COLUMN marketplace_integrations.sync_frequency IS 'Frequência de sincronização em minutos';

-- Tabela de log de sincronização
CREATE TABLE marketplace_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES marketplace_integrations(id),
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT NULL,
    details JSONB NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL
);

-- Índices para marketplace_sync_log
CREATE INDEX idx_marketplace_sync_log_integration ON marketplace_sync_log(integration_id);
CREATE INDEX idx_marketplace_sync_log_started_at ON marketplace_sync_log(started_at);

COMMENT ON TABLE marketplace_sync_log IS 'Log de sincronizações com marketplaces';
COMMENT ON COLUMN marketplace_sync_log.sync_type IS 'orders, products, stock';
COMMENT ON COLUMN marketplace_sync_log.status IS 'success, error, partial';

-- ============================================================================
-- 6. MÓDULO FINANCEIRO
-- ============================================================================

-- Tabela de transações financeiras
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    order_id UUID REFERENCES orders(id) NULL,
    customer_id UUID REFERENCES customers(id) NULL,
    payment_method VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL,
    due_date DATE NULL,
    paid_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para financial_transactions
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_due_date ON financial_transactions(due_date);
CREATE INDEX idx_financial_transactions_order ON financial_transactions(order_id);

COMMENT ON TABLE financial_transactions IS 'Todas as transações financeiras (entradas e saídas)';
COMMENT ON COLUMN financial_transactions.type IS 'income ou expense';

-- Tabela de custos variáveis (PAX)
CREATE TABLE variable_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para variable_costs
CREATE INDEX idx_variable_costs_category ON variable_costs(category);
CREATE INDEX idx_variable_costs_is_active ON variable_costs(is_active);

COMMENT ON TABLE variable_costs IS 'Custos variáveis (PAX) por categoria';
COMMENT ON COLUMN variable_costs.type IS 'percentage ou fixed';
COMMENT ON COLUMN variable_costs.category IS 'impostos, frete, comissao, midia, embalagens, taxas_financeiras';

-- ============================================================================
-- 7. MÓDULO DE IMPORTAÇÃO DE DADOS
-- ============================================================================

-- Tabela de histórico de importações
CREATE TABLE import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NULL,
    status VARCHAR(50) NOT NULL,
    records_total INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_log JSONB NULL,
    imported_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

-- Índices para import_history
CREATE INDEX idx_import_history_type ON import_history(type);
CREATE INDEX idx_import_history_status ON import_history(status);
CREATE INDEX idx_import_history_created_at ON import_history(created_at);

COMMENT ON TABLE import_history IS 'Histórico de importações de arquivos';
COMMENT ON COLUMN import_history.type IS 'financial, products, customers';

-- ============================================================================
-- 8. MÓDULO DE AUDITORIA
-- ============================================================================

-- Tabela de log de auditoria
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para audit_log
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);

COMMENT ON TABLE audit_log IS 'Log de auditoria de todas as ações dos usuários';
COMMENT ON COLUMN audit_log.action IS 'create, update, delete, login, logout, etc.';

-- ============================================================================
-- FIM DO SCRIPT DE CRIAÇÃO
-- ============================================================================
