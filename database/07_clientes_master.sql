-- Tabela de Clientes Master (Multi-tenant)
-- Gerencia todos os clientes que usam o sistema MarketHub CRM

CREATE TABLE IF NOT EXISTS clientes_master (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  empresa VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(50),
  plano VARCHAR(50) DEFAULT 'starter' CHECK (plano IN ('starter', 'professional', 'business', 'enterprise')),
  status VARCHAR(50) DEFAULT 'trial' CHECK (status IN ('trial', 'ativo', 'inativo', 'cancelado')),
  faturamento_total DECIMAL(15, 2) DEFAULT 0,
  total_pedidos INTEGER DEFAULT 0,
  total_produtos INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_master_email ON clientes_master(email);
CREATE INDEX IF NOT EXISTS idx_clientes_master_status ON clientes_master(status);
CREATE INDEX IF NOT EXISTS idx_clientes_master_plano ON clientes_master(plano);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_clientes_master_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clientes_master_timestamp
BEFORE UPDATE ON clientes_master
FOR EACH ROW
EXECUTE FUNCTION update_clientes_master_timestamp();

-- Dados de exemplo (seed data)
INSERT INTO clientes_master (nome, empresa, email, telefone, plano, status, faturamento_total, total_pedidos, total_produtos)
VALUES 
  ('João Silva', 'Silva E-commerce', 'joao@silvaecommerce.com', '(11) 98765-4321', 'professional', 'ativo', 45000.00, 256, 89),
  ('Maria Santos', 'Santos Digital', 'maria@santosdigital.com', '(21) 99876-5432', 'business', 'ativo', 78000.00, 412, 134),
  ('Pedro Oliveira', 'Oliveira Store', 'pedro@oliveirastore.com', '(31) 97654-3210', 'starter', 'trial', 12000.00, 111, 45)
ON CONFLICT (email) DO NOTHING;

-- View para estatísticas gerais
CREATE OR REPLACE VIEW vw_stats_clientes_master AS
SELECT 
  COUNT(*) as total_clientes,
  COUNT(*) FILTER (WHERE status = 'ativo') as clientes_ativos,
  COUNT(*) FILTER (WHERE status = 'trial') as clientes_trial,
  COUNT(*) FILTER (WHERE status = 'inativo') as clientes_inativos,
  SUM(faturamento_total) as faturamento_total,
  SUM(total_pedidos) as pedidos_totais,
  SUM(total_produtos) as produtos_totais,
  ROUND((COUNT(*) FILTER (WHERE status = 'ativo')::numeric / NULLIF(COUNT(*), 0) * 100), 2) as taxa_ativacao
FROM clientes_master;

COMMENT ON TABLE clientes_master IS 'Tabela master de clientes do sistema multi-tenant';
COMMENT ON COLUMN clientes_master.plano IS 'Plano contratado: starter, professional, business, enterprise';
COMMENT ON COLUMN clientes_master.status IS 'Status do cliente: trial, ativo, inativo, cancelado';
