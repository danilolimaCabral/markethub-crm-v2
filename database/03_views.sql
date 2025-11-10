-- ============================================================================
-- MarketHub CRM - Views
-- Database: PostgreSQL 14+
-- Author: Manus AI
-- Date: Janeiro 2025
-- ============================================================================

-- ============================================================================
-- VIEW: Dashboard de Métricas
-- ============================================================================

CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT
    -- Totais gerais
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT o.customer_id) as total_customers,
    COUNT(DISTINCT p.id) as total_products,
    
    -- Métricas financeiras
    SUM(o.total) as total_revenue,
    AVG(o.total) as average_order_value,
    SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.total ELSE 0 END) as today_revenue,
    SUM(CASE WHEN DATE(o.created_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN o.total ELSE 0 END) as month_revenue,
    
    -- Status dos pedidos
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN o.status = 'paid' THEN 1 END) as paid_orders,
    COUNT(CASE WHEN o.status = 'shipped' THEN 1 END) as shipped_orders,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
    
    -- Pedidos de hoje
    COUNT(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN 1 END) as today_orders,
    
    -- Produtos com estoque baixo
    COUNT(CASE WHEN p.stock_quantity <= p.min_stock AND p.is_active = TRUE THEN 1 END) as low_stock_products
FROM orders o
CROSS JOIN products p
WHERE o.status != 'cancelled';

COMMENT ON VIEW dashboard_metrics IS 'Métricas consolidadas para o dashboard principal';

-- ============================================================================
-- VIEW: Produtos com Estoque Baixo
-- ============================================================================

CREATE OR REPLACE VIEW low_stock_products AS
SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    p.stock_quantity,
    p.min_stock,
    (p.min_stock - p.stock_quantity) as quantity_needed,
    p.sale_price,
    (p.min_stock - p.stock_quantity) * p.cost_price as restock_cost
FROM products p
WHERE p.stock_quantity <= p.min_stock
  AND p.is_active = TRUE
ORDER BY (p.min_stock - p.stock_quantity) DESC;

COMMENT ON VIEW low_stock_products IS 'Produtos que atingiram ou estão abaixo do estoque mínimo';

-- ============================================================================
-- VIEW: Relatório Financeiro Mensal
-- ============================================================================

CREATE OR REPLACE VIEW monthly_financial_report AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    type,
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM financial_transactions
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', created_at), type, category
ORDER BY month DESC, type, category;

COMMENT ON VIEW monthly_financial_report IS 'Resumo financeiro mensal por tipo e categoria';

-- ============================================================================
-- VIEW: Top Clientes
-- ============================================================================

CREATE OR REPLACE VIEW top_customers AS
SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.total_orders,
    c.total_spent,
    c.last_order_at,
    ROUND(c.total_spent / NULLIF(c.total_orders, 0), 2) as average_order_value,
    CASE
        WHEN c.total_spent >= 10000 THEN 'VIP'
        WHEN c.total_spent >= 5000 THEN 'Premium'
        WHEN c.total_spent >= 1000 THEN 'Regular'
        ELSE 'Novo'
    END as customer_tier
FROM customers c
WHERE c.is_active = TRUE
  AND c.total_orders > 0
ORDER BY c.total_spent DESC
LIMIT 100;

COMMENT ON VIEW top_customers IS 'Top 100 clientes por valor total gasto';

-- ============================================================================
-- VIEW: Produtos Mais Vendidos
-- ============================================================================

CREATE OR REPLACE VIEW top_selling_products AS
SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    p.brand,
    COUNT(oi.id) as times_sold,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.subtotal) as total_revenue,
    ROUND(AVG(oi.unit_price), 2) as average_price,
    p.stock_quantity as current_stock
FROM products p
INNER JOIN order_items oi ON oi.product_id = p.id
INNER JOIN orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled')
  AND p.is_active = TRUE
GROUP BY p.id, p.sku, p.name, p.category, p.brand, p.stock_quantity
ORDER BY total_quantity_sold DESC
LIMIT 50;

COMMENT ON VIEW top_selling_products IS 'Top 50 produtos mais vendidos';

-- ============================================================================
-- VIEW: Pedidos Pendentes
-- ============================================================================

CREATE OR REPLACE VIEW pending_orders_detail AS
SELECT
    o.id,
    o.order_number,
    o.created_at,
    o.status,
    o.payment_status,
    o.total,
    o.marketplace,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    COUNT(oi.id) as items_count,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - o.created_at)) as days_pending
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status IN ('pending', 'paid')
GROUP BY o.id, o.order_number, o.created_at, o.status, o.payment_status, 
         o.total, o.marketplace, c.name, c.email, c.phone
ORDER BY o.created_at ASC;

COMMENT ON VIEW pending_orders_detail IS 'Detalhes de pedidos pendentes de processamento';

-- ============================================================================
-- VIEW: Análise de Vendas por Marketplace
-- ============================================================================

