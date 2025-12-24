-- Migration: Criar tabela de tokens de recuperação de senha
-- Criado em: 2025-12-24

-- Criar tabela password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    CONSTRAINT unique_user_token UNIQUE (user_id)
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash 
ON password_reset_tokens(token_hash);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id 
ON password_reset_tokens(user_id);

-- Índice para limpeza de tokens expirados
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at 
ON password_reset_tokens(expires_at);

-- Comentários
COMMENT ON TABLE password_reset_tokens IS 'Tokens de recuperação de senha com validade de 1 hora';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'Hash SHA256 do token enviado por email';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data/hora de expiração do token (1 hora após criação)';

-- Função para limpar tokens expirados automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION cleanup_expired_reset_tokens IS 'Remove tokens de reset de senha expirados';
