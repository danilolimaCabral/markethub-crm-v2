-- ============================================================================
-- Control Tower da GethubSytem - Database Schema
-- Módulo de Gestão de Sistemas, Demandas, Contratos e Faturamento
-- Author: Manus AI
-- Date: Dezembro 2024
-- ============================================================================

-- ============================================================================
-- 1. CATÁLOGO DE PLATAFORMAS/SISTEMAS
-- ============================================================================

-- Tabela de plataformas/sistemas desenvolvidos
CREATE TABLE IF NOT EXISTS platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stack VARCHAR(255),
    version VARCHAR(50),
    roadmap TEXT,
    sla_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platforms_tenant ON platforms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platforms_name ON platforms(name);

COMMENT ON TABLE platforms IS 'Catálogo de sistemas/produtos desenvolvidos pela empresa';
COMMENT ON COLUMN platforms.sla_hours IS 'SLA padrão em horas para demandas desta plataforma';

-- ============================================================================
-- 2. CLIENTES E INSTÂNCIAS
-- ============================================================================

-- Tabela de clientes do Control Tower (empresas que usam as plataformas)
CREATE TABLE IF NOT EXISTS ct_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    document VARCHAR(20),
    address JSONB,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ct_clients_tenant ON ct_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ct_clients_name ON ct_clients(name);

COMMENT ON TABLE ct_clients IS 'Clientes que utilizam as plataformas desenvolvidas';

-- Tabela de instâncias (plataforma instalada para um cliente)
CREATE TABLE IF NOT EXISTS instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES ct_clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    environment VARCHAR(50) DEFAULT 'production',
    configurations JSONB,
    status VARCHAR(50) DEFAULT 'active',
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_instances_tenant ON instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instances_platform ON instances(platform_id);
CREATE INDEX IF NOT EXISTS idx_instances_client ON instances(client_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status);

COMMENT ON TABLE instances IS 'Instâncias de plataformas para clientes específicos';
COMMENT ON COLUMN instances.environment IS 'production, staging, development';
COMMENT ON COLUMN instances.status IS 'active, inactive, suspended, maintenance';

-- ============================================================================
-- 3. GESTÃO DE CONTRATOS
-- ============================================================================

-- Tabela de templates de contratos
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_tenant ON contract_templates(tenant_id);

