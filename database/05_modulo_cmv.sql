-- ============================================================================
-- MÓDULO DE CMV (Custo de Mercadoria Vendida)
-- MarketHub CRM - Extensão do Database Schema
-- Author: Manus AI
-- Date: Novembro 2025
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
-- ============================================================================

-- Registra todas as entradas e saídas de estoque para cálculo preciso do CMV
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL, -- 'entrada', 'saida', 'ajuste', 'perda'
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(15,2) NOT NULL, -- Custo unitário no momento da movimentação
    total_cost DECIMAL(15,2) NOT NULL, -- quantity * unit_cost
    reference_type VARCHAR(50) NULL, -- 'compra', 'venda', 'devolucao', 'ajuste_manual'
    reference_id UUID NULL, -- ID da compra, venda ou pedido relacionado
    notes TEXT NULL,
    movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para stock_movements
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

COMMENT ON TABLE stock_movements IS 'Movimentações de estoque para cálculo de CMV pelo método PEPS/FIFO';
COMMENT ON COLUMN stock_movements.unit_cost IS 'Custo unitário no momento da movimentação (inclui impostos e frete)';
COMMENT ON COLUMN stock_movements.reference_type IS 'Tipo de documento que originou a movimentação';

-- ============================================================================
-- 2. TABELA DE COMPRAS DE MERCADORIAS
-- ============================================================================

-- Registra compras de fornecedores para controle de estoque inicial e custos
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(255) NOT NULL,
    supplier_cnpj VARCHAR(18) NULL,
    invoice_number VARCHAR(100) NULL,
    purchase_date DATE NOT NULL,
    payment_due_date DATE NULL,
    subtotal DECIMAL(15,2) NOT NULL, -- Valor dos produtos sem impostos
    shipping_cost DECIMAL(15,2) DEFAULT 0, -- Frete da compra
    import_tax DECIMAL(15,2) DEFAULT 0, -- Taxas de importação
    icms DECIMAL(15,2) DEFAULT 0,
    ipi DECIMAL(15,2) DEFAULT 0,
    pis DECIMAL(15,2) DEFAULT 0,
    cofins DECIMAL(15,2) DEFAULT 0,
    other_costs DECIMAL(15,2) DEFAULT 0, -- Outros custos (armazenagem, etc)
    total_cost DECIMAL(15,2) NOT NULL, -- Custo total da compra
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
    payment_method VARCHAR(50) NULL,
    notes TEXT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para purchases
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_name);
CREATE INDEX idx_purchases_status ON purchases(status);

COMMENT ON TABLE purchases IS 'Compras de mercadorias de fornecedores';
COMMENT ON COLUMN purchases.total_cost IS 'Custo total incluindo todos os impostos e despesas';

-- ============================================================================
-- 3. TABELA DE ITENS DE COMPRA
-- ============================================================================

-- Detalha os produtos de cada compra
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL, -- Preço unitário sem impostos
    unit_cost DECIMAL(15,2) NOT NULL, -- Custo unitário final (com rateio de impostos e frete)
    total_cost DECIMAL(15,2) NOT NULL, -- quantity * unit_cost
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para purchase_items
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);

COMMENT ON TABLE purchase_items IS 'Itens detalhados de cada compra';
COMMENT ON COLUMN purchase_items.unit_cost IS 'Custo unitário final com rateio proporcional de impostos e frete';

-- ============================================================================
-- 4. TABELA DE PERÍODOS DE CMV
-- ============================================================================

-- Armazena cálculos de CMV por período (mensal, trimestral, anual)
CREATE TABLE cmv_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_type VARCHAR(20) NOT NULL, -- 'mensal', 'trimestral', 'anual'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_stock_value DECIMAL(15,2) NOT NULL, -- Valor do estoque inicial
    purchases_value DECIMAL(15,2) NOT NULL, -- Valor das compras do período
    final_stock_value DECIMAL(15,2) NOT NULL, -- Valor do estoque final
    cmv_value DECIMAL(15,2) NOT NULL, -- CMV calculado
    gross_revenue DECIMAL(15,2) NULL, -- Receita bruta do período
    cmv_percentage DECIMAL(5,2) NULL, -- CMV como % da receita
    gross_margin_percentage DECIMAL(5,2) NULL, -- Margem bruta %
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculated_by UUID REFERENCES users(id),
    UNIQUE(period_type, start_date, end_date)
);

-- Índices para cmv_periods
CREATE INDEX idx_cmv_periods_dates ON cmv_periods(start_date, end_date);
CREATE INDEX idx_cmv_periods_type ON cmv_periods(period_type);

COMMENT ON TABLE cmv_periods IS 'Cálculos de CMV por período para análise histórica';
COMMENT ON COLUMN cmv_periods.cmv_value IS 'CMV = (Estoque Inicial + Compras) - Estoque Final';

-- ============================================================================
-- 5. TABELA DE CMV POR PRODUTO
-- ============================================================================

