-- Migration: Criar tabelas para integração com Mercado Livre
-- Data: 2025-11-10

-- Tabela de integrações do Mercado Livre
CREATE TABLE IF NOT EXISTS mercadolivre_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ml_user_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, ml_user_id)
);

-- Tabela de produtos do Mercado Livre
CREATE TABLE IF NOT EXISTS ml_products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES mercadolivre_integrations(id) ON DELETE CASCADE,
  product_id INTEGER NULL REFERENCES products(id) ON DELETE SET NULL,
  ml_item_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  permalink VARCHAR(500) NOT NULL,
  thumbnail VARCHAR(500) NULL,
  category_id VARCHAR(255) NOT NULL,
  listing_type_id VARCHAR(255) NOT NULL,
  condition VARCHAR(50) NOT NULL DEFAULT 'new',
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos do Mercado Livre
CREATE TABLE IF NOT EXISTS ml_orders (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES mercadolivre_integrations(id) ON DELETE CASCADE,
  order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
  ml_order_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(100) NOT NULL,
  date_created TIMESTAMP NOT NULL,
  date_closed TIMESTAMP NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) NOT NULL,
  currency_id VARCHAR(10) NOT NULL,
  buyer_id VARCHAR(255) NOT NULL,
  buyer_nickname VARCHAR(255) NULL,
  items JSONB NOT NULL,
  payments JSONB NOT NULL,
  shipping JSONB NOT NULL,
  last_sync_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ml_integrations_tenant ON mercadolivre_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ml_integrations_ml_user ON mercadolivre_integrations(ml_user_id);
CREATE INDEX IF NOT EXISTS idx_ml_products_tenant ON ml_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ml_products_integration ON ml_products(integration_id);
CREATE INDEX IF NOT EXISTS idx_ml_products_ml_item ON ml_products(ml_item_id);
CREATE INDEX IF NOT EXISTS idx_ml_orders_tenant ON ml_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ml_orders_integration ON ml_orders(integration_id);
CREATE INDEX IF NOT EXISTS idx_ml_orders_ml_order ON ml_orders(ml_order_id);
CREATE INDEX IF NOT EXISTS idx_ml_orders_status ON ml_orders(status);
CREATE INDEX IF NOT EXISTS idx_ml_orders_date_created ON ml_orders(date_created);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mercadolivre_integrations_updated_at BEFORE UPDATE ON mercadolivre_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ml_products_updated_at BEFORE UPDATE ON ml_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ml_orders_updated_at BEFORE UPDATE ON ml_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE mercadolivre_integrations IS 'Armazena as integrações ativas com o Mercado Livre por tenant';
COMMENT ON TABLE ml_products IS 'Produtos sincronizados do Mercado Livre';
COMMENT ON TABLE ml_orders IS 'Pedidos sincronizados do Mercado Livre';
