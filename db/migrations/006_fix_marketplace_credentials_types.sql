-- Migration: Corrigir Tipos de ID na Tabela marketplace_credentials
-- Data: 2026-01-06
-- Objetivo: Alinhar tipos de user_id e tenant_id com as tabelas de referência (UUID)
-- Prioridade: CRÍTICA

-- ============================================================================
-- PARTE 1: BACKUP E PREPARAÇÃO
-- ============================================================================

-- Criar tabela de backup antes de fazer alterações
CREATE TABLE IF NOT EXISTS marketplace_credentials_backup AS 
SELECT * FROM marketplace_credentials;

COMMENT ON TABLE marketplace_credentials_backup IS 'Backup da tabela marketplace_credentials antes da correção de tipos (2026-01-06)';

-- ============================================================================
-- PARTE 2: REMOVER CONSTRAINTS EXISTENTES
-- ============================================================================

-- Remover foreign keys existentes (que estão incorretas)
ALTER TABLE marketplace_credentials 
DROP CONSTRAINT IF EXISTS marketplace_credentials_user_id_fkey;

ALTER TABLE marketplace_credentials 
DROP CONSTRAINT IF EXISTS marketplace_credentials_tenant_id_fkey;

ALTER TABLE marketplace_credentials 
DROP CONSTRAINT IF EXISTS marketplace_credentials_created_by_fkey;

-- ============================================================================
-- PARTE 3: ALTERAR TIPOS DE COLUNAS
-- ============================================================================

-- Alterar user_id de INTEGER para UUID
-- Nota: Se houver dados existentes com IDs inválidos, esta operação falhará
-- Neste caso, os dados devem ser corrigidos manualmente primeiro
ALTER TABLE marketplace_credentials 
ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

-- Alterar tenant_id de INTEGER para UUID
ALTER TABLE marketplace_credentials 
ALTER COLUMN tenant_id TYPE UUID USING tenant_id::text::uuid;

-- Alterar created_by de INTEGER para UUID (pode ser NULL)
ALTER TABLE marketplace_credentials 
ALTER COLUMN created_by TYPE UUID USING 
  CASE 
    WHEN created_by IS NULL THEN NULL
    ELSE created_by::text::uuid
  END;

-- ============================================================================
-- PARTE 4: RECRIAR FOREIGN KEYS CORRETAS
-- ============================================================================

-- Adicionar foreign key para user_id
ALTER TABLE marketplace_credentials 
ADD CONSTRAINT marketplace_credentials_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Adicionar foreign key para tenant_id
ALTER TABLE marketplace_credentials 
ADD CONSTRAINT marketplace_credentials_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Adicionar foreign key para created_by
ALTER TABLE marketplace_credentials 
ADD CONSTRAINT marketplace_credentials_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- PARTE 5: VERIFICAÇÃO E VALIDAÇÃO
-- ============================================================================

-- Verificar se os tipos estão corretos
DO $$
DECLARE
  user_id_type text;
  tenant_id_type text;
  created_by_type text;
BEGIN
  SELECT data_type INTO user_id_type
  FROM information_schema.columns
  WHERE table_name = 'marketplace_credentials' AND column_name = 'user_id';
  
  SELECT data_type INTO tenant_id_type
  FROM information_schema.columns
  WHERE table_name = 'marketplace_credentials' AND column_name = 'tenant_id';
  
  SELECT data_type INTO created_by_type
  FROM information_schema.columns
  WHERE table_name = 'marketplace_credentials' AND column_name = 'created_by';
  
  IF user_id_type != 'uuid' OR tenant_id_type != 'uuid' OR created_by_type != 'uuid' THEN
    RAISE EXCEPTION 'Tipos de colunas não foram alterados corretamente: user_id=%, tenant_id=%, created_by=%', 
      user_id_type, tenant_id_type, created_by_type;
  END IF;
  
  RAISE NOTICE '✅ Tipos de colunas alterados com sucesso: user_id=%, tenant_id=%, created_by=%', 
    user_id_type, tenant_id_type, created_by_type;
END $$;

-- ============================================================================
-- PARTE 6: ATUALIZAR COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN marketplace_credentials.user_id IS 'ID do cliente/usuário dono destas credenciais (UUID)';
COMMENT ON COLUMN marketplace_credentials.tenant_id IS 'ID do tenant ao qual este usuário pertence (UUID)';
COMMENT ON COLUMN marketplace_credentials.created_by IS 'ID do admin que cadastrou estas credenciais (UUID)';

-- ============================================================================
-- SUCESSO
-- ============================================================================

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ MIGRATION 006 CONCLUÍDA COM SUCESSO';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações realizadas:';
  RAISE NOTICE '  ✅ user_id: INTEGER → UUID';
  RAISE NOTICE '  ✅ tenant_id: INTEGER → UUID';
  RAISE NOTICE '  ✅ created_by: INTEGER → UUID';
  RAISE NOTICE '  ✅ Foreign keys recriadas corretamente';
  RAISE NOTICE '  ✅ Backup criado: marketplace_credentials_backup';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  1. Verificar se a aplicação está funcionando';
  RAISE NOTICE '  2. Testar integração com Mercado Livre';
  RAISE NOTICE '  3. Se tudo estiver OK, remover backup após 7 dias';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
