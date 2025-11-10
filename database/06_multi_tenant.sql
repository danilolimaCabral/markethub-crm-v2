-- ============================================
-- SISTEMA MULTI-TENANT (SaaS)
-- Estrutura para suportar múltiplos clientes
-- ============================================

-- Tabela de Tenants (Empresas/Clientes)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    nome_empresa VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- usado no subdomínio
    cnpj VARCHAR(18) UNIQUE,
    
    -- Contato
    email_contato VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    
    -- Endereço
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    
    -- Plano e Assinatura
    plano VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, professional, business, enterprise
    status VARCHAR(20) NOT NULL DEFAULT 'trial', -- trial, active, suspended, cancelled
    data_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP,
    
    -- Limites por Plano
    limite_usuarios INTEGER DEFAULT 3,
    limite_produtos INTEGER DEFAULT 100,
    limite_pedidos_mes INTEGER DEFAULT 500,
    limite_integracao_marketplaces INTEGER DEFAULT 1,
    
    -- Uso Atual
    usuarios_ativos INTEGER DEFAULT 0,
    produtos_cadastrados INTEGER DEFAULT 0,
    pedidos_mes_atual INTEGER DEFAULT 0,
    
    -- Configurações
    configuracoes JSONB DEFAULT '{}',
    
    -- Personalização
    logo_url TEXT,
    cor_primaria VARCHAR(7) DEFAULT '#7C3AED', -- hex color
    subdominio_personalizado VARCHAR(100) UNIQUE, -- ex: cliente.markethub.com
    
    -- Auditoria
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    
    -- Soft delete
    deletado_em TIMESTAMP,
    
    CONSTRAINT chk_plano CHECK (plano IN ('starter', 'professional', 'business', 'enterprise')),
    CONSTRAINT chk_status CHECK (status IN ('trial', 'active', 'suspended', 'cancelled'))
);

-- Índices para performance
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plano ON tenants(plano);
CREATE INDEX idx_tenants_data_expiracao ON tenants(data_expiracao);

-- Tabela de Planos de Assinatura
CREATE TABLE IF NOT EXISTS planos_assinatura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    nome VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT,
    
    -- Preços
    preco_mensal DECIMAL(10,2) NOT NULL,
    preco_anual DECIMAL(10,2),
    
    -- Limites
    limite_usuarios INTEGER NOT NULL,
    limite_produtos INTEGER NOT NULL,
    limite_pedidos_mes INTEGER NOT NULL,
    limite_marketplaces INTEGER NOT NULL,
    
    -- Funcionalidades
    tem_relatorios_avancados BOOLEAN DEFAULT FALSE,
    tem_api_acesso BOOLEAN DEFAULT FALSE,
    tem_suporte_prioritario BOOLEAN DEFAULT FALSE,
    tem_white_label BOOLEAN DEFAULT FALSE,
    tem_integracao_erp BOOLEAN DEFAULT FALSE,
    tem_ia_assistente BOOLEAN DEFAULT FALSE,
    
    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Auditoria
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir planos padrão
INSERT INTO planos_assinatura (nome, descricao, preco_mensal, preco_anual, limite_usuarios, limite_produtos, limite_pedidos_mes, limite_marketplaces, tem_relatorios_avancados, tem_api_acesso, tem_suporte_prioritario) VALUES
('starter', 'Plano inicial para microempreendedores', 49.00, 490.00, 3, 100, 500, 1, FALSE, FALSE, FALSE),
('professional', 'Plano para pequenas empresas', 99.00, 990.00, 10, 500, 2000, 3, TRUE, FALSE, TRUE),
('business', 'Plano para médias empresas', 199.00, 1990.00, 25, 2000, 10000, 5, TRUE, TRUE, TRUE),
('enterprise', 'Plano para grandes operações', 399.00, 3990.00, -1, -1, -1, -1, TRUE, TRUE, TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Tabela de Histórico de Assinaturas
CREATE TABLE IF NOT EXISTS historico_assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    plano_anterior VARCHAR(50),
    plano_novo VARCHAR(50) NOT NULL,
    
    motivo TEXT,
    valor_pago DECIMAL(10,2),
    
    data_mudanca TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    realizado_por UUID
);

CREATE INDEX idx_historico_tenant ON historico_assinaturas(tenant_id);

-- Tabela de Uso e Métricas por Tenant
CREATE TABLE IF NOT EXISTS tenant_metricas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    data_referencia DATE NOT NULL,
    
    -- Métricas de Uso
    usuarios_ativos INTEGER DEFAULT 0,
    produtos_cadastrados INTEGER DEFAULT 0,
    pedidos_processados INTEGER DEFAULT 0,
    valor_total_vendas DECIMAL(15,2) DEFAULT 0,
    
    -- Métricas de Sistema
    requisicoes_api INTEGER DEFAULT 0,
    storage_usado_mb DECIMAL(10,2) DEFAULT 0,
    
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, data_referencia)
);

