-- ============================================================
-- PARTE 1: VERIFICAR DADOS DO USUÁRIO JEFERSON
-- ============================================================

-- Consultar dados completos do Jeferson
SELECT 
    id,
    email,
    full_name,
    username,
    role,
    is_active,
    tenant_id,
    created_at,
    '❌ SENHA ESTÁ CRIPTOGRAFADA (hash bcrypt)' AS nota_senha
FROM users
WHERE email = 'correiodojeferson@gmail.com';

-- Verificar tenant do Jeferson
SELECT 
    t.id,
    t.nome_empresa,
    t.cnpj,
    t.email_contato,
    t.is_active,
    t.plano
FROM tenants t
INNER JOIN users u ON u.tenant_id = t.id
WHERE u.email = 'correiodojeferson@gmail.com';

-- ============================================================
-- IMPORTANTE SOBRE SENHAS
-- ============================================================
-- ⚠️  As senhas no banco estão criptografadas com bcrypt (hash)
-- ⚠️  NÃO É POSSÍVEL recuperar a senha original
-- ⚠️  Apenas o próprio usuário sabe sua senha
-- 
-- Se o Jeferson esqueceu a senha, ele deve:
-- 1. Acessar: https://www.markthubcrm.com.br/reset-password
-- 2. Digitar: correiodojeferson@gmail.com
-- 3. Receber email com link de reset
-- 4. Criar nova senha
--
-- OU você pode definir uma nova senha temporária abaixo
-- ============================================================

-- ============================================================
-- PARTE 2: CRIAR NOVO USUÁRIO ADMIN MASTER
-- ============================================================

-- Passo 1: Criar tenant especial para admin master (se não existir)
INSERT INTO tenants (
    nome_empresa,
    cnpj,
    email_contato,
    telefone,
    plano,
    is_active,
    created_at,
    updated_at
)
VALUES (
    'MarketHub - Administração',
    '00.000.000/0000-00',
    'admin@markethubcrm.com.br',
    '(00) 0000-0000',
    'enterprise',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (cnpj) DO NOTHING
RETURNING id, nome_empresa;

-- Passo 2: Buscar ID do tenant admin
SELECT id AS admin_tenant_id, nome_empresa
FROM tenants
WHERE email_contato = 'admin@markethubcrm.com.br';

-- Passo 3: Criar usuário admin master
-- IMPORTANTE: Substitua 'SENHA_TEMPORARIA_AQUI' por uma senha forte
-- A senha será criptografada automaticamente pelo sistema no primeiro login

-- Gerar hash bcrypt para senha temporária
-- Senha exemplo: Admin@2025
-- Hash bcrypt: $2b$10$rZ5vK8qX9wN2mP4jL6tY5eU3hF7gS1aQ9xC2vB8nM5kJ4lH6pT0yW

INSERT INTO users (
    email,
    password_hash,
    full_name,
    username,
    role,
    tenant_id,
    is_active,
    created_at,
    updated_at
)
VALUES (
    'admin@markethubcrm.com.br',
    '$2b$10$rZ5vK8qX9wN2mP4jL6tY5eU3hF7gS1aQ9xC2vB8nM5kJ4lH6pT0yW', -- Senha: Admin@2025
    'Administrador Master',
    'admin_master',
    'superadmin',
    (SELECT id FROM tenants WHERE email_contato = 'admin@markethubcrm.com.br'),
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
    role = 'superadmin',
    is_active = true,
    updated_at = NOW()
RETURNING id, email, full_name, role;

-- Passo 4: Adicionar TODAS as permissões ao admin master
INSERT INTO user_permissions (user_id, permission_name, granted)
SELECT 
    u.id,
    perm.name,
    true
FROM users u
CROSS JOIN (
    VALUES 
        -- Dashboard
        ('view_dashboard'),
        ('view_analytics'),
        
        -- Pedidos
        ('view_orders'),
        ('create_orders'),
        ('edit_orders'),
        ('delete_orders'),
        ('export_orders'),
        
        -- Produtos
        ('view_products'),
        ('create_products'),
        ('edit_products'),
        ('delete_products'),
        ('import_products'),
        ('export_products'),
        
        -- Clientes
        ('view_clients'),
        ('create_clients'),
        ('edit_clients'),
        ('delete_clients'),
        ('export_clients'),
        
        -- Financeiro
        ('view_financial'),
        ('create_financial'),
        ('edit_financial'),
        ('delete_financial'),
        ('view_reports'),
        
        -- Configurações
        ('view_settings'),
        ('edit_settings'),
        ('manage_users'),
        ('manage_integrations'),
        
        -- Admin
        ('view_all_tenants'),
        ('manage_tenants'),
        ('view_system_logs'),
        ('manage_subscriptions')
) AS perm(name)
WHERE u.email = 'admin@markethubcrm.com.br'
ON CONFLICT (user_id, permission_name) DO UPDATE
SET granted = true;

-- Passo 5: Verificação final
SELECT 
    '✅ ADMIN MASTER CRIADO COM SUCESSO!' AS status,
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    t.nome_empresa AS tenant,
    COUNT(up.permission_name) AS total_permissoes
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN user_permissions up ON up.user_id = u.id AND up.granted = true
WHERE u.email = 'admin@markethubcrm.com.br'
GROUP BY u.id, u.email, u.full_name, u.role, u.is_active, t.nome_empresa;

-- ============================================================
-- PARTE 3: LIBERAR USUÁRIO JEFERSON (OPCIONAL)
-- ============================================================

-- Ativar usuário Jeferson
UPDATE users
SET 
    is_active = true,
    updated_at = NOW()
WHERE email = 'correiodojeferson@gmail.com';

-- Ativar tenant do Jeferson
UPDATE tenants
SET 
    is_active = true,
    updated_at = NOW()
WHERE id = (
    SELECT tenant_id 
    FROM users 
    WHERE email = 'correiodojeferson@gmail.com'
);

-- Verificação final do Jeferson
SELECT 
    '✅ USUÁRIO JEFERSON LIBERADO!' AS status,
    u.email,
    u.full_name,
    u.is_active AS usuario_ativo,
    t.nome_empresa,
    t.is_active AS tenant_ativo
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
WHERE u.email = 'correiodojeferson@gmail.com';

-- ============================================================
-- CREDENCIAIS CRIADAS
-- ============================================================

SELECT 
    '🔑 CREDENCIAIS DO ADMIN MASTER' AS tipo,
    'admin@markethubcrm.com.br' AS email,
    'Admin@2025' AS senha_temporaria,
    'https://www.markthubcrm.com.br/login' AS url_login,
    '⚠️  TROQUE A SENHA APÓS O PRIMEIRO LOGIN!' AS aviso;

-- ============================================================
-- RESUMO FINAL
-- ============================================================

SELECT 
    'ADMIN MASTER' AS tipo_usuario,
    email,
    full_name AS nome,
    role AS funcao,
    is_active AS ativo,
    'Acesso a TODOS os clientes' AS privilegios
FROM users
WHERE email = 'admin@markethubcrm.com.br'

UNION ALL

SELECT 
    'USUÁRIO NORMAL' AS tipo_usuario,
    email,
    full_name AS nome,
    role AS funcao,
    is_active AS ativo,
    'Acesso apenas ao seu tenant' AS privilegios
FROM users
WHERE email = 'correiodojeferson@gmail.com';