COMMENT ON TABLE contract_templates IS 'Modelos de contratos com variáveis substituíveis';
COMMENT ON COLUMN contract_templates.variables IS 'JSON com variáveis do template: {nome_cliente, valor, data_inicio, etc}';

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    template_id UUID REFERENCES contract_templates(id),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    terms TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    renewal_date DATE,
    billing_rule VARCHAR(50) NOT NULL DEFAULT 'mrr',
    mrr_value DECIMAL(15,2) DEFAULT 0,
    hourly_rate DECIMAL(15,2) DEFAULT 0,
    hours_package INTEGER DEFAULT 0,
    hours_used INTEGER DEFAULT 0,
    project_value DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    signed_at TIMESTAMP,
    signed_by_client VARCHAR(255),
    signed_by_company VARCHAR(255),
    docusign_envelope_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_instance ON contracts(instance_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

COMMENT ON TABLE contracts IS 'Contratos formais com clientes';
COMMENT ON COLUMN contracts.billing_rule IS 'mrr, hourly, hours_package, fixed_project';
COMMENT ON COLUMN contracts.status IS 'draft, pending_approval, approved, active, expired, cancelled';

-- Histórico de versões de contratos
CREATE TABLE IF NOT EXISTS contract_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    changes_description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_versions_contract ON contract_versions(contract_id);

COMMENT ON TABLE contract_versions IS 'Histórico de versões e alterações dos contratos';

-- ============================================================================
-- 4. GESTÃO DE DEMANDAS
-- ============================================================================

-- Tabela de demandas (tickets de mudança, bug, melhoria, suporte)
CREATE TABLE IF NOT EXISTS demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    demand_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    sla_hours INTEGER,
    sla_deadline TIMESTAMP,
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    tags TEXT[],
    assigned_to UUID REFERENCES users(id),
    requested_by VARCHAR(255),
    requested_by_email VARCHAR(255),
    closed_at TIMESTAMP,
    closed_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demands_tenant ON demands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_demands_instance ON demands(instance_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_type ON demands(type);
CREATE INDEX IF NOT EXISTS idx_demands_priority ON demands(priority);
CREATE INDEX IF NOT EXISTS idx_demands_assigned ON demands(assigned_to);
CREATE INDEX IF NOT EXISTS idx_demands_created_at ON demands(created_at);

COMMENT ON TABLE demands IS 'Solicitações de mudança, bugs, melhorias e suporte';
COMMENT ON COLUMN demands.type IS 'change, bug, improvement, support, project';
COMMENT ON COLUMN demands.priority IS 'critical, high, medium, low';
COMMENT ON COLUMN demands.status IS 'open, triaging, planned, in_progress, review, testing, deployed, closed, cancelled';

-- Histórico de status das demandas
CREATE TABLE IF NOT EXISTS demand_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demand_status_history_demand ON demand_status_history(demand_id);

COMMENT ON TABLE demand_status_history IS 'Histórico de mudanças de status das demandas';

-- Comentários nas demandas
CREATE TABLE IF NOT EXISTS demand_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demand_comments_demand ON demand_comments(demand_id);

COMMENT ON TABLE demand_comments IS 'Comentários e discussões nas demandas';
COMMENT ON COLUMN demand_comments.is_internal IS 'Se true, comentário visível apenas para equipe interna';

-- ============================================================================
-- 5. APONTAMENTO DE HORAS (WORKLOG)
-- ============================================================================

-- Tabela de apontamento de horas
CREATE TABLE IF NOT EXISTS worklogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    demand_id UUID REFERENCES demands(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    activity_type VARCHAR(50) DEFAULT 'development',
    description TEXT,
    notes TEXT,
    is_billable BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    ai_suggested BOOLEAN DEFAULT FALSE,
    ai_source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worklogs_tenant ON worklogs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_demand ON worklogs(demand_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_user ON worklogs(user_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_start_time ON worklogs(start_time);
CREATE INDEX IF NOT EXISTS idx_worklogs_approved ON worklogs(is_approved);

COMMENT ON TABLE worklogs IS 'Registro de horas trabalhadas';
COMMENT ON COLUMN worklogs.activity_type IS 'development, meeting, review, testing, documentation, support';
COMMENT ON COLUMN worklogs.ai_suggested IS 'Se true, apontamento foi sugerido por IA';
COMMENT ON COLUMN worklogs.ai_source IS 'Fonte da sugestão: github_commits, calendar, etc';

-- Timer ativo (para start/stop)
CREATE TABLE IF NOT EXISTS active_timers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    demand_id UUID REFERENCES demands(id),
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activity_type VARCHAR(50) DEFAULT 'development',
    description TEXT,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_active_timers_user ON active_timers(user_id);

COMMENT ON TABLE active_timers IS 'Timers ativos para apontamento em tempo real';

-- ============================================================================
-- 6. FATURAMENTO
-- ============================================================================

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS ct_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    instance_id UUID NOT NULL REFERENCES instances(id),
    contract_id UUID REFERENCES contracts(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    tax DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'draft',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP,
    items JSONB,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ct_invoices_tenant ON ct_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ct_invoices_instance ON ct_invoices(instance_id);
CREATE INDEX IF NOT EXISTS idx_ct_invoices_status ON ct_invoices(status);
CREATE INDEX IF NOT EXISTS idx_ct_invoices_due_date ON ct_invoices(due_date);

COMMENT ON TABLE ct_invoices IS 'Faturas geradas para clientes';
COMMENT ON COLUMN ct_invoices.status IS 'draft, sent, paid, overdue, cancelled';
COMMENT ON COLUMN ct_invoices.items IS 'JSON array: [{description, quantity, unit_price, total}]';

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS ct_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES ct_invoices(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference VARCHAR(255),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ct_payments_tenant ON ct_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ct_payments_invoice ON ct_payments(invoice_id);

COMMENT ON TABLE ct_payments IS 'Pagamentos recebidos';

-- ============================================================================
-- 7. DOCUMENTAÇÃO (WIKI)
-- ============================================================================

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    owner_type VARCHAR(50) NOT NULL,
    owner_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    content TEXT,
    content_type VARCHAR(50) DEFAULT 'markdown',
    version INTEGER DEFAULT 1,
    tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES documents(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_slug ON documents(slug);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id);

COMMENT ON TABLE documents IS 'Wiki e documentação do sistema';
COMMENT ON COLUMN documents.owner_type IS 'platform, instance, demand, contract';
COMMENT ON COLUMN documents.content_type IS 'markdown, html, pdf';

-- Histórico de versões de documentos
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    changes_description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);

COMMENT ON TABLE document_versions IS 'Histórico de versões dos documentos';

-- Arquivos anexos
CREATE TABLE IF NOT EXISTS document_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    demand_id UUID REFERENCES demands(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    storage_path VARCHAR(500) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_attachments_tenant ON document_attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_document ON document_attachments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_demand ON document_attachments(demand_id);

COMMENT ON TABLE document_attachments IS 'Arquivos anexos a documentos, demandas ou contratos';

-- ============================================================================
-- 8. CUSTO DE USUÁRIOS (para cálculo de rentabilidade)
-- ============================================================================

-- Adicionar campos de custo na tabela users se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cost_per_hour') THEN
        ALTER TABLE users ADD COLUMN cost_per_hour DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department') THEN
        ALTER TABLE users ADD COLUMN department VARCHAR(100);
    END IF;
END $$;

-- ============================================================================
-- 9. INTEGRAÇÕES EXTERNAS
-- ============================================================================

-- Tabela de configurações de integrações do Control Tower
CREATE TABLE IF NOT EXISTS ct_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    integration_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, integration_type)
);

CREATE INDEX IF NOT EXISTS idx_ct_integrations_tenant ON ct_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ct_integrations_type ON ct_integrations(integration_type);

COMMENT ON TABLE ct_integrations IS 'Configurações de integrações externas';
COMMENT ON COLUMN ct_integrations.integration_type IS 'github, gitlab, jira, trello, slack, teams, docusign, erp';

-- ============================================================================
-- 10. VIEWS PARA DASHBOARDS
-- ============================================================================

-- View de MRR por plataforma
CREATE OR REPLACE VIEW vw_mrr_by_platform AS
SELECT 
    p.tenant_id,
    p.id AS platform_id,
    p.name AS platform_name,
    COUNT(DISTINCT c.id) AS active_contracts,
    SUM(c.mrr_value) AS total_mrr
FROM platforms p
LEFT JOIN instances i ON i.platform_id = p.id
LEFT JOIN contracts c ON c.instance_id = i.id AND c.status = 'active'
WHERE p.is_active = TRUE
GROUP BY p.tenant_id, p.id, p.name;

-- View de horas por demanda
CREATE OR REPLACE VIEW vw_hours_by_demand AS
SELECT 
    d.tenant_id,
    d.id AS demand_id,
    d.demand_number,
    d.title,
    d.type,
    d.status,
    d.estimated_hours,
    COALESCE(SUM(w.duration_minutes) / 60.0, 0) AS actual_hours,
    COUNT(w.id) AS worklog_count
FROM demands d
LEFT JOIN worklogs w ON w.demand_id = d.id
GROUP BY d.tenant_id, d.id, d.demand_number, d.title, d.type, d.status, d.estimated_hours;

-- View de rentabilidade por instância
CREATE OR REPLACE VIEW vw_profitability_by_instance AS
SELECT 
    i.tenant_id,
    i.id AS instance_id,
    i.name AS instance_name,
    cl.name AS client_name,
    p.name AS platform_name,
    COALESCE(SUM(inv.total), 0) AS total_revenue,
    COALESCE(SUM(w.duration_minutes / 60.0 * u.cost_per_hour), 0) AS total_cost,
    COALESCE(SUM(inv.total), 0) - COALESCE(SUM(w.duration_minutes / 60.0 * u.cost_per_hour), 0) AS profit
FROM instances i
JOIN ct_clients cl ON cl.id = i.client_id
JOIN platforms p ON p.id = i.platform_id
LEFT JOIN ct_invoices inv ON inv.instance_id = i.id AND inv.status = 'paid'
LEFT JOIN demands d ON d.instance_id = i.id
LEFT JOIN worklogs w ON w.demand_id = d.id
LEFT JOIN users u ON u.id = w.user_id
GROUP BY i.tenant_id, i.id, i.name, cl.name, p.name;

-- View de SLA das demandas
CREATE OR REPLACE VIEW vw_demand_sla AS
SELECT 
    d.tenant_id,
    d.id AS demand_id,
    d.demand_number,
    d.title,
    d.type,
    d.priority,
    d.status,
    d.sla_deadline,
    d.created_at,
    d.closed_at,
    CASE 
        WHEN d.status = 'closed' AND d.closed_at <= d.sla_deadline THEN 'met'
        WHEN d.status = 'closed' AND d.closed_at > d.sla_deadline THEN 'breached'
        WHEN d.status != 'closed' AND CURRENT_TIMESTAMP > d.sla_deadline THEN 'at_risk'
        ELSE 'on_track'
    END AS sla_status,
    EXTRACT(EPOCH FROM (COALESCE(d.closed_at, CURRENT_TIMESTAMP) - d.created_at)) / 3600 AS lead_time_hours
FROM demands d
WHERE d.sla_deadline IS NOT NULL;

-- ============================================================================
-- 11. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para gerar número sequencial de demanda
CREATE OR REPLACE FUNCTION generate_demand_number(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_count INTEGER;
    v_year VARCHAR(4);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count 
    FROM demands 
    WHERE tenant_id = p_tenant_id 
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    RETURN 'DEM-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Função para gerar número sequencial de contrato
CREATE OR REPLACE FUNCTION generate_contract_number(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_count INTEGER;
    v_year VARCHAR(4);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count 
    FROM contracts 
    WHERE tenant_id = p_tenant_id 
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    RETURN 'CTR-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Função para gerar número sequencial de fatura
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_count INTEGER;
    v_year VARCHAR(4);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count 
    FROM ct_invoices 
    WHERE tenant_id = p_tenant_id 
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    RETURN 'INV-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar horas reais na demanda
CREATE OR REPLACE FUNCTION update_demand_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE demands 
        SET actual_hours = (
            SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) 
            FROM worklogs 
            WHERE demand_id = NEW.demand_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.demand_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE demands 
        SET actual_hours = (
            SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) 
            FROM worklogs 
            WHERE demand_id = OLD.demand_id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.demand_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_demand_hours ON worklogs;
CREATE TRIGGER trg_update_demand_hours
AFTER INSERT OR UPDATE OR DELETE ON worklogs
FOR EACH ROW EXECUTE FUNCTION update_demand_actual_hours();

-- Trigger para registrar histórico de status da demanda
CREATE OR REPLACE FUNCTION log_demand_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO demand_status_history (demand_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.updated_at::UUID);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_demand_status ON demands;
CREATE TRIGGER trg_log_demand_status
AFTER UPDATE ON demands
FOR EACH ROW EXECUTE FUNCTION log_demand_status_change();

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
