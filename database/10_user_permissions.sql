-- Migration: Criar tabela de permissões de usuários
-- Data: 2025-12-13

-- Criar tabela de permissões
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, module_name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON user_permissions(module_name);

-- Inserir permissões padrão para todos os usuários existentes
-- Módulos do sistema
INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
  u.id,
  m.module_name,
  true,  -- can_view
  true,  -- can_create
  true,  -- can_edit
  true   -- can_delete
FROM users u
CROSS JOIN (
  VALUES 
    ('pedidos'),
    ('produtos'),
    ('clientes'),
    ('anuncios'),
    ('entregas'),
    ('notas_fiscais'),
    ('pos_vendas'),
    ('importacao'),
    ('inteligencia_mercado'),
    ('tabela_precos'),
    ('contas_pagar'),
    ('contas_receber'),
    ('fluxo_caixa'),
    ('calculadora_taxas'),
    ('relatorios'),
    ('analise_vendas'),
    ('metricas'),
    ('mercadolivre'),
    ('importacao_financeira'),
    ('painel_master'),
    ('usuarios'),
    ('status_integracoes'),
    ('monitoramento_apis'),
    ('configuracoes')
) AS m(module_name)
ON CONFLICT (user_id, module_name) DO NOTHING;

-- Comentários
COMMENT ON TABLE user_permissions IS 'Permissões granulares por módulo para cada usuário';
COMMENT ON COLUMN user_permissions.module_name IS 'Nome do módulo/funcionalidade do sistema';
COMMENT ON COLUMN user_permissions.can_view IS 'Permissão para visualizar dados do módulo';
COMMENT ON COLUMN user_permissions.can_create IS 'Permissão para criar novos registros';
COMMENT ON COLUMN user_permissions.can_edit IS 'Permissão para editar registros existentes';
COMMENT ON COLUMN user_permissions.can_delete IS 'Permissão para excluir registros';
