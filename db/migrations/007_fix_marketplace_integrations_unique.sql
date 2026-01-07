-- Migration: Corrigir Constraint UNIQUE na Tabela marketplace_integrations
-- Data: 2026-01-06
-- Objetivo: Permitir que múltiplos tenants conectem ao mesmo marketplace
-- Prioridade: CRÍTICA

-- ============================================================================
-- PROBLEMA IDENTIFICADO:
-- ============================================================================
-- A tabela marketplace_integrations (se existir no schema antigo) possui uma 
-- constraint UNIQUE no campo 'marketplace', impedindo que múltiplos tenants
-- conectem ao mesmo marketplace (ex: Mercado Livre).
--
-- Esta migration corrige isso criando uma constraint composta (tenant_id, marketplace)
-- ============================================================================

-- ============================================================================
-- PARTE 1: VERIFICAR SE A TABELA EXISTE
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_integrations') THEN
    RAISE NOTICE '✅ Tabela marketplace_integrations encontrada. Aplicando correções...';
  ELSE
    RAISE NOTICE 'ℹ️  Tabela marketplace_integrations não existe. Esta migration será pulada.';
    RAISE NOTICE 'ℹ️  O sistema usa mercadolivre_integrations (multi-tenant nativo).';
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: REMOVER CONSTRAINT UNIQUE ANTIGA (SE EXISTIR)
-- ============================================================================

-- Remover constraint UNIQUE no campo 'marketplace' (se existir)
ALTER TABLE IF EXISTS marketplace_integrations 
DROP CONSTRAINT IF EXISTS marketplace_integrations_marketplace_key;

-- Remover outras possíveis variações do nome da constraint
ALTER TABLE IF EXISTS marketplace_integrations 
DROP CONSTRAINT IF EXISTS marketplace_integrations_marketplace_unique;

ALTER TABLE IF EXISTS marketplace_integrations 
DROP CONSTRAINT IF EXISTS uq_marketplace_integrations_marketplace;

-- ============================================================================
-- PARTE 3: ADICIONAR CONSTRAINT UNIQUE COMPOSTA
-- ============================================================================

-- Adicionar constraint UNIQUE composta (tenant_id, marketplace)
-- Isso permite que cada tenant tenha UMA integração por marketplace
ALTER TABLE IF EXISTS marketplace_integrations 
ADD CONSTRAINT marketplace_integrations_tenant_marketplace_unique 
UNIQUE (tenant_id, marketplace);

-- ============================================================================
-- PARTE 4: VERIFICAR SE TENANT_ID EXISTE
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_integrations' AND column_name = 'tenant_id'
  ) THEN
    RAISE NOTICE '✅ Coluna tenant_id existe na tabela marketplace_integrations';
  ELSE
    RAISE WARNING '⚠️  Coluna tenant_id NÃO existe na tabela marketplace_integrations';
    RAISE WARNING '⚠️  Adicione a coluna tenant_id antes de executar esta migration';
  END IF;
END $$;

-- ============================================================================
-- PARTE 5: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para busca por tenant
CREATE INDEX IF NOT EXISTS idx_marketplace_integrations_tenant_id 
ON marketplace_integrations(tenant_id);

-- Índice para busca por marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_integrations_marketplace 
ON marketplace_integrations(marketplace);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_marketplace_integrations_is_active 
ON marketplace_integrations(is_active);

-- ============================================================================
-- PARTE 6: ATUALIZAR COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE marketplace_integrations IS 'Integrações com marketplaces (multi-tenant: um marketplace por tenant)';

-- ============================================================================
-- SUCESSO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ MIGRATION 007 CONCLUÍDA COM SUCESSO';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações realizadas:';
  RAISE NOTICE '  ✅ Constraint UNIQUE antiga removida';
  RAISE NOTICE '  ✅ Nova constraint UNIQUE (tenant_id, marketplace) adicionada';
  RAISE NOTICE '  ✅ Índices de performance criados';
  RAISE NOTICE '';
  RAISE NOTICE 'Resultado:';
  RAISE NOTICE '  ✅ Múltiplos tenants podem conectar ao mesmo marketplace';
  RAISE NOTICE '  ✅ Cada tenant tem apenas UMA integração por marketplace';
  RAISE NOTICE '  ✅ Arquitetura multi-tenant corrigida';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
