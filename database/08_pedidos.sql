-- Tabela de Pedidos
-- Gerencia todos os pedidos do sistema

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  numero_pedido VARCHAR(100) NOT NULL UNIQUE,
  cliente_nome VARCHAR(255) NOT NULL,
  marketplace VARCHAR(100) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'conferido', 'enviado', 'entregue', 'cancelado')),
  data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_entrega TIMESTAMP,
  rastreio VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_marketplace ON pedidos(marketplace);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_nome);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pedidos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pedidos_timestamp
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION update_pedidos_timestamp();

-- Dados de exemplo (seed data)
INSERT INTO pedidos (numero_pedido, cliente_nome, marketplace, valor_total, status, data_pedido, rastreio)
VALUES 
  ('ML-2025110501', 'João Silva', 'Mercado Livre', 89.90, 'conferido', NOW() - INTERVAL '2 days', 'BR123456789ML'),
  ('ML-2025110502', 'Maria Santos', 'Mercado Livre', 45.90, 'conferido', NOW() - INTERVAL '1 day', 'BR987654321ML'),
  ('ML-2025110503', 'Pedro Oliveira', 'Mercado Livre', 657.80, 'pendente', NOW(), NULL),
  ('ML-2025110504', 'Ana Costa', 'Mercado Livre', 189.90, 'conferido', NOW() - INTERVAL '3 days', 'BR456789123ML'),
  ('ML-2025110505', 'Carlos Mendes', 'Mercado Livre', 32.90, 'pendente', NOW(), NULL),
  ('SH-2025110501', 'Juliana Alves', 'Shopee', 125.50, 'enviado', NOW() - INTERVAL '5 days', 'SH789456123BR'),
  ('AM-2025110501', 'Roberto Lima', 'Amazon', 299.90, 'entregue', NOW() - INTERVAL '10 days', 'AM321654987BR')
ON CONFLICT (numero_pedido) DO NOTHING;

-- View para estatísticas de pedidos
CREATE OR REPLACE VIEW vw_stats_pedidos AS
SELECT 
  COUNT(*) as total_pedidos,
  COUNT(*) FILTER (WHERE status = 'pendente') as pedidos_pendentes,
  COUNT(*) FILTER (WHERE status = 'conferido') as pedidos_conferidos,
  COUNT(*) FILTER (WHERE status = 'enviado') as pedidos_enviados,
  COUNT(*) FILTER (WHERE status = 'entregue') as pedidos_entregues,
  COUNT(*) FILTER (WHERE status = 'cancelado') as pedidos_cancelados,
  SUM(valor_total) as valor_total,
  AVG(valor_total) as ticket_medio,
  COUNT(DISTINCT marketplace) as marketplaces_ativos,
  COUNT(DISTINCT cliente_nome) as clientes_unicos
FROM pedidos;

-- View para pedidos por marketplace
CREATE OR REPLACE VIEW vw_pedidos_por_marketplace AS
SELECT 
  marketplace,
  COUNT(*) as total_pedidos,
  SUM(valor_total) as valor_total,
  AVG(valor_total) as ticket_medio,
  COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
  COUNT(*) FILTER (WHERE status = 'entregue') as entregues
FROM pedidos
GROUP BY marketplace
ORDER BY total_pedidos DESC;

COMMENT ON TABLE pedidos IS 'Tabela de pedidos do sistema';
COMMENT ON COLUMN pedidos.status IS 'Status do pedido: pendente, conferido, enviado, entregue, cancelado';
COMMENT ON COLUMN pedidos.marketplace IS 'Marketplace de origem: Mercado Livre, Shopee, Amazon, etc';
