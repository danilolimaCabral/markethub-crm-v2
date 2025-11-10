-- ============================================================================
-- MarketHub CRM - Triggers and Functions
-- Database: PostgreSQL 14+
-- Author: Manus AI
-- Date: Janeiro 2025
-- ============================================================================

-- ============================================================================
-- FUNCTION: Atualização automática de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Atualiza automaticamente o campo updated_at';

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_integrations_updated_at 
    BEFORE UPDATE ON marketplace_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at 
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variable_costs_updated_at 
    BEFORE UPDATE ON variable_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Auditoria automática
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Tentar obter o user_id da sessão
    BEGIN
        current_user_id := current_setting('app.current_user_id', TRUE)::UUID;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    -- Inserir log de auditoria
    INSERT INTO audit_log (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        current_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id 
            ELSE NEW.id 
        END,
        CASE 
            WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) 
            ELSE NULL 
        END,
        CASE 
            WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) 
            ELSE NULL 
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_trigger_function() IS 'Registra automaticamente mudanças em tabelas críticas';

-- Aplicar auditoria em tabelas críticas
CREATE TRIGGER audit_users 
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_orders 
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_products 
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_customers 
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_financial_transactions 
    AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- FUNCTION: Atualização de estoque
-- ============================================================================

CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Reduzir estoque ao criar item do pedido
        IF NEW.product_variation_id IS NOT NULL THEN
            -- Atualizar estoque da variação
            UPDATE product_variations 
            SET stock_quantity = stock_quantity - NEW.quantity
            WHERE id = NEW.product_variation_id;
        ELSE
            -- Atualizar estoque do produto principal
            UPDATE products 
            SET stock_quantity = stock_quantity - NEW.quantity
            WHERE id = NEW.product_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Devolver estoque ao deletar item do pedido
        IF OLD.product_variation_id IS NOT NULL THEN
            UPDATE product_variations 
            SET stock_quantity = stock_quantity + OLD.quantity
            WHERE id = OLD.product_variation_id;
        ELSE
            UPDATE products 
            SET stock_quantity = stock_quantity + OLD.quantity
            WHERE id = OLD.product_id;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Ajustar estoque ao alterar quantidade
        IF NEW.product_variation_id IS NOT NULL THEN
            UPDATE product_variations 
            SET stock_quantity = stock_quantity + OLD.quantity - NEW.quantity
            WHERE id = NEW.product_variation_id;
        ELSE
            UPDATE products 
            SET stock_quantity = stock_quantity + OLD.quantity - NEW.quantity
            WHERE id = NEW.product_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_stock_on_order() IS 'Atualiza estoque automaticamente ao criar/alterar/deletar itens de pedido';

CREATE TRIGGER update_stock_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_order();

-- ============================================================================
-- FUNCTION: Atualização de totais do cliente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Atualizar totais do cliente
        UPDATE customers
        SET 
            total_orders = (
                SELECT COUNT(*) 
                FROM orders 
                WHERE customer_id = NEW.customer_id 
                AND status NOT IN ('cancelled')
            ),
            total_spent = (
                SELECT COALESCE(SUM(total), 0) 
                FROM orders 
                WHERE customer_id = NEW.customer_id 
                AND status NOT IN ('cancelled')
            ),
            last_order_at = (
                SELECT MAX(created_at) 
                FROM orders 
                WHERE customer_id = NEW.customer_id
            )
        WHERE id = NEW.customer_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Recalcular após deletar pedido
        UPDATE customers
        SET 
            total_orders = (
                SELECT COUNT(*) 
                FROM orders 
                WHERE customer_id = OLD.customer_id 
                AND status NOT IN ('cancelled')
            ),
            total_spent = (
                SELECT COALESCE(SUM(total), 0) 
                FROM orders 
                WHERE customer_id = OLD.customer_id 
                AND status NOT IN ('cancelled')
            ),
            last_order_at = (
                SELECT MAX(created_at) 
                FROM orders 
                WHERE customer_id = OLD.customer_id
            )
        WHERE id = OLD.customer_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_customer_totals() IS 'Atualiza totais do cliente automaticamente';

CREATE TRIGGER update_customer_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_customer_totals();

-- ============================================================================
-- FUNCTION: Registro de histórico de status do pedido
-- ============================================================================

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Só registrar se o status mudou
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        -- Tentar obter o user_id da sessão
        BEGIN
            current_user_id := current_setting('app.current_user_id', TRUE)::UUID;
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
        
        -- Inserir no histórico
        INSERT INTO order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            current_user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_order_status_change() IS 'Registra mudanças de status do pedido automaticamente';

CREATE TRIGGER log_order_status_change_trigger 
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ============================================================================
-- FUNCTION: Geração automática de número de pedido
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    -- Se já tem número, não gerar
    IF NEW.order_number IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Formato: YYYYMM-NNNN (ex: 202501-0001)
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    
    -- Obter próximo número da sequência do mês
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM 8) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE order_number LIKE year_month || '-%';
    
    -- Gerar número do pedido
    NEW.order_number := year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_number() IS 'Gera número sequencial de pedido automaticamente';

CREATE TRIGGER generate_order_number_trigger 
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================================
-- FUNCTION: Validação de estoque antes de criar pedido
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_stock_before_order()
RETURNS TRIGGER AS $$
DECLARE
    available_stock INTEGER;
BEGIN
    -- Verificar estoque disponível
    IF NEW.product_variation_id IS NOT NULL THEN
        SELECT stock_quantity INTO available_stock
        FROM product_variations
        WHERE id = NEW.product_variation_id;
    ELSE
        SELECT stock_quantity INTO available_stock
        FROM products
        WHERE id = NEW.product_id;
    END IF;
    
    -- Se não há estoque suficiente, abortar
    IF available_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', 
            available_stock, NEW.quantity;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_stock_before_order() IS 'Valida estoque antes de criar item de pedido';

CREATE TRIGGER validate_stock_before_order_trigger 
    BEFORE INSERT OR UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION validate_stock_before_order();

-- ============================================================================
-- FUNCTION: Calcular subtotal do item automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_order_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_order_item_subtotal() IS 'Calcula subtotal do item automaticamente';

CREATE TRIGGER calculate_order_item_subtotal_trigger 
    BEFORE INSERT OR UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION calculate_order_item_subtotal();

-- ============================================================================
-- FUNCTION: Atualizar total do pedido
-- ============================================================================

CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular total do pedido
    UPDATE orders
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0)
            FROM order_items
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ),
        total = (
            SELECT COALESCE(SUM(subtotal), 0)
            FROM order_items
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ) + COALESCE(shipping_cost, 0) - COALESCE(discount, 0)
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_order_total() IS 'Atualiza total do pedido automaticamente ao alterar itens';

CREATE TRIGGER update_order_total_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- ============================================================================
-- FIM DO SCRIPT DE TRIGGERS E FUNCTIONS
-- ============================================================================
