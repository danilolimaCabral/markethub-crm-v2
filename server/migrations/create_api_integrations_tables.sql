-- Migration: Criar tabelas para integrações com APIs de Logística, Marketplaces e Pagamento
-- Data: 2025-12-13

-- ============================================
-- TABELA GENÉRICA DE INTEGRAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS api_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'correios', 'melhorenvio', 'jadlog', 'shopee', 'amazon', 'magalu', 'pagbank'
  category VARCHAR(50) NOT NULL, -- 'logistics', 'marketplace', 'payment'
  credentials JSONB NOT NULL, -- Armazena tokens, keys, secrets de forma segura
  config JSONB NULL, -- Configurações específicas da integração
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  last_error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, provider)
);

-- ============================================
-- SHOPEE INTEGRATION
-- ============================================
CREATE TABLE IF NOT EXISTS shopee_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  shop_id VARCHAR(255) NOT NULL,
  partner_id VARCHAR(255) NOT NULL,
  partner_key TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  region VARCHAR(10) NOT NULL DEFAULT 'BR', -- BR, SG, MY, TH, VN, ID, PH, etc.
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, shop_id)
);

CREATE TABLE IF NOT EXISTS shopee_products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES shopee_integrations(id) ON DELETE CASCADE,
  product_id INTEGER NULL REFERENCES products(id) ON DELETE SET NULL,
  shopee_item_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
  item_sku VARCHAR(255) NULL,
  images JSONB NULL,
  category_id VARCHAR(255) NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, shopee_item_id)
);

CREATE TABLE IF NOT EXISTS shopee_orders (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES shopee_integrations(id) ON DELETE CASCADE,
  order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
  shopee_order_sn VARCHAR(255) NOT NULL UNIQUE,
  order_status VARCHAR(100) NOT NULL,
  create_time TIMESTAMP NOT NULL,
  update_time TIMESTAMP NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  buyer_username VARCHAR(255) NULL,
  items JSONB NOT NULL,
  shipping_info JSONB NULL,
  payment_info JSONB NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AMAZON SP-API INTEGRATION
-- ============================================
CREATE TABLE IF NOT EXISTS amazon_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  seller_id VARCHAR(255) NOT NULL,
  marketplace_id VARCHAR(50) NOT NULL DEFAULT 'A2Q3Y263D00KWC', -- BR marketplace
  client_id VARCHAR(255) NOT NULL,
  client_secret TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT NULL,
  token_expires_at TIMESTAMP NULL,
  region VARCHAR(10) NOT NULL DEFAULT 'NA', -- NA, EU, FE
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, seller_id)
);

CREATE TABLE IF NOT EXISTS amazon_products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES amazon_integrations(id) ON DELETE CASCADE,
  product_id INTEGER NULL REFERENCES products(id) ON DELETE SET NULL,
  asin VARCHAR(50) NOT NULL,
  sku VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2) NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  condition_type VARCHAR(50) NOT NULL DEFAULT 'New',
  fulfillment_channel VARCHAR(50) NOT NULL DEFAULT 'DEFAULT', -- DEFAULT or AMAZON (FBA)
  status VARCHAR(50) NOT NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, asin, sku)
);

CREATE TABLE IF NOT EXISTS amazon_orders (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES amazon_integrations(id) ON DELETE CASCADE,
  order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
  amazon_order_id VARCHAR(255) NOT NULL UNIQUE,
  order_status VARCHAR(100) NOT NULL,
  purchase_date TIMESTAMP NOT NULL,
  last_update_date TIMESTAMP NOT NULL,
  order_total DECIMAL(10, 2) NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  buyer_email VARCHAR(255) NULL,
  buyer_name VARCHAR(255) NULL,
  items JSONB NOT NULL,
  shipping_address JSONB NULL,
  fulfillment_channel VARCHAR(50) NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MAGALU INTEGRATION
-- ============================================
CREATE TABLE IF NOT EXISTS magalu_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  seller_id VARCHAR(255) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, seller_id)
);

