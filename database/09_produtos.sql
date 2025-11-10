-- Tabela de Produtos
-- Gerencia todos os produtos do sistema

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  categoria VARCHAR(100) DEFAULT 'Geral',
  preco_venda DECIMAL(15, 2) NOT NULL,
  preco_custo DECIMAL(15, 2) DEFAULT 0,
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 5,
  status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado')),
  marketplace VARCHAR(100) DEFAULT 'Mercado Livre',
  margem_lucro DECIMAL(5, 2) DEFAULT 0,
  descricao TEXT,
  imagem_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON produtos(sku);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque ON produtos(estoque_atual);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_produtos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_produtos_timestamp
BEFORE UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION update_produtos_timestamp();

-- Trigger para calcular margem de lucro automaticamente
CREATE OR REPLACE FUNCTION calcular_margem_lucro()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.preco_venda > 0 AND NEW.preco_custo > 0 THEN
    NEW.margem_lucro = ROUND(((NEW.preco_venda - NEW.preco_custo) / NEW.preco_venda * 100)::numeric, 2);
  ELSE
    NEW.margem_lucro = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_margem_lucro
BEFORE INSERT OR UPDATE OF preco_venda, preco_custo ON produtos
FOR EACH ROW
EXECUTE FUNCTION calcular_margem_lucro();

-- Dados de exemplo (seed data)
INSERT INTO produtos (nome, sku, categoria, preco_venda, preco_custo, estoque_atual, estoque_minimo, marketplace)
VALUES 
  ('Antena Digital 4K HDTV', 'ANT-4K-001', 'Antenas', 89.90, 45.00, 50, 10, 'Mercado Livre'),
  ('Antena Interna Amplificada', 'ANT-INT-002', 'Antenas', 65.90, 32.00, 35, 10, 'Mercado Livre'),
  ('Cabo HDMI 2.0 Premium 2m', 'CAB-HDMI-003', 'Cabos', 29.90, 12.00, 120, 20, 'Mercado Livre'),
  ('Conversor Digital Full HD', 'CONV-FHD-004', 'Conversores', 149.90, 75.00, 25, 5, 'Mercado Livre'),
  ('Suporte TV Parede 32-55"', 'SUP-TV-005', 'Suportes', 79.90, 35.00, 40, 10, 'Mercado Livre'),
  ('Cabo Coaxial RG6 10m', 'CAB-COAX-006', 'Cabos', 24.90, 10.00, 80, 15, 'Mercado Livre'),
  ('Amplificador de Sinal TV', 'AMP-SIN-007', 'Amplificadores', 119.90, 55.00, 18, 5, 'Mercado Livre'),
  ('Antena Externa Log 28 Elementos', 'ANT-EXT-008', 'Antenas', 199.90, 95.00, 12, 5, 'Mercado Livre')
ON CONFLICT (sku) DO NOTHING;

-- View para estatísticas de produtos
CREATE OR REPLACE VIEW vw_stats_produtos AS
SELECT 
  COUNT(*) as total_produtos,
  COUNT(*) FILTER (WHERE status = 'ativo') as produtos_ativos,
  COUNT(*) FILTER (WHERE status = 'inativo') as produtos_inativos,
  COUNT(*) FILTER (WHERE estoque_atual <= estoque_minimo) as produtos_estoque_baixo,
  COUNT(*) FILTER (WHERE estoque_atual = 0) as produtos_sem_estoque,
  SUM(estoque_atual * preco_venda) as valor_estoque,
  SUM(estoque_atual * preco_custo) as custo_estoque,
  AVG(margem_lucro) as margem_media,
  COUNT(DISTINCT categoria) as categorias_ativas
FROM produtos;

-- View para produtos por categoria
CREATE OR REPLACE VIEW vw_produtos_por_categoria AS
SELECT 
  categoria,
  COUNT(*) as total_produtos,
  SUM(estoque_atual) as estoque_total,
  AVG(margem_lucro) as margem_media,
  SUM(estoque_atual * preco_venda) as valor_estoque
FROM produtos
GROUP BY categoria
ORDER BY total_produtos DESC;

-- View para alertas de estoque
CREATE OR REPLACE VIEW vw_alertas_estoque AS
SELECT 
  id,
  nome,
  sku,
  categoria,
  estoque_atual,
  estoque_minimo,
  (estoque_minimo - estoque_atual) as quantidade_repor,
  CASE 
    WHEN estoque_atual = 0 THEN 'CRÍTICO'
    WHEN estoque_atual <= estoque_minimo THEN 'BAIXO'
    ELSE 'OK'
  END as nivel_alerta
FROM produtos
WHERE estoque_atual <= estoque_minimo
ORDER BY estoque_atual ASC, quantidade_repor DESC;

-- View para produtos mais rentáveis
CREATE OR REPLACE VIEW vw_produtos_rentaveis AS
SELECT 
  id,
  nome,
  sku,
  categoria,
  preco_venda,
  preco_custo,
  margem_lucro,
  estoque_atual,
  (preco_venda - preco_custo) as lucro_unitario,
  (preco_venda - preco_custo) * estoque_atual as lucro_potencial
FROM produtos
WHERE status = 'ativo' AND estoque_atual > 0
ORDER BY margem_lucro DESC, lucro_potencial DESC;

COMMENT ON TABLE produtos IS 'Tabela de produtos do sistema';
COMMENT ON COLUMN produtos.sku IS 'Código único do produto (Stock Keeping Unit)';
COMMENT ON COLUMN produtos.margem_lucro IS 'Margem de lucro em porcentagem (calculada automaticamente)';
COMMENT ON COLUMN produtos.status IS 'Status do produto: ativo, inativo, pausado';
