-- Migration: Criar tabelas para Super Admin Panel
-- Data: 2025-11-10

-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NULL REFERENCES tenants(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT NULL,
  user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  request_url TEXT NULL,
  request_method VARCHAR(10) NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de métricas do sistema
CREATE TABLE IF NOT EXISTS system_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15, 4) NOT NULL,
  tenant_id INTEGER NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metadata JSONB NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_logs_tenant ON system_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_tenant_level_created ON system_logs(tenant_id, level, created_at);

CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_tenant ON system_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_created_at ON system_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_created ON system_metrics(metric_type, created_at);

-- Comentários nas tabelas
COMMENT ON TABLE system_logs IS 'Logs do sistema para monitoramento e debugging';
COMMENT ON TABLE system_metrics IS 'Métricas de performance e uso do sistema';

COMMENT ON COLUMN system_logs.level IS 'Nível do log: info, warning, error, critical';
COMMENT ON COLUMN system_logs.category IS 'Categoria do log: http, application, database, etc';
COMMENT ON COLUMN system_logs.metadata IS 'Dados adicionais em formato JSON';

COMMENT ON COLUMN system_metrics.metric_type IS 'Tipo da métrica: request, performance, usage, etc';
COMMENT ON COLUMN system_metrics.metric_name IS 'Nome específico da métrica';
COMMENT ON COLUMN system_metrics.metric_value IS 'Valor numérico da métrica';
