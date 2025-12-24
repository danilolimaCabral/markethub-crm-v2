-- ============================================
-- SCRIPT PARA LIBERAR USUÁRIO JEFERSON
-- Email: correiodojeferson@gmail.com
-- Status: Tem tenant próprio
-- ============================================

-- 1. VERIFICAR STATUS ATUAL DO USUÁRIO
SELECT 
    id,
    email,
    full_name,
    username,
    role,
    is_active,
    tenant_id,
    created_at,
    last_login_at,
    updated_at
FROM users
WHERE email = 'correiodojeferson@gmail.com';

-- 2. ATIVAR USUÁRIO (se is_active = false)
UPDATE users
SET 
    is_active = true,
    updated_at = NOW()
WHERE email = 'correiodojeferson@gmail.com';

-- 3. VERIFICAR SE FOI ATIVADO
SELECT 
    id,
    email,
    full_name,
    is_active,
    role,
    tenant_id
FROM users
WHERE email = 'correiodojeferson@gmail.com';

-- 4. VERIFICAR INFORMAÇÕES DO TENANT
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.is_active as tenant_ativo,
    t.created_at as tenant_criado_em,
    u.email as usuario_email,
    u.full_name as usuario_nome,
    u.is_active as usuario_ativo
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
WHERE u.email = 'correiodojeferson@gmail.com';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Após executar o UPDATE, o usuário deve estar:
-- ✅ is_active = true
-- ✅ tenant_id = [ID do tenant dele]
-- ✅ Pode fazer login normalmente
-- ============================================

-- ============================================
-- SE PRECISAR RESETAR SENHA:
-- ============================================
-- O usuário pode usar o link de reset de senha:
-- https://www.markthubcrm.com.br/reset-password
-- 
-- Ou você pode gerar uma nova senha temporária:
-- UPDATE users
-- SET password_hash = '$2a$10$YourHashHere'
-- WHERE email = 'correiodojeferson@gmail.com';
-- ============================================

-- ============================================
-- VERIFICAR PERMISSÕES DO USUÁRIO
-- ============================================
SELECT 
    up.module_name,
    up.can_view,
    up.can_create,
    up.can_edit,
    up.can_delete
FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email = 'correiodojeferson@gmail.com'
ORDER BY up.module_name;

-- ============================================
-- SE NÃO TIVER PERMISSÕES, ADICIONAR PERMISSÕES BÁSICAS
-- ============================================
-- (Execute apenas se necessário)
/*
INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
    u.id,
    'pedidos' as module_name,
    true as can_view,
    true as can_create,
    true as can_edit,
    false as can_delete
FROM users u
WHERE u.email = 'correiodojeferson@gmail.com'
ON CONFLICT (user_id, module_name) DO NOTHING;

INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
    u.id,
    'produtos' as module_name,
    true as can_view,
    true as can_create,
    true as can_edit,
    false as can_delete
FROM users u
WHERE u.email = 'correiodojeferson@gmail.com'
ON CONFLICT (user_id, module_name) DO NOTHING;

INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
    u.id,
    'clientes' as module_name,
    true as can_view,
    true as can_create,
    true as can_edit,
    false as can_delete
FROM users u
WHERE u.email = 'correiodojeferson@gmail.com'
ON CONFLICT (user_id, module_name) DO NOTHING;
*/

-- ============================================
-- LOGS DE AUDITORIA (OPCIONAL)
-- ============================================
-- Verificar últimas atividades do usuário
SELECT 
    created_at,
    action,
    details
FROM audit_logs
WHERE user_id = (SELECT id FROM users WHERE email = 'correiodojeferson@gmail.com')
ORDER BY created_at DESC
LIMIT 10;