-- Armazena análise de CMV e margem por produto
CREATE TABLE product_cmv_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    units_sold INTEGER NOT NULL,
    average_unit_cost DECIMAL(15,2) NOT NULL, -- Custo médio unitário
    total_cmv DECIMAL(15,2) NOT NULL, -- CMV total do produto no período
    gross_revenue DECIMAL(15,2) NOT NULL, -- Receita bruta
    gross_profit DECIMAL(15,2) NOT NULL, -- Lucro bruto (receita - CMV)
    gross_margin_percentage DECIMAL(5,2) NOT NULL, -- Margem bruta %
    variable_costs DECIMAL(15,2) DEFAULT 0, -- Custos variáveis (PAX)
    net_profit DECIMAL(15,2) NULL, -- Lucro líquido (após custos variáveis)
    net_margin_percentage DECIMAL(5,2) NULL, -- Margem líquida %
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, period_start, period_end)
);

-- Índices para product_cmv_analysis
CREATE INDEX idx_product_cmv_product ON product_cmv_analysis(product_id);
CREATE INDEX idx_product_cmv_dates ON product_cmv_analysis(period_start, period_end);
CREATE INDEX idx_product_cmv_margin ON product_cmv_analysis(gross_margin_percentage);

COMMENT ON TABLE product_cmv_analysis IS 'Análise de CMV e rentabilidade por produto';
COMMENT ON COLUMN product_cmv_analysis.average_unit_cost IS 'Custo médio ponderado do produto no período';

-- ============================================================================
-- 6. TABELA DE CMV POR CATEGORIA
-- ============================================================================

-- Análise agregada de CMV por categoria de produtos
CREATE TABLE category_cmv_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    units_sold INTEGER NOT NULL,
    total_cmv DECIMAL(15,2) NOT NULL,
    gross_revenue DECIMAL(15,2) NOT NULL,
    gross_profit DECIMAL(15,2) NOT NULL,
    gross_margin_percentage DECIMAL(5,2) NOT NULL,
    products_count INTEGER NOT NULL, -- Quantidade de produtos na categoria
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, period_start, period_end)
);

-- Índices para category_cmv_analysis
CREATE INDEX idx_category_cmv_category ON category_cmv_analysis(category);
CREATE INDEX idx_category_cmv_dates ON category_cmv_analysis(period_start, period_end);

COMMENT ON TABLE category_cmv_analysis IS 'Análise de CMV agregada por categoria';

-- ============================================================================
-- 7. TABELA DE ALERTAS DE MARGEM
-- ============================================================================

-- Alertas automáticos para produtos com margem baixa ou negativa
CREATE TABLE margin_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'margem_baixa', 'margem_negativa', 'cmv_alto'
    current_margin DECIMAL(5,2) NOT NULL,
    threshold_margin DECIMAL(5,2) NOT NULL, -- Margem mínima configurada
    current_cmv DECIMAL(15,2) NOT NULL,
    sale_price DECIMAL(15,2) NOT NULL,
    recommended_price DECIMAL(15,2) NULL, -- Preço sugerido para atingir margem desejada
    status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'resolvido', 'ignorado'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by UUID REFERENCES users(id)
);

-- Índices para margin_alerts
CREATE INDEX idx_margin_alerts_product ON margin_alerts(product_id);
CREATE INDEX idx_margin_alerts_status ON margin_alerts(status);
CREATE INDEX idx_margin_alerts_type ON margin_alerts(alert_type);

COMMENT ON TABLE margin_alerts IS 'Alertas automáticos de produtos com margem inadequada';

-- ============================================================================
-- 8. VIEWS PARA ANÁLISE DE CMV
-- ============================================================================

-- View: Estoque atual valorizado pelo custo médio
CREATE OR REPLACE VIEW current_stock_value AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    p.category,
    p.stock_quantity,
    COALESCE(AVG(sm.unit_cost), p.cost_price) AS average_unit_cost,
    p.stock_quantity * COALESCE(AVG(sm.unit_cost), p.cost_price) AS total_stock_value
FROM products p
LEFT JOIN stock_movements sm ON p.id = sm.product_id 
    AND sm.movement_type = 'entrada'
    AND sm.movement_date >= CURRENT_DATE - INTERVAL '90 days'
WHERE p.is_active = TRUE
GROUP BY p.id, p.sku, p.name, p.category, p.stock_quantity, p.cost_price;

COMMENT ON VIEW current_stock_value IS 'Valor atual do estoque calculado pelo custo médio ponderado';

-- View: Análise de rentabilidade de produtos
CREATE OR REPLACE VIEW product_profitability AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    p.category,
    p.cost_price AS current_cost,
    p.sale_price,
    p.sale_price - p.cost_price AS gross_profit_per_unit,
    CASE 
        WHEN p.sale_price > 0 THEN 
            ((p.sale_price - p.cost_price) / p.sale_price * 100)
        ELSE 0 
    END AS gross_margin_percentage,
    p.stock_quantity,
    (p.sale_price - p.cost_price) * p.stock_quantity AS potential_profit