CREATE OR REPLACE VIEW marketplace_sales_analysis AS
SELECT
    COALESCE(o.marketplace, 'Direto') as marketplace,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    SUM(o.total) as total_revenue,
    AVG(o.total) as average_order_value,
    SUM(o.shipping_cost) as total_shipping_cost,
    SUM(o.discount) as total_discounts,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
    ROUND(
        COUNT(CASE WHEN o.status = 'delivered' THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as delivery_rate_percent
FROM orders o
WHERE o.status NOT IN ('cancelled')
GROUP BY COALESCE(o.marketplace, 'Direto')
ORDER BY total_revenue DESC;

COMMENT ON VIEW marketplace_sales_analysis IS 'Análise de vendas por marketplace';

-- ============================================================================
-- VIEW: Fluxo de Caixa Mensal
-- ============================================================================

CREATE OR REPLACE VIEW monthly_cash_flow AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) -
    SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as net_cash_flow,
    COUNT(CASE WHEN type = 'income' THEN 1 END) as income_transactions,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_transactions
FROM financial_transactions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

COMMENT ON VIEW monthly_cash_flow IS 'Fluxo de caixa mensal (entradas vs saídas)';

-- ============================================================================
-- VIEW: Contas a Receber
-- ============================================================================

CREATE OR REPLACE VIEW accounts_receivable AS
SELECT
    ft.id,
    ft.description,
    ft.amount,
    ft.due_date,
    ft.created_at,
    o.order_number,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    CASE
        WHEN ft.due_date < CURRENT_DATE THEN 'Vencido'
        WHEN ft.due_date = CURRENT_DATE THEN 'Vence Hoje'
        WHEN ft.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Vence em 7 dias'
        ELSE 'A Vencer'
    END as status_label,
    EXTRACT(DAY FROM (CURRENT_DATE - ft.due_date)) as days_overdue
FROM financial_transactions ft
LEFT JOIN orders o ON o.id = ft.order_id
LEFT JOIN customers c ON c.id = ft.customer_id
WHERE ft.type = 'income'
  AND ft.status = 'pending'
ORDER BY ft.due_date ASC;

COMMENT ON VIEW accounts_receivable IS 'Contas a receber pendentes';

-- ============================================================================
-- VIEW: Contas a Pagar
-- ============================================================================

CREATE OR REPLACE VIEW accounts_payable AS
SELECT
    ft.id,
    ft.category,
    ft.description,
    ft.amount,
    ft.due_date,
    ft.payment_method,
    ft.created_at,
    CASE
        WHEN ft.due_date < CURRENT_DATE THEN 'Vencido'
        WHEN ft.due_date = CURRENT_DATE THEN 'Vence Hoje'
        WHEN ft.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Vence em 7 dias'
        ELSE 'A Vencer'
    END as status_label,
    EXTRACT(DAY FROM (CURRENT_DATE - ft.due_date)) as days_overdue
FROM financial_transactions ft
WHERE ft.type = 'expense'
  AND ft.status = 'pending'
ORDER BY ft.due_date ASC;

COMMENT ON VIEW accounts_payable IS 'Contas a pagar pendentes';

-- ============================================================================
-- VIEW: Histórico de Atividades Recentes
-- ============================================================================

CREATE OR REPLACE VIEW recent_activities AS
SELECT
    al.id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.created_at,
    u.username,
    u.full_name as user_full_name,
    CASE al.entity_type
        WHEN 'orders' THEN (SELECT order_number FROM orders WHERE id = al.entity_id)
        WHEN 'products' THEN (SELECT name FROM products WHERE id = al.entity_id)
        WHEN 'customers' THEN (SELECT name FROM customers WHERE id = al.entity_id)
        ELSE NULL
    END as entity_name
FROM audit_log al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_activities IS 'Últimas 100 atividades do sistema';

-- ============================================================================
-- VIEW: Análise de Rentabilidade por Produto
-- ============================================================================

CREATE OR REPLACE VIEW product_profitability AS
SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    p.cost_price,
    p.sale_price,
    (p.sale_price - p.cost_price) as gross_profit,
    ROUND(((p.sale_price - p.cost_price) / NULLIF(p.sale_price, 0) * 100), 2) as margin_percent,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    COALESCE(SUM(oi.subtotal), 0) as total_revenue,
    COALESCE(SUM(oi.quantity * p.cost_price), 0) as total_cost,
    COALESCE(SUM(oi.subtotal) - SUM(oi.quantity * p.cost_price), 0) as total_profit
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled')
WHERE p.is_active = TRUE
GROUP BY p.id, p.sku, p.name, p.category, p.cost_price, p.sale_price
ORDER BY total_profit DESC;

COMMENT ON VIEW product_profitability IS 'Análise de rentabilidade por produto';

-- ============================================================================
-- VIEW: Status de Integrações
-- ============================================================================

CREATE OR REPLACE VIEW marketplace_integration_status AS
SELECT
    mi.id,
    mi.marketplace,
    mi.is_active,
    mi.last_sync_at,
    mi.sync_frequency,
    EXTRACT(MINUTE FROM (CURRENT_TIMESTAMP - mi.last_sync_at)) as minutes_since_last_sync,
    CASE
        WHEN mi.is_active = FALSE THEN 'Desativado'
        WHEN mi.last_sync_at IS NULL THEN 'Nunca Sincronizado'
        WHEN EXTRACT(MINUTE FROM (CURRENT_TIMESTAMP - mi.last_sync_at)) > mi.sync_frequency * 2 THEN 'Atrasado'
        ELSE 'OK'
    END as sync_status,
    (
        SELECT COUNT(*) 
        FROM marketplace_sync_log msl 
        WHERE msl.integration_id = mi.id 
        AND msl.status = 'error'
        AND msl.started_at >= CURRENT_DATE
    ) as today_errors
FROM marketplace_integrations mi
ORDER BY mi.marketplace;

COMMENT ON VIEW marketplace_integration_status IS 'Status das integrações com marketplaces';

-- ============================================================================
-- FIM DO SCRIPT DE VIEWS
-- ============================================================================
