-- Migration: Multi-Tenant Mercado Livre Integration
-- Data: 2025-12-12
-- Objetivo: Garantir que cada usuário tenha sua própria conexão ML

-- Criar tabela de integrações se não existir
CREATE TABLE IF NOT EXISTS mercadolivre_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  ml_user_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id) -- Cada usuário tem apenas UMA integração ativa
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ml_integrations_user_id ON mercadolivre_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_integrations_tenant_id ON mercadolivre_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ml_integrations_is_active ON mercadolivre_integrations(is_active);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ml_integrations_updated_at 
  BEFORE UPDATE ON mercadolivre_integrations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE mercadolivre_integrations IS 'Armazena tokens OAuth2 do Mercado Livre por usuário (multi-tenant)';
COMMENT ON COLUMN mercadolivre_integrations.user_id IS 'ID do usuário/cliente dono desta integração';
COMMENT ON COLUMN mercadolivre_integrations.ml_user_id IS 'ID do usuário no Mercado Livre';
COMMENT ON COLUMN mercadolivre_integrations.access_token IS 'Token de acesso OAuth2 (criptografado)';
COMMENT ON COLUMN mercadolivre_integrations.refresh_token IS 'Token de refresh OAuth2 (criptografado)';
COMMENT ON COLUMN mercadolivre_integrations.is_active IS 'Se a integração está ativa (false = desconectado)';