FROM products p
WHERE p.is_active = TRUE;

COMMENT ON VIEW product_profitability IS 'Análise de rentabilidade atual dos produtos';

-- ============================================================================
-- 9. FUNÇÕES PARA CÁLCULO AUTOMÁTICO
-- ============================================================================

-- Função: Calcular custo médio ponderado de um produto
CREATE OR REPLACE FUNCTION calculate_average_cost(p_product_id UUID, p_end_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_average_cost DECIMAL(15,2);
BEGIN
    SELECT 
        COALESCE(
            SUM(unit_cost * quantity) / NULLIF(SUM(quantity), 0),
            0
        )
    INTO v_average_cost
    FROM stock_movements
    WHERE product_id = p_product_id
        AND movement_type = 'entrada'
        AND movement_date <= p_end_date;
    
    RETURN COALESCE(v_average_cost, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_average_cost IS 'Calcula custo médio ponderado de um produto até uma data';

-- Função: Calcular CMV de um período
CREATE OR REPLACE FUNCTION calculate_cmv_period(
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    initial_stock DECIMAL(15,2),
    purchases DECIMAL(15,2),
    final_stock DECIMAL(15,2),
    cmv DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH stock_values AS (
        SELECT 
            -- Estoque inicial (valor do estoque no início do período)
            (SELECT COALESCE(SUM(csv.total_stock_value), 0)
             FROM current_stock_value csv
             WHERE EXISTS (
                 SELECT 1 FROM stock_movements sm
                 WHERE sm.product_id = csv.product_id
                 AND sm.movement_date < p_start_date
             )) AS initial_stock_value,
            
            -- Compras do período
            (SELECT COALESCE(SUM(total_cost), 0)
             FROM purchases
             WHERE purchase_date >= p_start_date
             AND purchase_date <= p_end_date
             AND status != 'cancelado') AS purchases_value,
            
            -- Estoque final (valor do estoque no final do período)
            (SELECT COALESCE(SUM(csv.total_stock_value), 0)
             FROM current_stock_value csv) AS final_stock_value
    )
    SELECT 
        sv.initial_stock_value,
        sv.purchases_value,
        sv.final_stock_value,
        (sv.initial_stock_value + sv.purchases_value - sv.final_stock_value) AS cmv_value
    FROM stock_values sv;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_cmv_period IS 'Calcula CMV de um período usando fórmula: (EI + Compras) - EF';

-- ============================================================================
-- 10. TRIGGERS AUTOMÁTICOS
-- ============================================================================

-- Trigger: Criar movimentação de estoque ao registrar compra
CREATE OR REPLACE FUNCTION trigger_purchase_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir movimentação de entrada para cada item da compra
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        unit_cost,
        total_cost,
        reference_type,
        reference_id,
        movement_date
    )
    SELECT 
        pi.product_id,
        'entrada',
        pi.quantity,
        pi.unit_cost,
        pi.total_cost,
        'compra',
        NEW.id,
        NEW.purchase_date
    FROM purchase_items pi
    WHERE pi.purchase_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_purchase_insert
AFTER INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION trigger_purchase_stock_movement();

COMMENT ON FUNCTION trigger_purchase_stock_movement IS 'Cria movimentações de estoque automaticamente ao registrar compra';

-- Trigger: Verificar margem e criar alertas
CREATE OR REPLACE FUNCTION trigger_check_product_margin()
RETURNS TRIGGER AS $$
DECLARE
    v_margin DECIMAL(5,2);
    v_threshold DECIMAL(5,2) := 20.0; -- Margem mínima de 20%
BEGIN
    -- Calcular margem bruta
    IF NEW.sale_price > 0 THEN
        v_margin := ((NEW.sale_price - NEW.cost_price) / NEW.sale_price * 100);
        
        -- Se margem está abaixo do threshold, criar alerta
        IF v_margin < v_threshold THEN
            INSERT INTO margin_alerts (
                product_id,
                alert_type,
                current_margin,
                threshold_margin,
                current_cmv,
                sale_price,
                recommended_price,
                status
            ) VALUES (
                NEW.id,
                CASE 
                    WHEN v_margin < 0 THEN 'margem_negativa'
                    ELSE 'margem_baixa'
                END,
                v_margin,
                v_threshold,
                NEW.cost_price,
                NEW.sale_price,
                NEW.cost_price / (1 - v_threshold/100), -- Preço para atingir margem desejada
                'ativo'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_product_price_update
AFTER INSERT OR UPDATE OF cost_price, sale_price ON products
FOR EACH ROW
EXECUTE FUNCTION trigger_check_product_margin();

COMMENT ON FUNCTION trigger_check_product_margin IS 'Verifica margem do produto e cria alertas automáticos';
