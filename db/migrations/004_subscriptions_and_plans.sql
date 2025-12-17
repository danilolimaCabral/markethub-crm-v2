-- Migration: Sistema de Assinaturas e Planos para SaaS Multi-Tenant
-- Data: 2025-12-16
-- Objetivo: Implementar sistema de assinaturas para comercialização do Smart Biz360

-- =====================================================
-- TABELA: plans - Planos de Assinatura
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Limites do plano
  max_users INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 100,
  max_orders_month INTEGER NOT NULL DEFAULT 500,
  max_storage_mb INTEGER NOT NULL DEFAULT 500,
  
  -- Features habilitadas (JSON)
  features JSONB NOT NULL DEFAULT '{}',
  
  -- Módulos disponíveis
  module_tax_automation BOOLEAN DEFAULT false,
  module_cashflow BOOLEAN DEFAULT false,
  module_team_management BOOLEAN DEFAULT false,
  module_predictive_analytics BOOLEAN DEFAULT false,
  module_integrations BOOLEAN DEFAULT false,
  module_api_access BOOLEAN DEFAULT false,
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir planos padrão
INSERT INTO plans (name, display_name, description, price_monthly, price_yearly, max_users, max_products, max_orders_month, max_storage_mb, features, module_tax_automation, module_cashflow, module_team_management, module_predictive_analytics, module_integrations, module_api_access, sort_order) VALUES
('free', 'Gratuito', 'Ideal para começar a conhecer o sistema', 0, 0, 1, 50, 100, 100, 
 '{"dashboard": true, "basic_reports": true}', 
 false, false, false, false, false, false, 1),

('starter', 'Starter', 'Perfeito para pequenos negócios', 97.00, 970.00, 3, 500, 1000, 1000, 
 '{"dashboard": true, "basic_reports": true, "email_support": true}', 
 false, true, false, false, true, false, 2),

('professional', 'Professional', 'Para empresas em crescimento', 197.00, 1970.00, 10, 2000, 5000, 5000, 
 '{"dashboard": true, "advanced_reports": true, "priority_support": true, "custom_branding": true}', 
 true, true, true, false, true, false, 3),

('business', 'Business', 'Solução completa para médias empresas', 397.00, 3970.00, 25, 10000, 20000, 20000, 
 '{"dashboard": true, "advanced_reports": true, "priority_support": true, "custom_branding": true, "dedicated_support": true}', 
 true, true, true, true, true, true, 4),

('enterprise', 'Enterprise', 'Personalizado para grandes operações', 0, 0, -1, -1, -1, -1, 
 '{"dashboard": true, "advanced_reports": true, "dedicated_support": true, "custom_branding": true, "sla": true, "custom_integrations": true}', 
 true, true, true, true, true, true, 5)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- TABELA: subscriptions - Assinaturas dos Tenants
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  
  -- Status da assinatura
  status VARCHAR(50) NOT NULL DEFAULT 'trialing',
  -- Valores possíveis: trialing, active, past_due, canceled, unpaid, paused
  
  -- Datas importantes
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  
  -- Stripe IDs
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Billing
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
  next_billing_date TIMESTAMP,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id)
);

-- =====================================================
-- TABELA: subscription_history - Histórico de Mudanças
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_history (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  action VARCHAR(50) NOT NULL, -- created, upgraded, downgraded, canceled, reactivated, payment_failed
  from_plan_id INTEGER REFERENCES plans(id),
  to_plan_id INTEGER REFERENCES plans(id),
  
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: invoices - Faturas
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  stripe_invoice_id VARCHAR(255),
  invoice_number VARCHAR(50),
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, open, paid, void, uncollectible
  
  description TEXT,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  
  pdf_url TEXT,
  hosted_invoice_url TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: payment_methods - Métodos de Pagamento
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  stripe_payment_method_id VARCHAR(255),
  type VARCHAR(50) NOT NULL, -- card, boleto, pix
  
  -- Dados do cartão (mascarados)
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: usage_records - Registro de Uso
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_records (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  metric VARCHAR(50) NOT NULL, -- users, products, orders, storage, api_calls
  quantity INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_tenant ON subscription_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant ON payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_tenant ON usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(period_start, period_end);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
  BEFORE UPDATE ON payment_methods 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at 
  BEFORE UPDATE ON plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE plans IS 'Planos de assinatura disponíveis para comercialização';
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas dos tenants';
COMMENT ON TABLE subscription_history IS 'Histórico de alterações nas assinaturas';
COMMENT ON TABLE invoices IS 'Faturas geradas para os tenants';
COMMENT ON TABLE payment_methods IS 'Métodos de pagamento cadastrados pelos tenants';
COMMENT ON TABLE usage_records IS 'Registro de uso para controle de limites';
