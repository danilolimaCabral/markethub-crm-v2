-- ============================================================================
-- MarketHub CRM - Seed Data (Dados Iniciais)
-- Database: PostgreSQL 14+
-- Author: Manus AI
-- Date: Janeiro 2025
-- ============================================================================

-- ============================================================================
-- 1. USUÁRIO ADMINISTRADOR PADRÃO
-- ============================================================================

-- Senha padrão: admin123 (DEVE SER ALTERADA NO PRIMEIRO LOGIN)
-- Hash bcrypt: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@markethub.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador', 'admin', TRUE);

-- Permissões completas para o admin
INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
    u.id,
    module,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM users u
CROSS JOIN (
    VALUES 
        ('dashboard'),
        ('assistente_ia'),
        ('pedidos'),
        ('produtos'),
        ('anuncios'),
        ('clientes'),
        ('entregas'),
        ('notas_fiscais'),
        ('pos_vendas'),
        ('importacao'),
        ('inteligencia_mercado'),
        ('tabela_precos'),
        ('contas_pagar'),
        ('contas_receber'),
        ('fluxo_caixa'),
        ('relatorios'),
        ('analise_vendas'),
        ('metricas'),
        ('mercado_livre'),
        ('importacao_financeira'),
        ('usuarios'),
        ('configuracoes')
) AS modules(module)
WHERE u.username = 'admin';

-- ============================================================================
-- 2. CATEGORIAS DE PRODUTOS PADRÃO
-- ============================================================================

-- Produtos de exemplo
INSERT INTO products (sku, name, description, category, brand, cost_price, sale_price, stock_quantity, min_stock, is_active) VALUES
('PROD-001', 'Camiseta Básica Branca', 'Camiseta 100% algodão, tamanho M', 'Vestuário', 'BasicWear', 15.00, 39.90, 50, 10, TRUE),
('PROD-002', 'Calça Jeans Masculina', 'Calça jeans tradicional, cor azul', 'Vestuário', 'DenimStyle', 45.00, 129.90, 30, 5, TRUE),
('PROD-003', 'Tênis Esportivo', 'Tênis para corrida, tamanho 42', 'Calçados', 'RunFast', 80.00, 199.90, 20, 5, TRUE),
('PROD-004', 'Mochila Escolar', 'Mochila com 3 compartimentos', 'Acessórios', 'SchoolBag', 35.00, 89.90, 40, 8, TRUE),
('PROD-005', 'Relógio Digital', 'Relógio digital à prova d''água', 'Eletrônicos', 'TimeWatch', 60.00, 149.90, 15, 3, TRUE);

-- ============================================================================
-- 3. CLIENTES DE EXEMPLO
-- ============================================================================

INSERT INTO customers (name, email, phone, document, type, total_orders, total_spent, is_active) VALUES
('João Silva', 'joao.silva@email.com', '(11) 98765-4321', '123.456.789-00', 'pessoa_fisica', 0, 0, TRUE),
('Maria Santos', 'maria.santos@email.com', '(11) 97654-3210', '987.654.321-00', 'pessoa_fisica', 0, 0, TRUE),
('Empresa XYZ Ltda', 'contato@empresaxyz.com', '(11) 3456-7890', '12.345.678/0001-90', 'pessoa_juridica', 0, 0, TRUE);

-- ============================================================================
-- 4. CUSTOS VARIÁVEIS PADRÃO (PAX)
-- ============================================================================

-- Impostos sobre Vendas
INSERT INTO variable_costs (category, name, type, value, description, is_active) VALUES
('impostos', 'ICMS', 'percentage', 12.00, 'Imposto sobre Circulação de Mercadorias e Serviços', TRUE),
('impostos', 'ISS', 'percentage', 5.00, 'Imposto Sobre Serviços', TRUE),
('impostos', 'Taxa Mercado Livre', 'percentage', 16.00, 'Taxa de comissão do Mercado Livre', TRUE),
('impostos', 'Taxa Shopee', 'percentage', 14.00, 'Taxa de comissão da Shopee', TRUE);

-- Fretes e Envios
INSERT INTO variable_costs (category, name, type, value, description, is_active) VALUES
('frete', 'Frete Correios PAC', 'percentage', 8.00, 'Custo médio de frete PAC', TRUE),
('frete', 'Frete Transportadora', 'percentage', 10.00, 'Custo médio de frete por transportadora', TRUE);

-- Comissão e Premiação
INSERT INTO variable_costs (category, name, type, value, description, is_active) VALUES
('comissao', 'Comissão Vendedor', 'percentage', 5.00, 'Comissão padrão por venda', TRUE),
('comissao', 'Bônus por Meta', 'percentage', 2.00, 'Bônus adicional ao atingir meta mensal', TRUE);

