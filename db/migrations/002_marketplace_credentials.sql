-- Migration: Credenciais de Marketplace por Cliente
-- Data: 2025-12-12
-- Objetivo: Permitir admin cadastrar credenciais OAuth de cada marketplace para cada cliente

-- Criar tabela de credenciais de marketplace
CREATE TABLE IF NOT EXISTS marketplace_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  marketplace VARCHAR(50) NOT NULL, -- 'mercado_livre', 'amazon', 'shopee', etc
  
  -- Credenciais OAuth
  client_id VARCHAR(255) NOT NULL,
  client_secret TEXT NOT NULL, -- Criptografado
  
  -- Configurações adicionais (JSON)
  config JSONB DEFAULT '{}',
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER, -- ID do admin que cadastrou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Um usuário pode ter apenas uma credencial por marketplace
  UNIQUE(user_id, marketplace)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_marketplace_creds_user_id ON marketplace_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_creds_tenant_id ON marketplace_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_creds_marketplace ON marketplace_credentials(marketplace);
CREATE INDEX IF NOT EXISTS idx_marketplace_creds_is_active ON marketplace_credentials(is_active);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_marketplace_credentials_updated_at 
  BEFORE UPDATE ON marketplace_credentials 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE marketplace_credentials IS 'Credenciais OAuth de marketplaces cadastradas pelo admin para cada cliente';
COMMENT ON COLUMN marketplace_credentials.user_id IS 'ID do cliente/usuário dono destas credenciais';
COMMENT ON COLUMN marketplace_credentials.marketplace IS 'Nome do marketplace (mercado_livre, amazon, shopee, etc)';
COMMENT ON COLUMN marketplace_credentials.client_id IS 'Client ID do aplicativo OAuth do marketplace';
COMMENT ON COLUMN marketplace_credentials.client_secret IS 'Client Secret criptografado';
COMMENT ON COLUMN marketplace_credentials.config IS 'Configurações adicionais (redirect_uri, scopes, etc)';
COMMENT ON COLUMN marketplace_credentials.created_by IS 'ID do admin que cadastrou estas credenciais';

-- Inserir credenciais padrão do sistema (opcional - pode ser removido)
-- INSERT INTO marketplace_credentials (user_id, tenant_id, marketplace, client_id, client_secret, created_by, config)
-- SELECT 
--   1, -- user_id do primeiro admin
--   1, -- tenant_id
--   'mercado_livre',
--   '6702284202610735',
--   'co8Zb40AZvmMIvnhLk0vfRwuxPCESNac', -- Será criptografado pela aplicação
--   1, -- created_by
--   '{"redirect_uri": "https://www.markthubcrm.com.br/api/integrations/mercadolivre/auth/callback"}'::jsonb
-- WHERE NOT EXISTS (
--   SELECT 1 FROM marketplace_credentials WHERE marketplace = 'mercado_livre' AND user_id = 1
-- );
