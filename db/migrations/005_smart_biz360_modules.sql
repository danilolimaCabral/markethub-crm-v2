-- Migration: Módulos Smart Biz360
-- Data: 2025-12-16
-- Objetivo: Criar tabelas para os módulos principais do Smart Biz360

-- =====================================================
-- MÓDULO: AUTOMAÇÃO TRIBUTÁRIA
-- =====================================================

-- Configurações fiscais do tenant
CREATE TABLE IF NOT EXISTS tax_settings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Regime tributário
  tax_regime VARCHAR(50) NOT NULL DEFAULT 'simples_nacional',
  -- simples_nacional, lucro_presumido, lucro_real
  
  -- Dados fiscais
  inscricao_estadual VARCHAR(20),
  inscricao_municipal VARCHAR(20),
  cnae_principal VARCHAR(10),
  
  -- Alíquotas padrão
  default_icms_rate DECIMAL(5, 2) DEFAULT 0,
  default_pis_rate DECIMAL(5, 2) DEFAULT 0.65,
  default_cofins_rate DECIMAL(5, 2) DEFAULT 3.00,
  default_iss_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Configurações
  auto_calculate_taxes BOOLEAN DEFAULT true,
  generate_sped BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id)
);

-- Obrigações fiscais
CREATE TABLE IF NOT EXISTS tax_obligations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- darf, guia_icms, sped, efd, dctf
  
  reference_period VARCHAR(7), -- YYYY-MM
  due_date DATE NOT NULL,
  
  status VARCHAR(30) DEFAULT 'pending', -- pending, generated, paid, overdue
  amount DECIMAL(12, 2),
  
  document_url TEXT,
  payment_code VARCHAR(100),
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Histórico de cálculos tributários
CREATE TABLE IF NOT EXISTS tax_calculations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  reference_id INTEGER, -- ID da transação/pedido
  reference_type VARCHAR(50), -- order, invoice, purchase
  
  base_value DECIMAL(12, 2) NOT NULL,
  
  -- Impostos calculados
  icms_value DECIMAL(12, 2) DEFAULT 0,
  icms_rate DECIMAL(5, 2) DEFAULT 0,
  pis_value DECIMAL(12, 2) DEFAULT 0,
  pis_rate DECIMAL(5, 2) DEFAULT 0,
  cofins_value DECIMAL(12, 2) DEFAULT 0,
  cofins_rate DECIMAL(5, 2) DEFAULT 0,
  iss_value DECIMAL(12, 2) DEFAULT 0,
  iss_rate DECIMAL(5, 2) DEFAULT 0,
  ipi_value DECIMAL(12, 2) DEFAULT 0,
  ipi_rate DECIMAL(5, 2) DEFAULT 0,
  
  total_taxes DECIMAL(12, 2) NOT NULL,
  
  calculation_details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MÓDULO: FLUXO DE CAIXA INTELIGENTE
-- =====================================================

-- Contas bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  bank_code VARCHAR(10),
  bank_name VARCHAR(100),
  agency VARCHAR(20),
  account_number VARCHAR(30),
  account_type VARCHAR(30) DEFAULT 'checking', -- checking, savings, investment
  
  current_balance DECIMAL(14, 2) DEFAULT 0,
  last_sync TIMESTAMP,
  
  -- Integração bancária
  integration_type VARCHAR(50), -- manual, open_banking, api
  integration_credentials JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transações financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bank_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  type VARCHAR(20) NOT NULL, -- income, expense, transfer
  category VARCHAR(50),
  subcategory VARCHAR(50),
  
  description TEXT NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  
  transaction_date DATE NOT NULL,
  due_date DATE,
  payment_date DATE,
  
  status VARCHAR(30) DEFAULT 'pending', -- pending, paid, overdue, canceled
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type VARCHAR(20), -- daily, weekly, monthly, yearly
  recurrence_end_date DATE,
  parent_transaction_id INTEGER REFERENCES financial_transactions(id),
  
  -- Referências
  reference_type VARCHAR(50), -- order, invoice, payroll, tax
  reference_id INTEGER,
  
  -- Conciliação
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP,
  external_id VARCHAR(100),
  
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categorias de transações
CREATE TABLE IF NOT EXISTS transaction_categories (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- income, expense
  parent_id INTEGER REFERENCES transaction_categories(id),
  
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50),
  
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Previsões de fluxo de caixa
CREATE TABLE IF NOT EXISTS cashflow_forecasts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  forecast_date DATE NOT NULL,
  
  predicted_income DECIMAL(14, 2) DEFAULT 0,
  predicted_expense DECIMAL(14, 2) DEFAULT 0,
  predicted_balance DECIMAL(14, 2) DEFAULT 0,
  
  confidence_level DECIMAL(5, 2), -- 0-100%
  
  model_version VARCHAR(20),
  calculation_details JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MÓDULO: GESTÃO DE EQUIPE E TREINAMENTO
-- =====================================================

-- Tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed, canceled
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Categorização
  category VARCHAR(50),
  tags JSONB DEFAULT '[]',
  
  -- Tempo
  estimated_hours DECIMAL(5, 2),
  actual_hours DECIMAL(5, 2),
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  
  parent_task_id INTEGER REFERENCES tasks(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comentários em tarefas
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cursos de treinamento
CREATE TABLE IF NOT EXISTS training_courses (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = curso global
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  category VARCHAR(50), -- financeiro, vendas, estoque, operacional
  target_role VARCHAR(50), -- admin, manager, operator, all
  
  duration_minutes INTEGER,
  
  content JSONB DEFAULT '[]', -- Array de módulos/lições
  
  is_active BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progresso de treinamento
CREATE TABLE IF NOT EXISTS training_progress (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  
  progress_percent INTEGER DEFAULT 0,
  current_module INTEGER DEFAULT 0,
  
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  quiz_scores JSONB DEFAULT '[]',
  
  UNIQUE(user_id, course_id)
);

-- Gamificação - Pontos e Badges
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  achievement_type VARCHAR(50) NOT NULL, -- badge, points, level
  achievement_name VARCHAR(100) NOT NULL,
  
  points INTEGER DEFAULT 0,
  
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  metadata JSONB DEFAULT '{}'
);

-- Performance de colaboradores
CREATE TABLE IF NOT EXISTS employee_performance (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  tasks_completed INTEGER DEFAULT 0,
  tasks_on_time INTEGER DEFAULT 0,
  tasks_late INTEGER DEFAULT 0,
  
  average_task_time DECIMAL(10, 2),
  
  training_completed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  
  performance_score DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MÓDULO: ANÁLISE PREDITIVA
-- =====================================================

-- Previsões de vendas
CREATE TABLE IF NOT EXISTS sales_forecasts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  forecast_date DATE NOT NULL,
  forecast_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly
  
  predicted_revenue DECIMAL(14, 2),
  predicted_orders INTEGER,
  predicted_units INTEGER,
  
  confidence_level DECIMAL(5, 2),
  
  factors JSONB DEFAULT '{}', -- Fatores considerados
  
  actual_revenue DECIMAL(14, 2), -- Preenchido após o período
  actual_orders INTEGER,
  
  accuracy_score DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recomendações de estoque
CREATE TABLE IF NOT EXISTS stock_recommendations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  
  current_stock INTEGER,
  recommended_stock INTEGER,
  
  action VARCHAR(30), -- reorder, reduce, maintain
  urgency VARCHAR(20), -- low, medium, high, critical
  
  predicted_stockout_date DATE,
  days_of_stock INTEGER,
  
  reorder_quantity INTEGER,
  reorder_point INTEGER,
  
  analysis_details JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alertas de anomalias
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  alert_type VARCHAR(50) NOT NULL, -- sales_drop, returns_spike, unusual_pattern
  severity VARCHAR(20) NOT NULL, -- info, warning, critical
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  metric_name VARCHAR(100),
  expected_value DECIMAL(14, 2),
  actual_value DECIMAL(14, 2),
  deviation_percent DECIMAL(5, 2),
  
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MÓDULO: FEEDBACK & RETENÇÃO
-- =====================================================

-- Feedback dos usuários
CREATE TABLE IF NOT EXISTS user_feedback (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  type VARCHAR(30) NOT NULL, -- bug, feature, improvement, complaint, praise
  category VARCHAR(50),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  rating INTEGER, -- 1-5
  
  status VARCHAR(30) DEFAULT 'new', -- new, in_review, planned, resolved, closed
  
  response TEXT,
  responded_by INTEGER REFERENCES users(id),
  responded_at TIMESTAMP,
  
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Métricas de engajamento
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  metric_date DATE NOT NULL,
  
  logins INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  actions_performed INTEGER DEFAULT 0,
  
  features_used JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dicas de retenção
CREATE TABLE IF NOT EXISTS retention_tips (
  id SERIAL PRIMARY KEY,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  target_segment VARCHAR(50), -- new_user, inactive, power_user
  trigger_condition JSONB DEFAULT '{}',
  
  feature_to_highlight VARCHAR(100),
  action_url VARCHAR(255),
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dicas exibidas aos usuários
CREATE TABLE IF NOT EXISTS user_tips_shown (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tip_id INTEGER NOT NULL REFERENCES retention_tips(id) ON DELETE CASCADE,
  
  shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicked BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  
  UNIQUE(user_id, tip_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Automação Tributária
CREATE INDEX IF NOT EXISTS idx_tax_settings_tenant ON tax_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_tenant ON tax_obligations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_due ON tax_obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_tenant ON tax_calculations(tenant_id);

-- Fluxo de Caixa
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant ON financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cashflow_forecasts_tenant ON cashflow_forecasts(tenant_id);

-- Gestão de Equipe
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_training_progress_user ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Análise Preditiva
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_tenant ON sales_forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_recommendations_tenant ON stock_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_tenant ON anomaly_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_unread ON anomaly_alerts(tenant_id, is_read);

-- Feedback
CREATE INDEX IF NOT EXISTS idx_user_feedback_tenant ON user_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_tenant ON engagement_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_date ON engagement_metrics(metric_date);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_tax_settings_updated_at 
  BEFORE UPDATE ON tax_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_obligations_updated_at 
  BEFORE UPDATE ON tax_obligations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at 
  BEFORE UPDATE ON bank_accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at 
  BEFORE UPDATE ON financial_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_courses_updated_at 
  BEFORE UPDATE ON training_courses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feedback_updated_at 
  BEFORE UPDATE ON user_feedback 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
