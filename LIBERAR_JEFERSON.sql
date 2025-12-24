-- ============================================================
-- SCRIPT PARA LIBERAR USUÁRIO JEFERSON
-- Email: correiodojeferson@gmail.com
-- ============================================================

-- Passo 1: Verificar status atual do usuário
SELECT 
    id,
    email,
    full_name,
    is_active,
    tenant_id,
    role,
    created_at,
    updated_at
FROM users
WHERE email = 'correiodojeferson@gmail.com';

-- Passo 2: Ativar usuário (is_active = true)
UPDATE users
SET 
    is_active = true,
    updated_at = NOW()
WHERE email = 'correiodojeferson@gmail.com';

-- Passo 3: Confirmar ativação
SELECT 
    id,
    email,
    full_name,
    is_active AS "Status Ativo",
    tenant_id AS "ID do Tenant",
    role AS "Função",
    updated_at AS "Última Atualização"
FROM users
WHERE email = 'correiodojeferson@gmail.com';

-- Passo 4: Verificar tenant do usuário
SELECT 
    t.id,
    t.nome_empresa AS "Nome da Empresa",
    t.is_active AS "Tenant Ativo",
    t.plano AS "Plano",
    t.created_at AS "Criado em"
FROM tenants t
INNER JOIN users u ON u.tenant_id = t.id
WHERE u.email = 'correiodojeferson@gmail.com';

-- Passo 5: Ativar tenant (se necessário)
UPDATE tenants
SET 
    is_active = true,
    updated_at = NOW()
WHERE id = (
    SELECT tenant_id 
    FROM users 
    WHERE email = 'correiodojeferson@gmail.com'
);

-- Passo 6: Verificar permissões do usuário
SELECT 
    up.user_id,
    up.permission_name AS "Permissão",
    up.granted AS "Concedida"
FROM user_permissions up
INNER JOIN users u ON u.id = up.user_id
WHERE u.email = 'correiodojeferson@gmail.com';

-- Passo 7: Adicionar permissões básicas (se não existirem)
-- Permissões essenciais para uso do sistema
INSERT INTO user_permissions (user_id, permission_name, granted)
SELECT 
    u.id,
    perm.name,
    true
FROM users u
CROSS JOIN (
    VALUES 
        ('view_dashboard'),
        ('view_orders'),
        ('create_orders'),
        ('edit_orders'),
        ('view_products'),
        ('create_products'),
        ('edit_products'),
        ('view_clients'),
        ('create_clients'),
        ('edit_clients')
) AS perm(name)
WHERE u.email = 'correiodojeferson@gmail.com'
ON CONFLICT (user_id, permission_name) DO NOTHING;

-- Passo 8: Verificação final completa
SELECT 
    '✅ USUÁRIO LIBERADO COM SUCESSO!' AS "Status",
    u.email AS "Email",
    u.full_name AS "Nome",
    u.is_active AS "Ativo",
    t.nome_empresa AS "Empresa",
    t.is_active AS "Tenant Ativo",
    COUNT(up.permission_name) AS "Permissões Concedidas"
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN user_permissions up ON up.user_id = u.id AND up.granted = true
WHERE u.email = 'correiodojeferson@gmail.com'
GROUP BY u.id, u.email, u.full_name, u.is_active, t.nome_empresa, t.is_active;

-- ============================================================
-- VERIFICAÇÃO: ADMIN MASTER NÃO DEVE APARECER
-- ============================================================

-- Esta query NÃO deve retornar o admin master
SELECT 
    email,
    full_name,
    role
FROM users
WHERE email != 'admin@markethubcrm.com.br'
AND is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================

-- 1. Copie este script
-- 2. Acesse Railway Dashboard
-- 3. Vá em Postgres → Data → Query
-- 4. Cole e execute cada query uma por vez
-- 5. Verifique os resultados
-- 6. Usuário estará liberado!

-- Após liberar, o usuário pode fazer login em:
-- https://www.markthubcrm.com.br/login
-- Email: correiodojeferson@gmail.com
-- Senha: (a senha que ele cadastrou)

-- Se ele esqueceu a senha, pode resetar em:
-- https://www.markthubcrm.com.br/reset-password