-- Mídia Variável
INSERT INTO variable_costs (category, name, type, value, description, is_active) VALUES
('midia', 'Anúncios Mercado Livre', 'percentage', 3.00, 'Custo de anúncios no ML', TRUE),
('midia', 'Meta Ads', 'percentage', 5.00, 'Custo de anúncios Facebook/Instagram', TRUE),
('midia', 'Google Ads', 'percentage', 4.00, 'Custo de anúncios Google', TRUE);

-- Embalagens e Insumos
INSERT INTO variable_costs (category, name, type, value, description, is_active) VALUES
('embalagens', 'Caixas de Papelão', 'fixed', 2.50, 'Custo médio por caixa', TRUE),
('embalagens', 'Fita Adesiva', 'fixed', 0.50, 'Custo médio por pedido', TRUE),
('embalagens', 'Etiquetas', 'fixed', 0.30, 'Custo médio por etiqueta', TRUE);

-- Taxas Financeiras
INSERT INTO variable_costs (category, name, type, value, description, is_active) VALUES
('taxas_financeiras', 'Mercado Pago', 'percentage', 4.99, 'Taxa de processamento Mercado Pago', TRUE),
('taxas_financeiras', 'Cartão de Crédito', 'percentage', 3.50, 'Taxa média de cartão de crédito', TRUE),
('taxas_financeiras', 'Boleto Bancário', 'fixed', 3.50, 'Taxa fixa por boleto', TRUE);

-- ============================================================================
-- 5. INTEGRAÇÕES DE MARKETPLACE (DESATIVADAS POR PADRÃO)
-- ============================================================================

INSERT INTO marketplace_integrations (marketplace, is_active, sync_frequency) VALUES
('mercado_livre', FALSE, 15),
('shopee', FALSE, 15),
('amazon', FALSE, 30),
('magalu', FALSE, 30);

-- ============================================================================
-- 6. PEDIDO DE EXEMPLO (OPCIONAL - COMENTADO)
-- ============================================================================

/*
-- Criar pedido de exemplo
DO $$
DECLARE
    customer_id_var UUID;
    order_id_var UUID;
    product1_id UUID;
    product2_id UUID;
BEGIN
    -- Obter IDs
    SELECT id INTO customer_id_var FROM customers WHERE email = 'joao.silva@email.com';
    SELECT id INTO product1_id FROM products WHERE sku = 'PROD-001';
    SELECT id INTO product2_id FROM products WHERE sku = 'PROD-004';
    
    -- Criar pedido
    INSERT INTO orders (
        customer_id, 
        status, 
        payment_status, 
        payment_method,
        subtotal, 
        shipping_cost, 
        discount, 
        total
    ) VALUES (
        customer_id_var,
        'pending',
        'pending',
        'credit_card',
        0, -- será calculado automaticamente
        15.00,
        0,
        0 -- será calculado automaticamente
    ) RETURNING id INTO order_id_var;
    
    -- Adicionar itens
    INSERT INTO order_items (order_id, product_id, sku, name, quantity, unit_price)
    VALUES 
        (order_id_var, product1_id, 'PROD-001', 'Camiseta Básica Branca', 2, 39.90),
        (order_id_var, product2_id, 'PROD-004', 'Mochila Escolar', 1, 89.90);
        
    RAISE NOTICE 'Pedido de exemplo criado com sucesso!';
END $$;
*/

-- ============================================================================
-- 7. CONFIGURAÇÕES DO SISTEMA
-- ============================================================================

-- Criar tabela de configurações (se não existir)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurações padrão
INSERT INTO system_settings (key, value, description) VALUES
('system_name', 'MarketHub CRM', 'Nome do sistema'),
('default_currency', 'BRL', 'Moeda padrão (BRL, USD, EUR)'),
('timezone', 'America/Sao_Paulo', 'Fuso horário padrão'),
('low_stock_alert_enabled', 'true', 'Ativar alertas de estoque baixo'),
('auto_sync_enabled', 'false', 'Sincronização automática com marketplaces'),
('backup_frequency', '24', 'Frequência de backup em horas'),
('session_timeout', '30', 'Timeout de sessão em minutos')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- MENSAGEM FINAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MarketHub CRM - Dados Iniciais Carregados';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Usuário Admin Criado:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Email: admin@markethub.com';
    RAISE NOTICE '  Senha: admin123';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE: Altere a senha do admin no primeiro login!';
    RAISE NOTICE '';
    RAISE NOTICE 'Dados carregados:';
    RAISE NOTICE '  - 1 usuário administrador';
    RAISE NOTICE '  - 5 produtos de exemplo';
    RAISE NOTICE '  - 3 clientes de exemplo';
    RAISE NOTICE '  - 18 custos variáveis (PAX)';
    RAISE NOTICE '  - 4 integrações de marketplace (desativadas)';
    RAISE NOTICE '';
    RAISE NOTICE 'Sistema pronto para uso!';
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- FIM DO SCRIPT DE SEED DATA
-- ============================================================================