CREATE TABLE IF NOT EXISTS magalu_products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES magalu_integrations(id) ON DELETE CASCADE,
  product_id INTEGER NULL REFERENCES products(id) ON DELETE SET NULL,
  magalu_sku VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  ean VARCHAR(50) NULL,
  images JSONB NULL,
  category VARCHAR(255) NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS magalu_orders (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES magalu_integrations(id) ON DELETE CASCADE,
  order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
  magalu_order_id VARCHAR(255) NOT NULL UNIQUE,
  order_status VARCHAR(100) NOT NULL,
  order_date TIMESTAMP NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_email VARCHAR(255) NULL,
  items JSONB NOT NULL,
  shipping_info JSONB NULL,
  payment_info JSONB NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PAGBANK (PAGSEGURO) INTEGRATION
-- ============================================
CREATE TABLE IF NOT EXISTS pagbank_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  account_id VARCHAR(255) NULL,
  public_key TEXT NOT NULL,
  token TEXT NOT NULL,
  environment VARCHAR(20) NOT NULL DEFAULT 'production', -- 'sandbox' or 'production'
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS pagbank_transactions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES pagbank_integrations(id) ON DELETE CASCADE,
  order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  charge_id VARCHAR(255) NULL,
  status VARCHAR(100) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'debit_card', 'boleto', 'pix'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  customer_name VARCHAR(255) NULL,
  customer_email VARCHAR(255) NULL,
  payment_details JSONB NULL,
  created_at_pagbank TIMESTAMP NOT NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOGÍSTICA: MELHOR ENVIO
-- ============================================
CREATE TABLE IF NOT EXISTS melhorenvio_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  client_id VARCHAR(255) NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS melhorenvio_shipments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES melhorenvio_integrations(id) ON DELETE CASCADE,
  order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
  shipment_id VARCHAR(255) NOT NULL UNIQUE,
  tracking_code VARCHAR(255) NULL,
  service_name VARCHAR(255) NOT NULL,
  status VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  from_address JSONB NOT NULL,
  to_address JSONB NOT NULL,
  package_info JSONB NOT NULL,
  created_at_melhorenvio TIMESTAMP NOT NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOGÍSTICA: CORREIOS
-- ============================================
CREATE TABLE IF NOT EXISTS correios_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  contract_number VARCHAR(255) NOT NULL,
  access_key TEXT NOT NULL,
  cartao_postagem VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS correios_shipments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES correios_integrations(id) ON DELETE CASCADE,
  order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
  tracking_code VARCHAR(255) NOT NULL UNIQUE,
  service_code VARCHAR(50) NOT NULL, -- PAC, SEDEX, etc.
  status VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NULL,
  from_cep VARCHAR(10) NOT NULL,
  to_cep VARCHAR(10) NOT NULL,
  package_info JSONB NOT NULL,
  tracking_events JSONB NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOGÍSTICA: JADLOG
-- ============================================
CREATE TABLE IF NOT EXISTS jadlog_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
  cnpj VARCHAR(20) NOT NULL,
  token TEXT NOT NULL,
  contract_number VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS jadlog_shipments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES jadlog_integrations(id) ON DELETE CASCADE,
  order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
  shipment_id VARCHAR(255) NOT NULL UNIQUE,
  tracking_code VARCHAR(255) NULL,
  service_type VARCHAR(100) NOT NULL, -- .PACKAGE, .COM, etc.
  status VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NULL,
  from_address JSONB NOT NULL,
  to_address JSONB NOT NULL,
  package_info JSONB NOT NULL,
  tracking_events JSONB NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- api_integrations
CREATE INDEX IF NOT EXISTS idx_api_integrations_tenant ON api_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_api_integrations_category ON api_integrations(category);
CREATE INDEX IF NOT EXISTS idx_api_integrations_active ON api_integrations(is_active);

-- shopee
CREATE INDEX IF NOT EXISTS idx_shopee_integrations_tenant ON shopee_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shopee_products_tenant ON shopee_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shopee_products_integration ON shopee_products(integration_id);
CREATE INDEX IF NOT EXISTS idx_shopee_orders_tenant ON shopee_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shopee_orders_status ON shopee_orders(order_status);

-- amazon
CREATE INDEX IF NOT EXISTS idx_amazon_integrations_tenant ON amazon_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_amazon_products_tenant ON amazon_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_amazon_products_asin ON amazon_products(asin);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_tenant ON amazon_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_status ON amazon_orders(order_status);

-- magalu
CREATE INDEX IF NOT EXISTS idx_magalu_integrations_tenant ON magalu_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magalu_products_tenant ON magalu_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magalu_orders_tenant ON magalu_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magalu_orders_status ON magalu_orders(order_status);

-- pagbank
CREATE INDEX IF NOT EXISTS idx_pagbank_integrations_tenant ON pagbank_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pagbank_transactions_tenant ON pagbank_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pagbank_transactions_status ON pagbank_transactions(status);

-- melhorenvio
CREATE INDEX IF NOT EXISTS idx_melhorenvio_integrations_tenant ON melhorenvio_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_melhorenvio_shipments_tenant ON melhorenvio_shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_melhorenvio_shipments_tracking ON melhorenvio_shipments(tracking_code);

-- correios
CREATE INDEX IF NOT EXISTS idx_correios_integrations_tenant ON correios_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_correios_shipments_tenant ON correios_shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_correios_shipments_tracking ON correios_shipments(tracking_code);

-- jadlog
CREATE INDEX IF NOT EXISTS idx_jadlog_integrations_tenant ON jadlog_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jadlog_shipments_tenant ON jadlog_shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jadlog_shipments_tracking ON jadlog_shipments(tracking_code);

-- ============================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- ============================================

-- Função já existe da migration anterior, mas garantindo que existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para api_integrations
CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON api_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para shopee
CREATE TRIGGER update_shopee_integrations_updated_at BEFORE UPDATE ON shopee_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopee_products_updated_at BEFORE UPDATE ON shopee_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopee_orders_updated_at BEFORE UPDATE ON shopee_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para amazon
CREATE TRIGGER update_amazon_integrations_updated_at BEFORE UPDATE ON amazon_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_amazon_products_updated_at BEFORE UPDATE ON amazon_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_amazon_orders_updated_at BEFORE UPDATE ON amazon_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para magalu
CREATE TRIGGER update_magalu_integrations_updated_at BEFORE UPDATE ON magalu_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_magalu_products_updated_at BEFORE UPDATE ON magalu_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_magalu_orders_updated_at BEFORE UPDATE ON magalu_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para pagbank
CREATE TRIGGER update_pagbank_integrations_updated_at BEFORE UPDATE ON pagbank_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagbank_transactions_updated_at BEFORE UPDATE ON pagbank_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para melhorenvio
CREATE TRIGGER update_melhorenvio_integrations_updated_at BEFORE UPDATE ON melhorenvio_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_melhorenvio_shipments_updated_at BEFORE UPDATE ON melhorenvio_shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para correios
CREATE TRIGGER update_correios_integrations_updated_at BEFORE UPDATE ON correios_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_correios_shipments_updated_at BEFORE UPDATE ON correios_shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para jadlog
CREATE TRIGGER update_jadlog_integrations_updated_at BEFORE UPDATE ON jadlog_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jadlog_shipments_updated_at BEFORE UPDATE ON jadlog_shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE api_integrations IS 'Tabela genérica para armazenar todas as integrações de APIs';
COMMENT ON TABLE shopee_integrations IS 'Integrações com Shopee Open Platform';
COMMENT ON TABLE shopee_products IS 'Produtos sincronizados da Shopee';
COMMENT ON TABLE shopee_orders IS 'Pedidos sincronizados da Shopee';
COMMENT ON TABLE amazon_integrations IS 'Integrações com Amazon SP-API';
COMMENT ON TABLE amazon_products IS 'Produtos sincronizados da Amazon';
COMMENT ON TABLE amazon_orders IS 'Pedidos sincronizados da Amazon';
COMMENT ON TABLE magalu_integrations IS 'Integrações com Magalu Open API';
COMMENT ON TABLE magalu_products IS 'Produtos sincronizados do Magalu';
COMMENT ON TABLE magalu_orders IS 'Pedidos sincronizados do Magalu';
COMMENT ON TABLE pagbank_integrations IS 'Integrações com PagBank (PagSeguro)';
COMMENT ON TABLE pagbank_transactions IS 'Transações de pagamento do PagBank';
COMMENT ON TABLE melhorenvio_integrations IS 'Integrações com Melhor Envio';
COMMENT ON TABLE melhorenvio_shipments IS 'Envios gerenciados pelo Melhor Envio';
COMMENT ON TABLE correios_integrations IS 'Integrações com Correios';
COMMENT ON TABLE correios_shipments IS 'Envios gerenciados pelos Correios';
COMMENT ON TABLE jadlog_integrations IS 'Integrações com Jadlog';
COMMENT ON TABLE jadlog_shipments IS 'Envios gerenciados pela Jadlog';