CREATE INDEX idx_metricas_tenant_data ON tenant_metricas(tenant_id, data_referencia);

-- ============================================
-- ADICIONAR tenant_id em TODAS as tabelas existentes
-- ============================================

-- 1. Usuários
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- 2. Produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);

-- 3. Clientes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

-- 4. Pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);

-- 5. Integrações de Marketplace
ALTER TABLE marketplace_integrations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_marketplace_integrations_tenant ON marketplace_integrations(tenant_id);

-- 6. Transações Financeiras
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant ON financial_transactions(tenant_id);

-- 7. Custos Variáveis
ALTER TABLE variable_costs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_variable_costs_tenant ON variable_costs(tenant_id);

-- 8. Movimentações de Estoque
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON stock_movements(tenant_id);

-- 9. Compras
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_purchases_tenant ON purchases(tenant_id);

-- 10. Análise de CMV
ALTER TABLE product_cmv_analysis ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_product_cmv_analysis_tenant ON product_cmv_analysis(tenant_id);

-- 11. Alertas de Margem
ALTER TABLE margin_alerts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_margin_alerts_tenant ON margin_alerts(tenant_id);

-- 12. Logs de Auditoria
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);

-- ============================================
-- FUNÇÕES DE SEGURANÇA MULTI-TENANT
-- ============================================

-- Função para verificar se usuário pertence ao tenant
CREATE OR REPLACE FUNCTION check_tenant_access(
    p_user_id UUID,
    p_tenant_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND tenant_id = p_tenant_id
        AND deletado_em IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tenant do usuário
CREATE OR REPLACE FUNCTION get_user_tenant(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM users
    WHERE id = p_user_id
    AND deletado_em IS NULL;
    
    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar métricas do tenant
CREATE OR REPLACE FUNCTION atualizar_metricas_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tenants SET
        usuarios_ativos = (SELECT COUNT(*) FROM users WHERE tenant_id = p_tenant_id AND deletado_em IS NULL),
        produtos_cadastrados = (SELECT COUNT(*) FROM products WHERE tenant_id = p_tenant_id AND deletado_em IS NULL),
        pedidos_mes_atual = (
            SELECT COUNT(*) FROM orders 
            WHERE tenant_id = p_tenant_id 
            AND DATE_TRUNC('month', data_pedido) = DATE_TRUNC('month', CURRENT_DATE)
        ),
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar métricas automaticamente
CREATE OR REPLACE FUNCTION trigger_atualizar_metricas()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM atualizar_metricas_tenant(COALESCE(NEW.tenant_id, OLD.tenant_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas principais
CREATE TRIGGER trg_users_metricas AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_metricas();

CREATE TRIGGER trg_products_metricas AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_metricas();

CREATE TRIGGER trg_orders_metricas AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_metricas();

-- ============================================
-- VIEWS PARA ADMIN
-- ============================================

-- View de resumo de tenants
CREATE OR REPLACE VIEW vw_tenants_resumo AS
SELECT 
    t.id,
    t.nome_empresa,
    t.slug,
    t.email_contato,
    t.plano,
    t.status,
    t.data_inicio,
    t.data_expiracao,
    t.usuarios_ativos,
    t.produtos_cadastrados,
    t.pedidos_mes_atual,
    p.preco_mensal,
    p.preco_anual,
    CASE 
        WHEN t.data_expiracao < CURRENT_DATE THEN 'Expirado'
        WHEN t.data_expiracao < CURRENT_DATE + INTERVAL '7 days' THEN 'Expira em breve'
        ELSE 'Ativo'
    END as alerta_expiracao
FROM tenants t
LEFT JOIN planos_assinatura p ON t.plano = p.nome
WHERE t.deletado_em IS NULL;

-- View de uso por tenant
CREATE OR REPLACE VIEW vw_tenant_uso AS
SELECT 
    t.id as tenant_id,
    t.nome_empresa,
    t.plano,
    t.usuarios_ativos,
    p.limite_usuarios,
    ROUND((t.usuarios_ativos::DECIMAL / NULLIF(p.limite_usuarios, 0)) * 100, 2) as percentual_usuarios,
    t.produtos_cadastrados,
    p.limite_produtos,
    ROUND((t.produtos_cadastrados::DECIMAL / NULLIF(p.limite_produtos, 0)) * 100, 2) as percentual_produtos,
    t.pedidos_mes_atual,
    p.limite_pedidos_mes,
    ROUND((t.pedidos_mes_atual::DECIMAL / NULLIF(p.limite_pedidos_mes, 0)) * 100, 2) as percentual_pedidos
FROM tenants t
LEFT JOIN planos_assinatura p ON t.plano = p.nome
WHERE t.deletado_em IS NULL;

COMMENT ON TABLE tenants IS 'Tabela de empresas/clientes do sistema SaaS';
COMMENT ON TABLE planos_assinatura IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE historico_assinaturas IS 'Histórico de mudanças de plano';
COMMENT ON TABLE tenant_metricas IS 'Métricas diárias de uso por tenant';
