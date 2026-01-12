-- Migration: Correção completa da integração Mercado Livre
-- Data: 2026-01-12
-- Objetivo: Unificar estrutura de tabelas e criar tabela de log

-- =====================================================
-- 1. GARANTIR ESTRUTURA CORRETA DE marketplace_integrations
-- =====================================================

-- Adicionar coluna tenant_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_integrations' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE marketplace_integrations ADD COLUMN tenant_id INTEGER;
    END IF;
END $$;

-- Adicionar coluna config (JSONB) se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_integrations' AND column_name = 'config'
    ) THEN
        ALTER TABLE marketplace_integrations ADD COLUMN config JSONB DEFAULT '{}';
    END IF;
END $$;

-- Adicionar coluna access_token se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_integrations' AND column_name = 'access_token'
    ) THEN
        ALTER TABLE marketplace_integrations ADD COLUMN access_token TEXT;
    END IF;
END $$;

-- Adicionar coluna refresh_token se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_integrations' AND column_name = 'refresh_token'
    ) THEN
        ALTER TABLE marketplace_integrations ADD COLUMN refresh_token TEXT;
    END IF;
END $$;

-- Adicionar coluna token_expires_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_integrations' AND column_name = 'token_expires_at'
    ) THEN
        ALTER TABLE marketplace_integrations ADD COLUMN token_expires_at TIMESTAMP;
    END IF;
END $$;

-- Adicionar coluna is_active se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_integrations' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE marketplace_integrations ADD COLUMN is_active BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Adicionar coluna last_sync_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_integrations' AND column_name = 'last_sync_at'
    ) THEN
        ALTER TABLE marketplace_integrations ADD COLUMN last_sync_at TIMESTAMP;
    END IF;
END $$;

-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_integrations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE marketplace_integrations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por tenant_id + marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_integrations_tenant_marketplace
ON marketplace_integrations(tenant_id, marketplace);

-- Índice para busca por ml_user_id no config (para webhooks)
CREATE INDEX IF NOT EXISTS idx_marketplace_integrations_ml_user_id
ON marketplace_integrations((config->>'ml_user_id'));

-- Índice para integrações ativas
CREATE INDEX IF NOT EXISTS idx_marketplace_integrations_active
ON marketplace_integrations(is_active) WHERE is_active = true;

-- =====================================================
-- 3. CRIAR TABELA marketplace_sync_log
-- =====================================================

CREATE TABLE IF NOT EXISTS marketplace_sync_log (
    id SERIAL PRIMARY KEY,
    integration_id INTEGER REFERENCES marketplace_integrations(id) ON DELETE CASCADE,
    sync_type VARCHAR(100) NOT NULL,  -- 'orders', 'products', 'questions', 'webhook_orders_v2', etc
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    details JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para marketplace_sync_log
CREATE INDEX IF NOT EXISTS idx_sync_log_integration ON marketplace_sync_log(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_type ON marketplace_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON marketplace_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_started ON marketplace_sync_log(started_at DESC);

-- =====================================================
-- 4. TRIGGER PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_marketplace_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_integrations_updated_at ON marketplace_integrations;
CREATE TRIGGER trigger_marketplace_integrations_updated_at
    BEFORE UPDATE ON marketplace_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_integrations_updated_at();

-- =====================================================
-- 5. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE marketplace_integrations IS 'Integrações OAuth2 com marketplaces (ML, Amazon, etc) por tenant';
COMMENT ON COLUMN marketplace_integrations.tenant_id IS 'ID do tenant/empresa';
COMMENT ON COLUMN marketplace_integrations.marketplace IS 'Nome do marketplace (mercado_livre, amazon, shopee)';
COMMENT ON COLUMN marketplace_integrations.config IS 'Configurações em JSON (ml_user_id, nickname, etc)';
COMMENT ON COLUMN marketplace_integrations.access_token IS 'Token de acesso OAuth2';
COMMENT ON COLUMN marketplace_integrations.refresh_token IS 'Token de refresh OAuth2';
COMMENT ON COLUMN marketplace_integrations.is_active IS 'Se a integração está ativa';

COMMENT ON TABLE marketplace_sync_log IS 'Log de sincronizações e webhooks de marketplace';
COMMENT ON COLUMN marketplace_sync_log.sync_type IS 'Tipo: orders, products, questions, webhook_*';
COMMENT ON COLUMN marketplace_sync_log.details IS 'Detalhes da sincronização em JSON';

-- =====================================================
-- 6. MIGRAR DADOS DE mercadolivre_integrations (SE EXISTIR)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'mercadolivre_integrations'
    ) THEN
        -- Migrar dados existentes para marketplace_integrations
        INSERT INTO marketplace_integrations (
            tenant_id, marketplace, access_token, refresh_token,
            token_expires_at, is_active, config, created_at, updated_at
        )
        SELECT
            tenant_id,
            'mercado_livre',
            access_token,
            refresh_token,
            token_expires_at,
            is_active,
            jsonb_build_object('ml_user_id', ml_user_id),
            created_at,
            updated_at
        FROM mercadolivre_integrations
        WHERE NOT EXISTS (
            SELECT 1 FROM marketplace_integrations mi
            WHERE mi.tenant_id = mercadolivre_integrations.tenant_id
            AND mi.marketplace = 'mercado_livre'
        );

        RAISE NOTICE 'Dados migrados de mercadolivre_integrations para marketplace_integrations';
    END IF;
END $$;

-- Fim da migração
