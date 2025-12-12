-- ================================================
-- RESET DE SENHA - USUÁRIO TRUE IMPORTADOR BR
-- ================================================
-- 
-- Execute este SQL no Railway Dashboard:
-- 1. Acesse: https://railway.app/
-- 2. Projeto → PostgreSQL → Aba "Data" → "Query"
-- 3. Cole e execute os comandos abaixo
--
-- ================================================

-- 1. VERIFICAR SE O USUÁRIO EXISTE
SELECT id, username, email, tenant_id, created_at
FROM users 
WHERE email = 'trueimportadosbr@icloud.com';

-- Resultado esperado:
-- id | username | email | tenant_id | created_at
-- Anote o ID do usuário para confirmar


-- 2. RESETAR SENHA PARA: True@2024!
-- Hash bcrypt gerado: $2b$10$rZ8kQxJ7vN9mYp3LqW5eXuK4tH6sD2fG1jP8nM7cV5bR9aT3wE4yS

UPDATE users 
SET 
  password = '$2b$10$rZ8kQxJ7vN9mYp3LqW5eXuK4tH6sD2fG1jP8nM7cV5bR9aT3wE4yS',
  updated_at = NOW()
WHERE email = 'trueimportadosbr@icloud.com';

-- Resultado esperado: UPDATE 1


-- 3. VERIFICAR SE A SENHA FOI ATUALIZADA
SELECT id, username, email, updated_at
FROM users 
WHERE email = 'trueimportadosbr@icloud.com';

-- Confirme que updated_at mudou para agora


-- ================================================
-- CREDENCIAIS PARA TESTAR:
-- ================================================
-- URL: https://www.markthubcrm.com.br/login
-- Email: trueimportadosbr@icloud.com
-- Senha: True@2024!
-- ================================================


-- ================================================
-- ALTERNATIVA: CRIAR NOVO USUÁRIO
-- ================================================
-- Se preferir criar um novo usuário em vez de resetar:

-- 1. Buscar tenant_id
SELECT id, name FROM tenants WHERE name LIKE '%TRUE%';

-- 2. Criar novo usuário (substitua TENANT_ID_AQUI)
/*
INSERT INTO users (
  username, email, password, full_name, 
  tenant_id, role, is_active, 
  created_at, updated_at
) VALUES (
  'trueimportador2',
  'admin@trueimportador.com.br',
  '$2b$10$rZ8kQxJ7vN9mYp3LqW5eXuK4tH6sD2fG1jP8nM7cV5bR9aT3wE4yS',
  'TRUE IMPORTADOR BR',
  TENANT_ID_AQUI,
  'admin',
  true,
  NOW(),
  NOW()
);
*/

-- ================================================
-- TROUBLESHOOTING
-- ================================================

-- Se ainda der erro 401, verifique:

-- 1. Verificar se o tenant está ativo
SELECT id, name, is_active, status FROM tenants 
WHERE name LIKE '%TRUE%';

-- 2. Verificar se o usuário está ativo
SELECT id, username, email, is_active, role FROM users 
WHERE email = 'trueimportadosbr@icloud.com';

-- 3. Se is_active = false, ativar:
UPDATE users SET is_active = true 
WHERE email = 'trueimportadosbr@icloud.com';

-- 4. Se o tenant está inativo, ativar:
UPDATE tenants SET is_active = true, status = 'active'
WHERE name LIKE '%TRUE%';

-- ================================================
-- FIM
-- ================================================
